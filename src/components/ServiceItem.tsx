import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, TYPOGRAPHY, COMPONENT_STYLES } from '../theme';
import { StatusBadge } from './ReusableComponents';
import { makeCall } from '../services/phone';

export const ServiceItem = ({ item, onPress }: any) => (
  <TouchableOpacity style={[COMPONENT_STYLES.card, styles.card]} onPress={onPress} activeOpacity={0.9}>
    <View style={styles.topRow}>
      <View style={styles.iconBox}>
        {item.photoUri ? (
          <Image source={{ uri: item.photoUri }} style={styles.thumb} />
        ) : (
          <Ionicons name="business" size={24} color={COLORS.primary} />
        )}
      </View>

      <View style={styles.info}>
        <Text style={styles.name}>{item.serviceName}</Text>

        <View style={styles.metaRow}>
          <Ionicons name="location-outline" size={14} color={COLORS.textSecondary} />
          <Text style={styles.meta} numberOfLines={1}>{item.location}</Text>
        </View>

        <View style={styles.metaRow}>
          <Ionicons name="time-outline" size={14} color={COLORS.textSecondary} />
          <Text style={styles.meta}>{item.officeHours}</Text>
        </View>
      </View>

      <StatusBadge status={item.availability === 'Available' ? 'AVAILABLE' : 'UNAVAILABLE'} />
    </View>

    <View style={styles.bottomRow}>
      <View style={styles.metaRow}>
        <Ionicons name="call-outline" size={15} color={COLORS.primary} />
        <Text style={styles.number}>{item.contactNumber}</Text>
      </View>

      <TouchableOpacity style={styles.callBtn} onPress={() => makeCall(item.contactNumber)}>
        <Text style={styles.callText}>CALL</Text>
      </TouchableOpacity>
    </View>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  card: { marginBottom: 16 },
  topRow: { flexDirection: 'row', alignItems: 'flex-start' },
  iconBox: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md,
    overflow: 'hidden',
  },
  thumb: { width: '100%', height: '100%' },
  info: { flex: 1, marginRight: SPACING.sm },
  name: { ...TYPOGRAPHY.h4, color: COLORS.textPrimary, marginBottom: 4 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 3 },
  meta: { ...TYPOGRAPHY.small, color: COLORS.textSecondary, flexShrink: 1 },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingTop: SPACING.md,
  },
  number: { ...TYPOGRAPHY.bodyLarge, color: COLORS.primary, fontWeight: '700' },
  callBtn: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 24,
    paddingVertical: 11,
    borderRadius: 24,
  },
  callText: { color: COLORS.onBrand, ...TYPOGRAPHY.button, fontSize: 14 },
});