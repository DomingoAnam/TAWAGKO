import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import RootNavigator from './src/navigation/RootNavigator';
import { supabase } from './src/services/supabase';
import { registerForPushNotifications } from './src/services/push';

export default function App() {
  // Register this device for push notifications whenever someone signs in,
  // so personnel are alerted to new requests even with the app closed.
  useEffect(() => {
    registerForPushNotifications();

    const { data } = supabase.auth.onAuthStateChange(() => {
      registerForPushNotifications();
    });
    return () => data.subscription.unsubscribe();
  }, []);

  return (
    <NavigationContainer>
      <RootNavigator />
    </NavigationContainer>
  );
}
