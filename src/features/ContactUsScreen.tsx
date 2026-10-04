import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, TYPOGRAPHY, SHADOWS } from '../theme';
import { makeCall } from '../services/phone';

const TAWAGKO_PHONE = '09123456789';

export default function ContactUsScreen({ navigation }: any) {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backBtn}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <Ionicons name="arrow-back" size={18} color={COLORS.primary} />
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.title}>Need to Reach Us?</Text>
      <Text style={styles.subtitle}>
        For questions, concerns, or assistance regarding TawagKo.
      </Text>

      <View style={styles.card}>
        <View style={styles.iconBox}>
          <Ionicons name="call" size={28} color={COLORS.primary} />
        </View>
        <Text style={styles.cardTitle}>PHONE</Text>
        <Text style={styles.cardDesc}>Call TawagKo</Text>
        <Text style={styles.cardNumber}>{TAWAGKO_PHONE}</Text>

        <TouchableOpacity
          style={styles.btn}
          onPress={() => makeCall(TAWAGKO_PHONE)}
          activeOpacity={0.9}
        >
          <Ionicons name="call" size={17} color={COLORS.onBrand} />
          <Text style={styles.btnText}>CALL US</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.noteBox}>
        <View style={styles.noteRow}>
          <Ionicons name="mail-outline" size={15} color={COLORS.textSecondary} />
          <Text style={styles.noteText}>info@tawagko.local</Text>
        </View>
        <View style={styles.noteRow}>
          <Ionicons name="location-outline" size={15} color={COLORS.textSecondary} />
          <Text style={styles.noteText}>Barangay Hall, Main Street</Text>
        </View>
      </View>
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
  header: { marginBottom: SPACING.lg },
  backBtn: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  backText: { ...TYPOGRAPHY.captionBold, color: COLORS.primary },
  title: { ...TYPOGRAPHY.h2, color: COLORS.textPrimary },
  subtitle: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
    marginTop: 6,
    marginBottom: SPACING.xl,
  },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: 22,
    padding: SPACING.xl,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.md,
  },
  iconBox: {
    width: 60,
    height: 60,
    borderRadius: 18,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.md,
  },
  cardTitle: { ...TYPOGRAPHY.h4, color: COLORS.textPrimary },
  cardDesc: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  cardNumber: {
    ...TYPOGRAPHY.h3,
    color: COLORS.primary,
    marginVertical: SPACING.sm,
  },
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    backgroundColor: COLORS.primary,
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 26,
  },
  btnText: { color: COLORS.onBrand, ...TYPOGRAPHY.button },
  noteBox: { marginTop: SPACING.xl },
  noteRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  noteText: { ...TYPOGRAPHY.caption, color: COLORS.textSecondary },
});