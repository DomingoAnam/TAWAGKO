import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import AssistanceScreen from '../features/AssistanceScreen';
import MyRequestsScreen from '../features/MyRequestsScreen';
import AssistanceRequestDetailScreen from '../features/AssistanceRequestDetailScreen';

const Stack = createNativeStackNavigator();

export default function AssistanceStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="CheckIn" component={AssistanceScreen} />
      <Stack.Screen name="MyRequests" component={MyRequestsScreen} />
      <Stack.Screen name="AssistanceRequestDetail" component={AssistanceRequestDetailScreen} />
    </Stack.Navigator>
  );
}
