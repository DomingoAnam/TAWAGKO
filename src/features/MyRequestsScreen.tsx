import React, { useState, useCallback, useRef } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { COLORS } from '../theme';
import { AssistanceCard } from '../components/AssistanceCard';
import { getAssistanceRequests, getCurrentUser } from '../services/storage';
import { localBanner } from '../services/notify';

// Banner text for each assistance status.
const STATUS_TITLE: Record<string, string> = {
  PENDING: 'Request received',
  UNDER_REVIEW: 'Request under review',
  ASSISTANCE_ARRANGED: 'Help is on the way',
  COMPLETED: 'Request completed',
};

const STATUS_MESSAGE: Record<string, string> = {
  PENDING: 'The barangay has received your request and is waiting to review it.',
  UNDER_REVIEW: 'The barangay is reviewing your request.',
  ASSISTANCE_ARRANGED: 'Your assistance is on the way.',
  COMPLETED: 'Your assistance request has been completed. Thank you.',
};

export default function MyRequestsScreen({ navigation }: any) {
  const [requests, setRequests] = useState<any[]>([]);
  const lastStatusRef = useRef<Record<string, string> | null>(null);

  useFocusEffect(
    useCallback(() => {
      const load = async () => {
        const user = await getCurrentUser();
        const all = (await getAssistanceRequests()) || [];
        const mine = all.filter((r: any) => r.residentId === user?.id);
        setRequests(mine);

        // Toast when a request's status changes since we last loaded.
        const prev = lastStatusRef.current;
        if (prev) {
          mine.forEach((r: any) => {
            const before = prev[r.id];
            if (before !== undefined && before !== r.status) {
              localBanner(STATUS_TITLE[r.status] ?? 'Assistance update', STATUS_MESSAGE[r.status] ?? `Your request status is now ${r.status}.`);
            }
          });
        }
        lastStatusRef.current = Object.fromEntries(
          mine.map((r: any) => [r.id, r.status])
        );
      };
      load();
    }, [])
  );

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: 20 }}>
      <TouchableOpacity onPress={() => navigation.goBack()}>
        <View style={styles.backRow}>
            <Ionicons name="arrow-back" size={18} color={COLORS.primary} />
            <Text style={styles.back}>Back</Text>
          </View>
      </TouchableOpacity>
      <Text style={styles.title}>My Assistance Requests</Text>
      {requests.length === 0 ? (
        <Text style={styles.empty}>No assistance requests yet.</Text>
      ) : (
        requests.map((r) => (
          <AssistanceCard
            key={r.id}
            item={r}
            onPress={() => navigation.navigate('AssistanceRequestDetail', { request: r })}
          />
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.lightGray },
  backRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  back: { color: COLORS.primaryGreen, fontWeight: '700', fontSize: 15, marginBottom: 12 },
  title: { fontSize: 22, fontWeight: '800', color: COLORS.textPrimary, marginBottom: 16 },
  empty: { textAlign: 'center', color: COLORS.textSecondary, marginTop: 30 },
});
