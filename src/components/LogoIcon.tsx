import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
// Import from the concrete module (not the theme barrel) to avoid a require cycle.
import { COLORS } from '../theme/colors';
import { Ionicons } from '@expo/vector-icons';

interface LogoIconProps {
  size?: number;
  style?: any;
  showText?: boolean;
}

/** Kept for backwards compatibility — prefer <AppLogo /> from components/AppLogo. */
export const LogoIcon = ({ size = 48, style, showText = false }: LogoIconProps) => (
  <View
    style={[
      styles.container,
      { width: size, height: size, borderRadius: Math.round(size * 0.28) },
      style,
    ]}
  >
    <Ionicons
      name="phone-portrait-outline"
      size={size * 0.46}
      color={COLORS.textInverse}
    />
    {showText && <Text style={[styles.text, { fontSize: size * 0.18 }]}>TAWAGKO</Text>}
  </View>
);

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 8,
    elevation: 6,
  },
  text: { color: COLORS.textInverse, fontWeight: '800', marginTop: 2 },
});

interface IconProps {
  name: string;
  size?: number;
  color?: string;
  style?: any;
}

export const AppIcon = ({ name, size = 24, color = COLORS.primary, style }: IconProps) => (
  <Ionicons name={name as any} size={size} color={color} style={style} />
);

const ICON_MAP: Record<string, string> = {
  home: 'home',
  services: 'business',
  assistance: 'hand-right',
  announcements: 'megaphone',
  profile: 'person',
  emergency: 'warning',
  search: 'search',
  call: 'call',
  lock: 'lock-closed',
  user: 'person',
  phone: 'call',
  email: 'mail',
  location: 'location',
  time: 'time',
  check: 'checkmark-circle',
  alert: 'warning',
  info: 'information-circle',
  facebook: 'logo-facebook',
  menu: 'menu',
  close: 'close',
  edit: 'pencil',
  delete: 'trash',
  add: 'add',
  save: 'save',
  cancel: 'close',
  back: 'arrow-back',
  forward: 'arrow-forward',
  refresh: 'refresh',
  settings: 'settings',
  notification: 'notifications',
  verified: 'checkmark-done',
  pending: 'time',
  rejected: 'close-circle',
  urgent: 'warning',
  food: 'restaurant',
  medical: 'medical',
  shelter: 'home',
  transport: 'car',
  family: 'people',
  emotional: 'heart',
  other: 'apps',
};

export const getIcon = (name: string) => ICON_MAP[name] || 'grid';

export const TabIcon = (name: string, size = 24, color = COLORS.primary) => (
  <Ionicons name={getIcon(name) as any} size={size} color={color} />
);