import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import SplashScreen from '../features/SplashScreen';
import RoleSelectionScreen from '../features/RoleSelectionScreen';
import ResidentLoginScreen from '../features/ResidentLoginScreen';
import ResidentRegisterScreen from '../features/ResidentRegisterScreen';
import ResidentVerificationScreen from '../features/ResidentVerificationScreen';
import PersonnelLoginScreen from '../features/PersonnelLoginScreen';
import PersonnelRegisterScreen from '../features/PersonnelRegisterScreen';
import PersonnelTokenScreen from '../features/PersonnelTokenScreen';
import OfficialsScreen from '../features/OfficialsScreen';
import OfficialDetailScreen from '../features/OfficialDetailScreen';
import ResidentTabs from './ResidentTabs';
import PersonnelTabs from './PersonnelTabs';
import EmergencyContactsScreen from '../features/EmergencyContactsScreen';
import ContactUsScreen from '../features/ContactUsScreen';

const Stack = createNativeStackNavigator();

export default function RootNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Splash" component={SplashScreen} />
      <Stack.Screen name="RoleSelection" component={RoleSelectionScreen} />
      <Stack.Screen name="ResidentLogin" component={ResidentLoginScreen} />
      <Stack.Screen name="ResidentRegister" component={ResidentRegisterScreen} />
      <Stack.Screen name="ResidentVerification" component={ResidentVerificationScreen} />
      <Stack.Screen name="PersonnelLogin" component={PersonnelLoginScreen} />
      <Stack.Screen name="PersonnelRegister" component={PersonnelRegisterScreen} />
      <Stack.Screen name="PersonnelToken" component={PersonnelTokenScreen} />
      <Stack.Screen name="ResidentMain" component={ResidentTabs} />
      <Stack.Screen name="PersonnelMain" component={PersonnelTabs} />
      <Stack.Screen name="EmergencyContacts" component={EmergencyContactsScreen} />
      <Stack.Screen name="Officials" component={OfficialsScreen} />
      <Stack.Screen name="OfficialDetail" component={OfficialDetailScreen} />
      <Stack.Screen name="ContactUs" component={ContactUsScreen} />
    </Stack.Navigator>
  );
}
