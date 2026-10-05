import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, TYPOGRAPHY, BORDER_RADIUS } from '../theme';
import { makeCall } from '../services/phone';

type Props = {
  item: any;
  /** 'contact' = emergency contact fields; 'service' = barangay service fields */
  kind: 'contact' | 'service';
  /** Optional footer rendered under the default Call button / instead of edit actions */
  onPress?: () => void;
  /** Extra actions rendered under the Call button (e.g. Edit/Delete). */
  actions?: React.ReactNode;
};

/**
 * Shared card for emergency contacts and barangay services.
 *
 * Layout matches the wireframe: logo on the left, name and description on the
 * right, then Contact Info with address/postal code, a phone row, and a Call
 * action at the bottom.
 */
export function DirectoryCard({ item, kind, actions, onPress }: Props) {
  const isService = kind === 'service';
  const address = isService ? item.location : item.address;
  const description = item.description || '';

  const body = (
    <>
      <View style={styles.topRow}>
        {item.photoUri ? (
          <Image source={{ uri: item.photoUri }} style={styles.logo} />
        ) : (
          <View style={[styles.logo, styles.logoFallback]}>
            <Ionicons name={isService ? 'business' : 'call'} size={26} color={COLORS.primary} />
          </View>
        )}

        <View style={styles.titleWrap}>
          <Text style={styles.name} numberOfLines={2}>
            {item.serviceName}
          </Text>
          <View style={styles.metaRow}>
            <View
              style={[
                styles.availDot,
                item.availability === 'Unavailable' && styles.availDotOff,
              ]}
            />
            <Text style={styles.availability}>{item.availability || 'Available'}</Text>
          </View>
          {description ? (
            <Text style={styles.desc} numberOfLines={2}>
              {description}
            </Text>
          ) : null}
        </View>
      </View>

      <View style={styles.divider} />
      <Text style={styles.sectionLabel}>CONTACT INFO</Text>

      {address ? (
        <View style={styles.detailRow}>
          <Ionicons name="location-outline" size={16} color={COLORS.primary} style={styles.detailIcon} />
          <Text style={styles.detailText}>{address}</Text>
        </View>
      ) : null}

      {item.postalCode ? (
        <View style={styles.detailRow}>
          <Ionicons name="mail-outline" size={16} color={COLORS.primary} style={styles.detailIcon} />
          <Text style={styles.detailText}>Postal Code: {item.postalCode}</Text>
        </View>
      ) : null}

      {isService && item.officeHours ? (
        <View style={styles.detailRow}>
          <Ionicons name="time-outline" size={16} color={COLORS.primary} style={styles.detailIcon} />
          <Text style={styles.detailText}>{item.officeHours}</Text>
        </View>
      ) : null}

      <View style={styles.divider} />

      <View style={styles.detailRow}>
        <Ionicons name="call-outline" size={16} color={COLORS.primary} style={styles.detailIcon} />
        <Text style={[styles.detailText, styles.phoneText]}>{item.contactNumber || 'No number on record'}</Text>
      </View>

      <TouchableOpacity
        style={styles.callBtn}
        onPress={() => makeCall(item.contactNumber)}
        activeOpacity={0.9}
        accessibilityRole="button"
        accessibilityLabel={`Call ${item.serviceName}`}
      >
        <Ionicons name="call" size={17} color={COLORS.onBrand} />
        <Text style={styles.callText}>CALL</Text>
      </TouchableOpacity>

      {actions}
    </>
  );

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={onPress}
      activeOpacity={onPress ? 0.9 : 1}
      disabled={!onPress}
      accessibilityRole={onPress ? 'button' : undefined}
    >
      {body}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  topRow: { flexDirection: 'row', alignItems: 'flex-start', gap: SPACING.md },
  logo: {
    width: 76,
    height: 76,
    borderRadius: 18,
    backgroundColor: COLORS.primaryLight,
  },
  logoFallback: { alignItems: 'center', justifyContent: 'center' },
  titleWrap: { flex: 1 },
  name: { ...TYPOGRAPHY.h4, color: COLORS.textPrimary },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 3 },
  availDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: COLORS.primary },
  availDotOff: { backgroundColor: COLORS.textHint },
  availability: { ...TYPOGRAPHY.small, color: COLORS.textSecondary, fontWeight: '600' },
  desc: { ...TYPOGRAPHY.small, color: COLORS.textSecondary, marginTop: 5, lineHeight: 18 },
  divider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: SPACING.md,
  },
  sectionLabel: {
    ...TYPOGRAPHY.smallBold,
    color: COLORS.textHint,
    letterSpacing: 1,
    marginBottom: SPACING.sm,
  },
  detailRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 9, marginTop: 7 },
  detailIcon: { marginTop: 2 },
  detailText: { flex: 1, ...TYPOGRAPHY.body, color: COLORS.textPrimary, lineHeight: 20 },
  phoneText: { fontWeight: '700', color: COLORS.primary },
  callBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: COLORS.primary,
    borderRadius: 16,
    paddingVertical: 13,
    marginTop: SPACING.md,
  },
  callText: { ...TYPOGRAPHY.button, color: COLORS.onBrand, letterSpacing: 0.5 },
});
