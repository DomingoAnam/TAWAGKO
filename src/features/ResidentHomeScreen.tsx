import React, { useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { COLORS, SPACING, TYPOGRAPHY, SHADOWS } from '../theme';
import { getCurrentUser, getAnnouncements } from '../services/storage';
import { listMyAssistanceRequests } from '../services/supabaseStorage';
import { AppLogo } from '../components/AppLogo';

type IconName = React.ComponentProps<typeof Ionicons>['name'];

const greet = () => {
  const h = new Date().getHours();
  return h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening';
};

export default function ResidentHomeScreen({ navigation }: any) {
  const [user, setUser] = useState<any>(null);
  const [announcement, setAnnouncement] = useState<any>(null);
  const [dismissed, setDismissed] = useState(false);
  const [activeRequests, setActiveRequests] = useState(0);

  useFocusEffect(
    useCallback(() => {
      const load = async () => {
        setUser(await getCurrentUser());
        const anns = (await getAnnouncements()) || [];
        setAnnouncement(anns.find((a: any) => a.important) || anns[0]);

        // Red dot on the assistance row while a request is still being handled.
        // Requires a Supabase session, so a missing/failed session is not an error.
        try {
          const rows = (await listMyAssistanceRequests()) || [];
          setActiveRequests(
            rows.filter((r: any) => r.status === 'PENDING' || r.status === 'UNDER_REVIEW').length
          );
        } catch {
          setActiveRequests(0);
        }
      };
      load();
    }, [])
  );

  const firstName = user?.fullName?.split(' ')[0] || 'Resident';
  const verified = user?.verificationStatus === 'VERIFIED';
  const showVerifyNudge = !verified && !dismissed;

  const actions: { label: string; icon: IconName; target: string; badge?: number }[] = [
    { label: 'Emergency Contacts', icon: 'call', target: 'EmergencyContacts' },
    { label: 'Barangay Services', icon: 'business', target: 'Services' },
    {
      label: 'Post-Emergency Assistance',
      icon: 'hand-right',
      target: 'Assistance',
      badge: activeRequests,
    },
    { label: 'Announcements', icon: 'megaphone', target: 'Announcements' },
    { label: 'Barangay Officials', icon: 'people', target: 'Officials' },
  ];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <AppLogo size={52} showWordmark={false} />
        <View style={styles.headerText}>
          <Text style={styles.greeting}>
            {greet()}, {firstName}
          </Text>
          {verified ? (
            <View style={styles.badge}>
              <Ionicons name="checkmark-circle" size={14} color={COLORS.primary} />
              <Text style={styles.badgeText}>Verified Resident</Text>
            </View>
          ) : null}
        </View>
      </View>

      {showVerifyNudge && (
        <View style={styles.nudge}>
          <View style={styles.nudgeIcon}>
            <Ionicons name="shield-checkmark-outline" size={20} color={COLORS.accentDark} />
          </View>
          <View style={styles.nudgeText}>
            <Text style={styles.nudgeTitle}>Verify your residency</Text>
            <Text style={styles.nudgeBody}>
              Submit a valid ID or proof of residency to get verified.
            </Text>
          </View>
          <TouchableOpacity
            onPress={() => navigation.navigate('ResidentVerification')}
            style={styles.nudgeBtn}
          >
            <Text style={styles.nudgeBtnText}>VERIFY</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setDismissed(true)}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            style={styles.nudgeClose}
            accessibilityLabel="Dismiss"
          >
            <Ionicons name="close" size={16} color={COLORS.textHint} />
          </TouchableOpacity>
        </View>
      )}

      <TouchableOpacity
        style={styles.helpBanner}
        onPress={() => navigation.navigate('Assistance')}
        activeOpacity={0.92}
        accessibilityRole="button"
      >
        <View style={styles.helpText}>
          <Text style={styles.helpTitle}>Need Assistance?</Text>
          <Text style={styles.helpSub}>Post-emergency check-in</Text>
        </View>
        <View style={styles.helpArrow}>
          <Ionicons name="arrow-forward" size={20} color={COLORS.onBrand} />
        </View>
      </TouchableOpacity>

      <Text style={styles.sectionTitle}>Quick Actions</Text>
      <View style={styles.list}>
        {actions.map((a) => (
          <TouchableOpacity
            key={a.label}
            style={styles.row}
            onPress={() => navigation.navigate(a.target)}
            activeOpacity={0.9}
            accessibilityRole="button"
          >
            <View style={styles.rowIcon}>
              <Ionicons name={a.icon} size={19} color={COLORS.primary} />
            </View>
            <Text style={styles.rowLabel}>{a.label}</Text>
            {a.badge ? (
              <View style={styles.rowBadge}>
                <Text style={styles.rowBadgeText}>{a.badge}</Text>
              </View>
            ) : null}
            <Ionicons name="chevron-forward" size={18} color={COLORS.textHint} />
          </TouchableOpacity>
        ))}
      </View>

      {announcement && (
        <>
          <Text style={styles.sectionTitle}>Latest Update</Text>
          <TouchableOpacity
            style={[
              styles.announce,
              { borderLeftColor: announcement.important ? COLORS.accent : COLORS.primary },
            ]}
            onPress={() => navigation.navigate('Announcements')}
            activeOpacity={0.9}
            accessibilityRole="button"
          >
            <View style={styles.announceTop}>
              <Text style={styles.announceCategory}>{announcement.category}</Text>
              {announcement.important && (
                <View style={styles.importantBadge}>
                  <Ionicons name="warning" size={12} color={COLORS.accentDark} />
                  <Text style={styles.importantText}>IMPORTANT</Text>
                </View>
              )}
            </View>
            <Text style={styles.announceTitle}>{announcement.title}</Text>
            <Text style={styles.announceDesc} numberOfLines={2}>
              {announcement.description}
            </Text>
          </TouchableOpacity>
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: SPACING.xl, paddingBottom: SPACING.xxl },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: SPACING.lg },
  headerText: { flex: 1, marginLeft: SPACING.md },
  greeting: { ...TYPOGRAPHY.h4, color: COLORS.textPrimary },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    alignSelf: 'flex-start',
    backgroundColor: COLORS.primaryLight,
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 20,
    marginTop: 5,
  },
  badgeText: { ...TYPOGRAPHY.smallBold, color: COLORS.primary },
  nudge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.accentLight,
    borderRadius: 18,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.accent,
  },
  nudgeIcon: { marginRight: SPACING.sm },
  nudgeText: { flex: 1 },
  nudgeTitle: { ...TYPOGRAPHY.captionBold, color: COLORS.textPrimary },
  nudgeBody: { ...TYPOGRAPHY.small, color: COLORS.textSecondary, marginTop: 1 },
  nudgeBtn: {
    backgroundColor: COLORS.accent,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 18,
    marginLeft: SPACING.sm,
  },
  nudgeBtnText: { ...TYPOGRAPHY.smallBold, color: COLORS.onBrand },
  nudgeClose: { marginLeft: SPACING.sm },
  helpBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.accent,
    borderRadius: 22,
    padding: SPACING.lg,
    marginBottom: SPACING.lg,
    ...SHADOWS.md,
  },
  helpText: { flex: 1 },
  helpTitle: { ...TYPOGRAPHY.h4, color: COLORS.onBrand },
  helpSub: { ...TYPOGRAPHY.caption, color: COLORS.accentLight, marginTop: 2 },
  helpArrow: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255,255,255,0.22)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionTitle: { ...TYPOGRAPHY.h4, color: COLORS.textPrimary, marginBottom: SPACING.md },
  list: { gap: SPACING.sm, marginBottom: SPACING.lg },
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
  announce: {
    backgroundColor: COLORS.surface,
    borderRadius: 18,
    padding: SPACING.lg,
    borderLeftWidth: 4,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  announceTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  announceCategory: { ...TYPOGRAPHY.smallBold, color: COLORS.primary },
  importantBadge: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  importantText: { ...TYPOGRAPHY.smallBold, color: COLORS.accentDark },
  announceTitle: { ...TYPOGRAPHY.h4, color: COLORS.textPrimary },
  announceDesc: { ...TYPOGRAPHY.caption, color: COLORS.textSecondary, marginTop: 4 },
});