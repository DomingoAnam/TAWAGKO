import React, { useState, useCallback, useRef } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, TYPOGRAPHY } from '../theme';
import { getCurrentUser } from '../services/storage';
import {
  updateAssistanceStatus,
  listAssistanceRequestsDirectory,
  requirePersonnelAuth,
  purgeStaleAssistedRequests,
} from '../services/supabaseStorage';
import { StatusBadge, EmptyState } from '../components/ReusableComponents';
import { localBanner } from '../services/notify';

const STATUSES = ['PENDING', 'UNDER_REVIEW', 'ASSISTANCE_ARRANGED', 'COMPLETED'];

export default function AssistanceManagementScreen() {
  const [items, setItems] = useState<any[]>([]);
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(true);
  const [expired, setExpired] = useState(false);
  const [error, setError] = useState('');
  const seenPendingRef = useRef<number | null>(null);

  const fetchList = useCallback(async () => {
    const me = await getCurrentUser();
    const uname = me?.username ?? username;
    const c = requirePersonnelAuth(uname);
    // Permanently delete completed requests older than 3 days before listing.
    try {
      await purgeStaleAssistedRequests(c.username, 3);
    } catch {
      // Non-fatal; still show what we have.
    }
    const rows = await listAssistanceRequestsDirectory(c.username, c.password);
    setUsername(c.username);
    setItems(rows);

    // System toast when the number of actionable requests rises.
    const pending = rows.filter(
      (r: any) => r.status === 'PENDING' || r.status === 'UNDER_REVIEW'
    ).length;
    if (seenPendingRef.current !== null && pending > seenPendingRef.current) {
      localBanner('New assistance request from a resident.');
    }
    seenPendingRef.current = pending;
  }, [username]);

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;

      (async () => {
        try {
          await fetchList();
          if (!cancelled) setExpired(false);
        } catch (error: any) {
          if (!cancelled) {
            setExpired(true);
            setError(error?.message ?? 'Could not load requests.');
          }
        } finally {
          if (!cancelled) setLoading(false);
        }
      })();

      return () => {
        cancelled = true;
      };
    }, [fetchList])
  );

  const changeStatus = async (item: any, status: string) => {
    if (item.status === 'COMPLETED') {
      // A completed request is final; do not allow moving it back.
      Alert.alert('Request completed', 'This request is completed and can no longer be modified.');
      return;
    }
    try {
      await updateAssistanceStatus(requirePersonnelAuth(username), item.id, status);
      await fetchList();
    } catch (err: any) {
      Alert.alert('Could not update', err?.message ?? 'Please try again.');
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Assistance Requests</Text>
      <Text style={styles.subtitle}>
        Requests submitted by residents from the post-emergency check-in flow.
      </Text>

      {loading ? null : expired ? (
        <View style={styles.expired}>
          <Ionicons name="lock-closed-outline" size={20} color={COLORS.accentDark} />
          <Text style={styles.expiredText}>{error}</Text>
        </View>
      ) : items.length === 0 ? (
        <EmptyState
          title="No assistance requests"
          message="Requests appear here as soon as a resident submits one."
        />
      ) : (
        items.map((item) => (
          <View key={item.id} style={styles.card}>
            <View style={styles.row}>
              <Text style={styles.requestId}>{item.requestId}</Text>
              <StatusBadge status={item.status} label={String(item.status).replace(/_/g, ' ')} />
            </View>

            <Text style={styles.name}>{item.residentName}</Text>

            <View style={styles.metaList}>
              {item.contactNumber ? (
                <View style={styles.metaRow}>
                  <Ionicons name="call-outline" size={14} color={COLORS.primary} />
                  <Text style={styles.metaText}>{item.contactNumber}</Text>
                </View>
              ) : null}
              <View style={styles.metaRow}>
                <Ionicons name="help-circle-outline" size={14} color={COLORS.primary} />
                <Text style={styles.metaText}>
                  {Array.isArray(item.needs) ? item.needs.join(', ') : item.needs}
                </Text>
              </View>
              <View style={styles.metaRow}>
                <Ionicons name="alert-circle-outline" size={14} color={COLORS.accentDark} />
                <Text style={styles.metaText}>{item.urgency}</Text>
              </View>
              {item.details ? (
                <View style={styles.metaRow}>
                  <Ionicons name="document-text-outline" size={14} color={COLORS.textSecondary} />
                  <Text style={styles.metaText}>{item.details}</Text>
                </View>
              ) : null}
            </View>

            <Text style={styles.updateLabel}>Update status</Text>
            <View style={styles.statusRow}>
              {STATUSES.map((s) => {
                const active = item.status === s;
                const locked = item.status === 'COMPLETED';
                return (
                  <TouchableOpacity
                    key={s}
                    disabled={locked}
                    style={[styles.statusBtn, active && styles.statusOn, locked && !active && styles.statusLocked]}
                    onPress={() => changeStatus(item, s)}
                    activeOpacity={locked ? 1 : 0.9}
                  >
                    <Text style={[styles.statusText, active && styles.statusTextOn, locked && !active && styles.statusTextLocked]}>
                      {String(s).replace(/_/g, ' ')}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        ))
      )}
</ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: SPACING.xl, paddingBottom: SPACING.xxl },
  title: { ...TYPOGRAPHY.h2, color: COLORS.textPrimary },
  subtitle: { ...TYPOGRAPHY.caption, color: COLORS.textSecondary, marginTop: 4, marginBottom: SPACING.lg },
  expired: {
    alignItems: 'center',
    gap: SPACING.sm,
    marginTop: SPACING.xxl,
    padding: SPACING.lg,
  },
  expiredText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.accentDark,
    textAlign: 'center',
    fontWeight: '600',
  },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: 18,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  requestId: { ...TYPOGRAPHY.smallBold, color: COLORS.primary },
  name: { ...TYPOGRAPHY.bodyLarge, fontWeight: '700', color: COLORS.textPrimary, marginTop: SPACING.sm },
  metaList: { gap: 6, marginTop: SPACING.md },
  metaRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 7 },
  metaText: { flex: 1, ...TYPOGRAPHY.small, color: COLORS.textPrimary, lineHeight: 18 },
  updateLabel: { ...TYPOGRAPHY.smallBold, color: COLORS.textSecondary, marginTop: SPACING.lg },
  statusRow: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm, marginTop: SPACING.sm },
  statusBtn: {
    paddingVertical: 9,
    paddingHorizontal: 13,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  statusOn: { backgroundColor: COLORS.primary },
  statusText: { ...TYPOGRAPHY.smallBold, color: COLORS.primary, fontSize: 11 },
  statusTextOn: { color: COLORS.onBrand },
  statusLocked: { borderColor: COLORS.border, opacity: 0.45 },
  statusTextLocked: { color: COLORS.textHint },
});
