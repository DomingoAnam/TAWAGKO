import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { COLORS } from '../theme';
import { StatusBadge } from './ReusableComponents';

export const AssistanceCard = ({ item, onPress }: any) => (
  <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.8}>
    <View style={styles.topRow}>
      <Text style={styles.requestId}>{item.requestId}</Text>
      <StatusBadge status={item.status} label={String(item.status).replace(/_/g, ' ')} />
    </View>
    <Text style={styles.needs}>
      {Array.isArray(item.needs) ? item.needs.join(', ') : item.needs}
    </Text>
    <Text style={styles.urgency}>Urgency: {item.urgency}</Text>
    <Text style={styles.date}>Submitted: {item.submittedAt}</Text>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 20,
    padding: 18,
    marginBottom: 14,
    shadowColor: COLORS.shadowColor,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 4,
  },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  requestId: { fontSize: 15, fontWeight: '700', color: COLORS.primaryGreen },
  needs: { fontSize: 15, fontWeight: '600', color: COLORS.textPrimary, marginTop: 8 },
  urgency: { fontSize: 13, color: COLORS.accentRed, marginTop: 4, fontWeight: '600' },
  date: { fontSize: 12, color: COLORS.textSecondary, marginTop: 4 },
});
