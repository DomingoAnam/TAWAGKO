import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import ResidentHomeScreen from '../features/ResidentHomeScreen';
import ServicesScreen from '../features/ServicesScreen';
import AssistanceStack from './AssistanceStack';
import AnnouncementsScreen from '../features/AnnouncementsScreen';
import ProfileScreen from '../features/ProfileScreen';
import { COLORS } from '../theme';

const Tab = createBottomTabNavigator();

type IconName = React.ComponentProps<typeof Ionicons>['name'];

const TabIcon = (name: IconName) => {
  const Icon = ({ color, size }: { color: string; size: number }) => (
    <Ionicons name={name} size={size} color={color} />
  );
  Icon.displayName = `TabIcon(${name})`;
  return Icon;
};

export default function ResidentTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: COLORS.primaryGreen,
        tabBarInactiveTintColor: COLORS.textHint,
        tabBarStyle: {
          height: 64,
          paddingBottom: 10,
          paddingTop: 8,
          backgroundColor: COLORS.white,
          borderTopWidth: 1,
          borderTopColor: COLORS.borderColor,
        },
        tabBarLabelStyle: { fontSize: 11, fontWeight: '700' },
      }}
    >
      <Tab.Screen
        name="Home"
        component={ResidentHomeScreen}
        options={{ tabBarIcon: TabIcon('home'), tabBarLabel: 'HOME' }}
      />
      <Tab.Screen
        name="Services"
        component={ServicesScreen}
        options={{ tabBarIcon: TabIcon('business'), tabBarLabel: 'SERVICES' }}
      />
      <Tab.Screen
        name="Assistance"
        component={AssistanceStack}
        options={{ tabBarIcon: TabIcon('hand-right'), tabBarLabel: 'ASSISTANCE' }}
      />
      <Tab.Screen
        name="Announcements"
        component={AnnouncementsScreen}
        options={{ tabBarIcon: TabIcon('megaphone'), tabBarLabel: 'UPDATES' }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{ tabBarIcon: TabIcon('person'), tabBarLabel: 'PROFILE' }}
      />
    </Tab.Navigator>
  );
}
