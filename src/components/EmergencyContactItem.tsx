import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, TYPOGRAPHY, COMPONENT_STYLES } from '../theme';
import { makeCall } from '../services/phone';
import { StatusBadge } from './ReusableComponents';

export const EmergencyContactItem = ({ item }: any) => (
  <View style={[COMPONENT_STYLES.card, styles.card]}>
    <View style={styles.row}>
      <View style={styles.iconBox}>
        {item.photoUri ? (
          <Image source={{ uri: item.photoUri }} style={styles.thumb} />
        ) : (
          <Ionicons name="call" size={24} color={COLORS.accentDark} />
        )}
      </View>

      <View style={styles.info}>
        <Text style={styles.name}>{item.serviceName}</Text>
        <Text style={styles.desc}>{item.description}</Text>

        <View style={styles.numberRow}>
          <Ionicons name="call-outline" size={14} color={COLORS.primary} />
          <Text style={styles.number}>{item.contactNumber}</Text>
        </View>

        <StatusBadge
          status={item.availability === 'Available' ? 'AVAILABLE' : 'UNAVAILABLE'}
          label={item.availability}
        />
      </View>

      <TouchableOpacity
        style={styles.callBtn}
        onPress={() => makeCall(item.contactNumber)}
        accessibilityRole="button"
        accessibilityLabel={`Call ${item.serviceName}`}
      >
        <Ionicons name="call" size={16} color={COLORS.onBrand} />
        <Text style={styles.callText}>CALL</Text>
      </TouchableOpacity>
    </View>
  </View>
);

const styles = StyleSheet.create({
  card: { marginBottom: 14 },
  row: { flexDirection: 'row', alignItems: 'center' },
  iconBox: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: COLORS.accentLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md,
    overflow: 'hidden',
  },
  thumb: { width: '100%', height: '100%' },
  info: { flex: 1, paddingRight: SPACING.sm },
  name: { ...TYPOGRAPHY.h4, color: COLORS.textPrimary },
  desc: { ...TYPOGRAPHY.caption, color: COLORS.textSecondary, marginTop: 2 },
  numberRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginVertical: 6 },
  number: { ...TYPOGRAPHY.bodyLarge, color: COLORS.primary, fontWeight: '700' },
  callBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: COLORS.accent,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 24,
  },
  callText: { color: COLORS.onBrand, ...TYPOGRAPHY.button, fontSize: 13 },
});