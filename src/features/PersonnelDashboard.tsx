import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, TYPOGRAPHY } from '../theme';
import {
  getCurrentUser,
  getAnnouncements,
  getOfficials,
} from '../services/storage';
import { useAssistanceCounts } from '../hooks/useAssistanceCounts';
import { refreshAssistanceCounts } from '../services/assistanceCounts';
import { countPendingVerifications } from '../services/supabaseStorage';

type IconName = React.ComponentProps<typeof Ionicons>['name'];

export default function PersonnelDashboard({ navigation }: any) {
  const [user, setUser] = useState<any>(null);
  const assistance = useAssistanceCounts();
  const [stats, setStats] = useState({
    announcements: 0,
    pendingVerification: 0,
    officials: 0,
  });

  useFocusEffect(
    useCallback(() => {
      const load = async () => {
        const me = await getCurrentUser();
        setUser(me);
        const anns = (await getAnnouncements()) || [];
        const offs = (await getOfficials()) || [];

        // Needs personnel credentials, so it must not break the rest of the
        // summary if the session password is unavailable.
        let pendingVerification = 0;
        try {
          pendingVerification = me?.username
            ? (await countPendingVerifications(me.username)) ?? 0
            : 0;
        } catch {
          pendingVerification = 0;
        }

        setStats({
          announcements: anns.length,
          pendingVerification,
          officials: offs.length,
        });
        await refreshAssistanceCounts();
      };
      load();
    }, [])
  );

  const greet = () => {
    const h = new Date().getHours();
    return h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening';
  };

  const cards: {
    label: string;
    value: number;
    icon: IconName;
    onPress: () => void;
  }[] = [
    {
      label: 'Posted Updates',
      value: stats.announcements,
      icon: 'megaphone',
      onPress: () => navigation.navigate('Announcements'),
    },
    {
      label: 'Assistance Requests',
      value: assistance.total,
      icon: 'hand-right',
      onPress: () => navigation.navigate('Assistance'),
    },
    {
      label: 'Resident Verification',
      value: stats.pendingVerification,
      icon: 'shield-checkmark',
      onPress: () => navigation.navigate('Verification'),
    },
    {
      label: 'Barangay Officials',
      value: stats.officials,
      icon: 'people',
      onPress: () => navigation.navigate('Officials'),
    },
  ];

  // Red dot marks rows that still need personnel attention.
  const sections: {
    label: string;
    icon: IconName;
    screen: string;
    badge?: number;
  }[] = [
    { label: 'Emergency Contacts', icon: 'call', screen: 'Contacts' },
    { label: 'Barangay Services', icon: 'business', screen: 'Services' },
    { label: 'Officials', icon: 'briefcase', screen: 'Officials' },
    { label: 'Announcements', icon: 'megaphone', screen: 'Announcements' },
    {
      label: 'Resident Verification',
      icon: 'shield-checkmark',
      screen: 'Verification',
      badge: stats.pendingVerification,
    },
    {
      label: 'Post-Emergency Assistance',
      icon: 'hand-right',
      screen: 'Assistance',
      badge: assistance.pending,
    },
  ];

  const firstName = user?.fullName?.split(' ')[0] ?? '';

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {user?.fullName ? user.fullName.charAt(0).toUpperCase() : '?'}
          </Text>
        </View>
        <View style={styles.headerText}>
          <Text style={styles.greeting}>{greet()}{firstName ? `, ${firstName}` : ''}</Text>
          <View style={styles.roleRow}>
            <Ionicons name="briefcase" size={12} color={COLORS.accentDark} />
            <Text style={styles.role}>{user?.position || 'Barangay Personnel'}</Text>
          </View>
        </View>
      </View>

      <Text style={styles.sectionTitle}>Summary</Text>
      <View style={styles.cardGrid}>
        {cards.map((c) => (
          <TouchableOpacity
            key={c.label}
            style={styles.statCard}
            onPress={c.onPress}
            activeOpacity={0.9}
            accessibilityRole="button"
          >
            <View style={styles.statIcon}>
              <Ionicons name={c.icon} size={17} color={COLORS.primary} />
            </View>
            <Text style={styles.statNum}>{c.value}</Text>
            <Text style={styles.statLabel}>{c.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.sectionTitle}>Management</Text>
      <View style={styles.list}>
        {sections.map((s) => (
          <TouchableOpacity
            key={s.label}
            style={styles.row}
            onPress={() => navigation.navigate(s.screen)}
            activeOpacity={0.9}
            accessibilityRole="button"
          >
            <View style={styles.rowIcon}>
              <Ionicons name={s.icon} size={19} color={COLORS.primary} />
            </View>
            <Text style={styles.rowLabel}>{s.label}</Text>
            {s.badge ? (
              <View style={styles.rowBadge}>
                <Text style={styles.rowBadgeText}>{s.badge}</Text>
              </View>
            ) : null}
            <Ionicons name="chevron-forward" size={18} color={COLORS.textHint} />
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: SPACING.xl, paddingBottom: SPACING.xxl },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: SPACING.lg },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 18,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md,
  },
  avatarText: { fontSize: 22, fontWeight: '800', color: COLORS.primary },
  headerText: { flex: 1 },
  greeting: { ...TYPOGRAPHY.h3, color: COLORS.textPrimary },
  roleRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  role: { ...TYPOGRAPHY.caption, color: COLORS.accentDark, fontWeight: '600' },
  sectionTitle: {
    ...TYPOGRAPHY.h4,
    color: COLORS.textPrimary,
    marginBottom: SPACING.md,
    marginTop: SPACING.sm,
  },
  cardGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm },
  statCard: {
    width: '48%',
    flexGrow: 1,
    backgroundColor: COLORS.surface,
    borderRadius: 18,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  statIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.sm,
  },
  cardDot: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 9,
    height: 9,
    borderRadius: 5,
    backgroundColor: COLORS.accentRed,
    borderWidth: 1.5,
    borderColor: COLORS.surface,
  },
  statNum: { fontSize: 26, fontWeight: '800', color: COLORS.primary },
  statLabel: { ...TYPOGRAPHY.small, color: COLORS.textSecondary, marginTop: 2 },
  list: { gap: SPACING.sm },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  rowIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md,
  },
  rowLabel: { flex: 1, ...TYPOGRAPHY.bodyLarge, fontWeight: '600', color: COLORS.textPrimary },
  rowBadge: {
    minWidth: 22,
    height: 22,
    paddingHorizontal: 6,
    borderRadius: 11,
    backgroundColor: COLORS.accentRed,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.sm,
  },
  rowBadgeText: { color: COLORS.onBrand, fontSize: 12, fontWeight: '800' },
});