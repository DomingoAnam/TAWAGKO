import { Platform } from 'react-native';
import Constants from 'expo-constants';
import { isRunningInExpoGo } from 'expo';
import * as Notifications from 'expo-notifications';
import { supabase } from './supabase';
import { getCurrentUser } from './storage';

const CHANNEL_ID = 'assistance';

// Show the real banner even when the app is open in the foreground.
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export type PushTarget = 'personnel' | 'resident';

/**
 * True when running inside the Expo Go sandbox. Expo Go cannot obtain a push
 * token on Android (removed in SDK 53), so we skip registration there instead
 * of triggering the library's hard error. Local notifications still work.
 */
const isExpoGo = () => {
  try {
    // Same check expo-notifications uses internally before it throws.
    if (isRunningInExpoGo()) return true;
  } catch {
    // Ignore and fall through to the manifest checks.
  }
  const c = Constants as any;
  return c?.appOwnership === 'expo' || !!c?.expoGoConfig;
};

const projectId =
  (Constants as any)?.expoConfig?.extra?.eas?.projectId ??
  (Constants as any)?.easConfig?.projectId ??
  'ab7c3b2e-fdf8-4a50-95a5-bb60f4dd000d';

/**
 * Ask for permission and upload this device's Expo push token.
 * Safe to call on every app start: it no-ops once permission is settled.
 * Returns the token, or null if notifications are unavailable/denied.
 */
export const registerForPushNotifications = async (): Promise<string | null> => {
  try {
    if (Platform.OS === 'android') {
      // Must exist before requesting permission on Android 13+.
      await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
        name: 'Assistance and updates',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#045FE4',
      });
    }

    const existing = await Notifications.getPermissionsAsync();
    let status = existing.status;
    if (status !== 'granted') {
      const requested = await Notifications.requestPermissionsAsync();
      status = requested.status;
    }
    if (status !== 'granted') return null;

    // Expo Go cannot register for remote push; bail out quietly.
    if (isExpoGo()) return null;

    const me = await getCurrentUser();
    if (!me?.id) return null;

    const tokenResult = await Notifications.getExpoPushTokenAsync({ projectId });
    const token = tokenResult?.data;
    if (!token) return null;

    const { error } = await supabase.rpc('register_push_token', {
      p_user_id: me.id,
      p_token: token,
      p_platform: Platform.OS,
    });
    if (error) return null;

    return token;
  } catch {
    // Expo Go on Android cannot do remote push; local notifications still work.
    return null;
  }
};

/** Remove this device's token (called on logout). */
export const unregisterPushToken = async (token: string) => {
  try {
    await supabase.rpc('unregister_push_token', { p_token: token });
  } catch {
    // Best effort.
  }
};

/**
 * Fire an immediate local notification. This is what produces the heads-up
 * banner on the device; unlike a toast it also lands in the notification tray.
 */
export const notifyNow = async (title: string, body: string, data?: Record<string, any>) => {
  try {
    await Notifications.scheduleNotificationAsync({
      content: { title, body, data: data ?? {}, sound: true },
      trigger: null,
    });
  } catch {
    // Permission may have been denied; nothing to do.
  }
};

type TokenRow = { token: string; platform: string | null; userId: string };

const sendToExpo = async (tokens: string[], title: string, body: string, data: Record<string, any>) => {
  if (tokens.length === 0) return;
  const messages = tokens.map((to) => ({
    to,
    sound: 'default',
    title,
    body,
    data,
  }));

  // Expo's push endpoint accepts up to 100 messages per call.
  for (let i = 0; i < messages.length; i += 100) {
    const chunk = messages.slice(i, i + 100);
    try {
      await fetch('https://exp.host/--/api/v2/push/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(chunk),
      });
    } catch {
      // Offline; the notification will be delivered on the next attempt.
    }
  }
};

/**
 * Push to every personnel device, or to one specific user's devices.
 * Called by the acting party right after it changes something in the database,
 * so the recipient is notified even if the app is closed.
 */
export const pushToRole = async (
  role: PushTarget,
  title: string,
  body: string,
  data: Record<string, any> = {}
) => {
  try {
    const { data } = await supabase.rpc('list_push_tokens', { p_role: role });
    const rows: TokenRow[] = Array.isArray(data) ? data : [];
    await sendToExpo(rows.map((r) => r.token), title, body, data);
  } catch {
    // Never let a failed push break the user's action.
  }
};

export const pushToUser = async (
  userId: string,
  title: string,
  body: string,
  data: Record<string, any> = {}
) => {
  try {
    const { data } = await supabase.rpc('list_push_tokens', {
      p_role: null,
      p_user_id: userId,
    });
    const rows: TokenRow[] = Array.isArray(data) ? data : [];
    await sendToExpo(rows.map((r) => r.token), title, body, data);
  } catch {
    // Best effort.
  }
};

export const setBadgeCount = async (count: number) => {
  try {
    await Notifications.setBadgeCountAsync(count);
  } catch {
    // Not all Android launchers support badges.
  }
};