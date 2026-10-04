import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../theme';
import { StatusBadge } from '../components/ReusableComponents';

const FLOW = ['PENDING', 'UNDER_REVIEW', 'ASSISTANCE_ARRANGED', 'COMPLETED'];

export default function AssistanceRequestDetailScreen({ route, navigation }: any) {
  const { request } = route.params || {};
  if (!request) {
    return (
      <View style={styles.container}>
        <Text>Request not found.</Text>
      </View>
    );
  }

  const currentIndex = FLOW.indexOf(request.status);

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: 20 }}>
      <TouchableOpacity onPress={() => navigation.goBack()}>
        <View style={styles.backRow}>
            <Ionicons name="arrow-back" size={18} color={COLORS.primary} />
            <Text style={styles.back}>Back</Text>
          </View>
      </TouchableOpacity>
      <Text style={styles.title}>{request.requestId}</Text>
      <StatusBadge status={request.status} label={String(request.status).replace(/_/g, ' ')} />

      <View style={styles.section}>
        <Text style={styles.label}>Assistance Needed</Text>
        <Text style={styles.value}>{Array.isArray(request.needs) ? request.needs.join(', ') : request.needs}</Text>
        <Text style={styles.label}>Urgency</Text>
        <Text style={styles.value}>{request.urgency}</Text>
        <Text style={styles.label}>Details</Text>
        <Text style={styles.value}>{request.details || 'None'}</Text>
        <Text style={styles.label}>Date Submitted</Text>
        <Text style={styles.value}>{request.submittedAt}</Text>
      </View>

      <Text style={styles.flowTitle}>Status Flow</Text>
      {FLOW.map((s, i) => (
        <View key={s} style={styles.flowRow}>
          <View style={[styles.dot, i <= currentIndex && styles.dotOn]} />
          <Text style={[styles.flowLabel, i <= currentIndex && styles.flowLabelOn]}>
            {String(s).replace(/_/g, ' ')}
          </Text>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.lightGray },
  backRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  back: { color: COLORS.primaryGreen, fontWeight: '700', fontSize: 15, marginBottom: 12 },
  title: { fontSize: 24, fontWeight: '800', color: COLORS.textPrimary, marginBottom: 8 },
  section: { marginTop: 20, backgroundColor: COLORS.lightGray, borderRadius: 16, padding: 16 },
  label: { fontSize: 12, fontWeight: '700', color: COLORS.textSecondary, marginTop: 10 },
  value: { fontSize: 15, color: COLORS.textPrimary, fontWeight: '600' },
  flowTitle: { fontSize: 16, fontWeight: '700', marginTop: 24, marginBottom: 12 },
  flowRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  dot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 2,
    borderColor: COLORS.mediumGray,
    marginRight: 10,
  },
  dotOn: { backgroundColor: COLORS.primaryGreen, borderColor: COLORS.primaryGreen },
  flowLabel: { fontSize: 14, color: COLORS.textHint },
  flowLabelOn: { color: COLORS.primaryGreen, fontWeight: '700' },
});
