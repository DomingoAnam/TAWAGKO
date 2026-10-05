import React, { useEffect } from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import PersonnelDashboard from '../features/PersonnelDashboard';
import ManageContactsScreen from '../features/ManageContactsScreen';
import ManageServicesScreen from '../features/ManageServicesScreen';
import ManageOfficialsScreen from '../features/ManageOfficialsScreen';
import ManageAnnouncementsScreen from '../features/ManageAnnouncementsScreen';
import VerificationManagementScreen from '../features/VerificationManagementScreen';
import AssistanceManagementScreen from '../features/AssistanceManagementScreen';
import ManageResidentsScreen from '../features/ManageResidentsScreen';
import PersonnelProfileScreen from '../features/PersonnelProfileScreen';
import { COLORS } from '../theme';

import { refreshAssistanceCounts } from '../services/assistanceCounts';

const Tab = createBottomTabNavigator();

type IconName = React.ComponentProps<typeof Ionicons>['name'];

const TabIcon = (name: IconName) => {
  const Icon = ({ color, size }: { color: string; size: number }) => (
    <Ionicons name={name} size={size} color={color} />
  );
  Icon.displayName = `TabIcon(${name})`;
  return Icon;
};

export default function PersonnelTabs() {
  // Polls so the red badges on the Home screen's Management rows stay current
  // even when a request arrives from another device.
  useEffect(() => {
    refreshAssistanceCounts();
    const timer = setInterval(refreshAssistanceCounts, 20000);
    return () => clearInterval(timer);
  }, []);

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: COLORS.accentRed,
        tabBarInactiveTintColor: COLORS.textHint,
        tabBarStyle: {
          height: 64,
          paddingBottom: 10,
          paddingTop: 8,
          backgroundColor: COLORS.white,
          borderTopWidth: 1,
          borderTopColor: COLORS.borderColor,
        },
        tabBarLabelStyle: { fontSize: 10, fontWeight: '700' },
      }}
    >
      <Tab.Screen
        name="Home"
        component={PersonnelDashboard}
        options={{ tabBarIcon: TabIcon('home'), tabBarLabel: 'HOME' }}
      />
      <Tab.Screen
        name="Contacts"
        component={ManageContactsScreen}
        options={{ tabBarIcon: TabIcon('call'), tabBarLabel: 'CONTACTS' }}
      />
      <Tab.Screen
        name="Services"
        component={ManageServicesScreen}
        options={{ tabBarIcon: TabIcon('business'), tabBarLabel: 'SERVICES' }}
      />
      <Tab.Screen
        name="Officials"
        component={ManageOfficialsScreen}
        options={{ tabBarIcon: TabIcon('briefcase'), tabBarLabel: 'OFFICIALS' }}
      />
      <Tab.Screen
        name="Announcements"
        component={ManageAnnouncementsScreen}
        options={{ tabBarIcon: TabIcon('megaphone'), tabBarLabel: 'UPDATES' }}
      />
      <Tab.Screen
        name="Residents"
        component={ManageResidentsScreen}
        options={{ tabBarIcon: TabIcon('people'), tabBarLabel: 'RESIDENTS' }}
      />
      <Tab.Screen
        name="Verification"
        component={VerificationManagementScreen}
        options={{ tabBarIcon: TabIcon('checkmark-done'), tabBarLabel: 'VERIFY' }}
      />
      <Tab.Screen
        name="Assistance"
        component={AssistanceManagementScreen}
        options={{ tabBarIcon: TabIcon('hand-right'), tabBarLabel: 'HELP' }}
      />
      <Tab.Screen
        name="Profile"
        component={PersonnelProfileScreen}
        options={{ tabBarIcon: TabIcon('person'), tabBarLabel: 'PROFILE' }}
      />
    </Tab.Navigator>
  );
}
