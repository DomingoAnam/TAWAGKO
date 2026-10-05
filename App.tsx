import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import RootNavigator from './src/navigation/RootNavigator';
import NotificationHost from './src/components/NotificationHost';
import { supabase } from './src/services/supabase';
import { registerForPushNotifications } from './src/services/push';

export default function App() {
  // Register this device for push notifications whenever someone signs in,
  // so personnel are alerted to new requests even with the app closed.
  // No-ops inside Expo Go, where remote push is unavailable.
  useEffect(() => {
    registerForPushNotifications();

    const { data } = supabase.auth.onAuthStateChange(() => {
      registerForPushNotifications();
    });
    return () => data.subscription.unsubscribe();
  }, []);

  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <RootNavigator />
      </NavigationContainer>
      <NotificationHost />
    </SafeAreaProvider>
  );
}
