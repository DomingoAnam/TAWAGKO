import { Platform } from 'react-native';
import Constants from 'expo-constants';
import { isRunningInExpoGo } from 'expo';
import { supabase } from './supabase';
import { getCurrentUser } from './storage';
import { presentBanner } from './bannerStore';

const CHANNEL_ID = 'assistance';

export type PushTarget = 'personnel' | 'resident';

/**
 * True when running inside the Expo Go sandbox. Expo Go cannot create a
 * notification channel or obtain a push token on Android (removed in SDK 53),
 * and expo-notifications throws a hard error there, so we never load it.
 */
export const isExpoGo = () => {
  try {
    if (isRunningInExpoGo()) return true;
  } catch {
    // Fall through to the manifest checks.
  }
  const c = Constants as any;
  return c?.appOwnership === 'expo' || !!c?.expoGoConfig;
};

const projectId =
  (Constants as any)?.expoConfig?.extra?.eas?.projectId ??
  (Constants as any)?.easConfig?.projectId ??
  'ab7c3b2e-fdf8-4a50-95a5-bb60f4dd000d';

/**
 * Loads expo-notifications on demand. Never called in Expo Go, which is what
 * keeps the "remote notifications removed from Expo Go" error from firing.
 */
let notifPromise: Promise<typeof import('expo-notifications')> | null = null;

const loadNotifications = async () => {
  if (isExpoGo()) return null;
  if (!notifPromise) {
    notifPromise = import('expo-notifications');
    notifPromise.then((Notifications) => {
      // Show the real heads-up banner even while the app is in the foreground.
      Notifications.setNotificationHandler({
        handleNotification: async () => ({
          shouldShowBanner: true,
          shouldShowList: true,
          shouldPlaySound: true,
          shouldSetBadge: false,
        }),
      });
    });
  }
  return notifPromise;
};

/**
 * Ask for permission and upload this device's Expo push token.
 * Safe to call on every app start: it no-ops once permission is settled.
 * Returns the token, or null if notifications are unavailable/denied.
 */
export const registerForPushNotifications = async (): Promise<string | null> => {
  try {
    const Notifications = await loadNotifications();
    if (!Notifications) return null;

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
    // Permission denied, offline, or unsupported build.
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
 * Show a heads-up notification on this device.
 *
 * Real build -> a true system notification (banner + notification tray).
 * Expo Go   -> our own in-app banner, since no notification channel can exist.
 */
export const notifyNow = async (
  title: string,
  body: string,
  data?: Record<string, any>
) => {
  const Notifications = await loadNotifications();
  if (!Notifications) {
    presentBanner(title, body, 'info');
    return;
  }
  try {
    await Notifications.scheduleNotificationAsync({
      content: { title, body, data: data ?? {}, sound: true },
      trigger: null,
    });
  } catch {
    presentBanner(title, body, 'info');
  }
};

type TokenRow = { token: string; platform: string | null; userId: string };

const sendToExpo = async (
  tokens: string[],
  title: string,
  body: string,
  data: Record<string, any>
) => {
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
    const Notifications = await loadNotifications();
    await Notifications?.setBadgeCountAsync(count);
  } catch {
    // Not all Android launchers support badges.
  }
};