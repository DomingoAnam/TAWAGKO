import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, SHADOWS, TYPOGRAPHY } from '../theme';
import { makeCall, openFacebook } from '../services/phone';

const initials = (name: string) =>
  (name || '?')
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase();

export default function OfficialDetailScreen({ navigation, route }: any) {
  const official = route?.params?.official;
  const name = official?.full_name ?? '';
  const position = official?.position || 'Barangay Personnel';
  const phone = official?.phone ?? null;
  const facebook = official?.facebook_url ?? null;

  const call = () => {
    if (phone) makeCall(phone);
  };

  const openFacebookPage = () => {
    if (!facebook) return;
    // `openFacebook` requires an absolute URL; the database already stores one.
    openFacebook(/^https?:\/\//i.test(facebook) ? facebook : `https://${facebook}`);
  };

  const rows: { label: string; value: string; icon: any }[] = [
    { label: 'Position', value: position, icon: 'briefcase-outline' },
    { label: 'Department', value: official?.department || 'Not set', icon: 'business-outline' },
    { label: 'Phone', value: phone || 'Not provided', icon: 'call-outline' },
    { label: 'Facebook Page', value: facebook || 'Not provided', icon: 'logo-facebook' },
  ];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <TouchableOpacity
        onPress={() => navigation.goBack()}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        style={styles.backBtn}
        accessibilityRole="button"
        accessibilityLabel="Go back"
      >
        <Ionicons name="arrow-back" size={18} color={COLORS.primary} />
      </TouchableOpacity>

      <View style={styles.header}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{initials(name)}</Text>
        </View>
        <Text style={styles.name}>{name}</Text>
        <View style={styles.badge}>
          <Ionicons name="shield-checkmark" size={13} color={COLORS.primary} />
          <Text style={styles.badgeText}>{position}</Text>
        </View>
      </View>

      <View style={styles.card}>
        {rows.map((r) => (
          <View key={r.label} style={styles.row}>
            <View style={styles.rowIcon}>
              <Ionicons name={r.icon} size={17} color={COLORS.primary} />
            </View>
            <View style={styles.rowText}>
              <Text style={styles.rowLabel}>{r.label}</Text>
              <Text
                style={[
                  styles.rowValue,
                  (r.value === 'Not set' || r.value === 'Not provided') && styles.rowValueMuted,
                ]}
                numberOfLines={2}
              >
                {r.value}
              </Text>
            </View>
          </View>
        ))}
      </View>

      <Text style={styles.hint}>
        <Ionicons name="information-circle-outline" size={13} color={COLORS.textHint} />
        {'  '}Contact details are maintained by each official on their own profile.
      </Text>

      <View style={styles.actions}>
        <TouchableOpacity
          style={[styles.actionBtn, !phone && styles.actionBtnDisabled]}
          onPress={call}
          disabled={!phone}
          activeOpacity={0.9}
          accessibilityRole="button"
          accessibilityLabel={phone ? `Call ${name}, ${position}` : `No phone number for ${name}`}
        >
          <Ionicons name="call" size={19} color={COLORS.onBrand} />
          <View style={styles.actionTextWrap}>
            <Text style={styles.actionLabel}>Call</Text>
            <Text style={styles.actionHint} numberOfLines={1}>
              {position}
            </Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionBtn, styles.fbBtn, !facebook && styles.actionBtnDisabled]}
          onPress={openFacebookPage}
          disabled={!facebook}
          activeOpacity={0.9}
          accessibilityRole="button"
          accessibilityLabel={
            facebook ? `Visit ${name} on Facebook` : `${name} has no Facebook page`
          }
        >
          <Ionicons name="logo-facebook" size={19} color={COLORS.primary} />
          <View style={styles.actionTextWrap}>
            <Text style={[styles.actionLabel, styles.fbLabel]}>Visit Facebook Page</Text>
          </View>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: SPACING.xl, paddingBottom: SPACING.xxl },
  backBtn: { marginBottom: SPACING.md },
  header: { alignItems: 'center', marginBottom: SPACING.lg },
  avatar: {
    width: 92,
    height: 92,
    borderRadius: 28,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.md,
  },
  avatarText: { fontSize: 32, fontWeight: '800', color: COLORS.primary },
  name: { ...TYPOGRAPHY.h2, color: COLORS.textPrimary, textAlign: 'center' },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: COLORS.primaryLight,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginTop: SPACING.sm,
  },
  badgeText: { ...TYPOGRAPHY.smallBold, color: COLORS.primary },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: 18,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: SPACING.md,
  },
  row: { flexDirection: 'row', alignItems: 'flex-start', gap: SPACING.md },
  rowIcon: {
    width: 34,
    height: 34,
    borderRadius: 11,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowText: { flex: 1 },
  rowLabel: { ...TYPOGRAPHY.small, color: COLORS.textSecondary },
  rowValue: { ...TYPOGRAPHY.bodyLarge, color: COLORS.textPrimary, marginTop: 1 },
  rowValueMuted: { color: COLORS.textHint },
  hint: { ...TYPOGRAPHY.small, color: COLORS.textHint, marginTop: SPACING.md, textAlign: 'center' },
  actions: { marginTop: SPACING.xl, gap: SPACING.sm },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    backgroundColor: COLORS.primary,
    borderRadius: 16,
    paddingVertical: 15,
    paddingHorizontal: SPACING.lg,
    ...SHADOWS.sm,
  },
  actionBtnDisabled: { backgroundColor: COLORS.surfaceAlt, ...SHADOWS.none },
  actionTextWrap: { flex: 1 },
  actionLabel: { ...TYPOGRAPHY.bodyLarge, fontWeight: '700', color: COLORS.onBrand },
  actionHint: { ...TYPOGRAPHY.small, color: COLORS.onBrand, opacity: 0.85 },
  fbBtn: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.primary,
    ...SHADOWS.none,
  },
  fbLabel: { color: COLORS.primary },
});