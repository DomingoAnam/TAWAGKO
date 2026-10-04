import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, TYPOGRAPHY, SHADOWS } from '../theme';
import { AppLogo } from '../components/AppLogo';

export default function RoleSelectionScreen({ navigation }: any) {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <AppLogo size={104} showWordmark={false} />
        <Text style={styles.welcome}>Welcome to TawagKo</Text>
        <Text style={styles.subtitle}>Your Barangay Connection</Text>
      </View>

      <TouchableOpacity
        style={styles.roleCard}
        onPress={() => navigation.navigate('ResidentLogin')}
        activeOpacity={0.92}
      >
        <View style={[styles.roleIcon, { backgroundColor: COLORS.primaryLight }]}>
          <Ionicons name="home-outline" size={26} color={COLORS.primary} />
        </View>

        <Text style={styles.roleTitle}>RESIDENT</Text>
        <Text style={styles.roleDesc}>
          Access emergency contacts, barangay services, announcements, and assistance.
        </Text>

        <View style={styles.roleBtn}>
          <Text style={styles.roleBtnText}>CONTINUE AS RESIDENT</Text>
          <Ionicons name="arrow-forward" size={18} color={COLORS.textInverse} />
        </View>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.roleCard}
        onPress={() => navigation.navigate('PersonnelLogin')}
        activeOpacity={0.92}
      >
        <View style={[styles.roleIcon, { backgroundColor: COLORS.accentLight }]}>
          <Ionicons name="shield-checkmark-outline" size={26} color={COLORS.accentDark} />
        </View>

        <Text style={styles.roleTitle}>BARANGAY PERSONNEL</Text>
        <Text style={styles.roleDesc}>
          Manage barangay information, announcements, residents, and assistance.
        </Text>

        <View style={[styles.roleBtn, { backgroundColor: COLORS.accent }]}>
          <Text style={styles.roleBtnText}>CONTINUE AS PERSONNEL</Text>
          <Ionicons name="arrow-forward" size={18} color={COLORS.textInverse} />
        </View>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    padding: SPACING.xl,
    justifyContent: 'center',
  },
  header: { alignItems: 'center', marginBottom: SPACING.xl },
  welcome: {
    ...TYPOGRAPHY.h2,
    color: COLORS.textPrimary,
    textAlign: 'center',
    marginTop: SPACING.lg,
  },
  subtitle: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: 4,
  },
  roleCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 22,
    padding: SPACING.xl,
    marginBottom: SPACING.lg,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.md,
  },
  roleIcon: {
    width: 56,
    height: 56,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.md,
  },
  roleTitle: {
    ...TYPOGRAPHY.h3,
    color: COLORS.textPrimary,
    textAlign: 'center',
    marginBottom: 6,
  },
  roleDesc: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: SPACING.lg,
    lineHeight: 21,
  },
  roleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    alignSelf: 'stretch',
    backgroundColor: COLORS.primary,
    borderRadius: 26,
    paddingVertical: 14,
  },
  roleBtnText: {
    color: COLORS.textInverse,
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.4,
  },
});