import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Switch,
  Alert,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, TYPOGRAPHY } from '../theme';
import { getCurrentUser } from '../services/storage';
import { listResidents, setResidentActive } from '../services/supabaseStorage';
import { EmptyState } from '../components/ReusableComponents';

export default function ManageResidentsScreen() {
  const [items, setItems] = useState<any[]>([]);
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    try {
      const me = await getCurrentUser();
      const uname = me?.username ?? '';
      setUsername(uname);
      if (!uname) throw new Error('You are not signed in as personnel.');
      setItems((await listResidents(uname)) || []);
      setError('');
    } catch (e: any) {
      setError(e?.message ?? 'Could not load residents.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const onRefresh = () => {
    setRefreshing(true);
    load();
  };

  const toggle = (r: any) => {
    const target = !r.isActive;
    Alert.alert(
      target ? 'Enable resident?' : 'Disable resident?',
      target
        ? `${r.fullName} can sign in again.`
        : `${r.fullName} will no longer be treated as active.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: target ? 'Enable' : 'Disable',
          style: target ? 'default' : 'destructive',
          onPress: async () => {
            try {
              await setResidentActive(username, r.id, target);
              await load();
            } catch (e: any) {
              Alert.alert('Could not update', e?.message ?? 'Please try again.');
            }
          },
        },
      ]
    );
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />
      }
    >
      <Text style={styles.title}>Resident Data</Text>
      <Text style={styles.subtitle}>
        Every resident who has signed up. Their profile shows as verified/active.
      </Text>

      {loading ? (
        <ActivityIndicator color={COLORS.primary} style={styles.loader} />
      ) : error ? (
        <View style={styles.error}>
          <Ionicons name="lock-closed-outline" size={20} color={COLORS.accentDark} />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : items.length === 0 ? (
        <EmptyState
          title="No residents yet"
          message="Residents appear here after they sign up."
        />
      ) : (
        items.map((r) => (
          <View key={r.id} style={styles.card}>
            <View style={styles.cardTop}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{(r.fullName || '?').charAt(0).toUpperCase()}</Text>
              </View>
              <View style={styles.info}>
                <Text style={styles.name}>{r.fullName}</Text>
                <Text style={styles.meta}>{r.username}</Text>
                {r.contactNumber ? <Text style={styles.meta}>{r.contactNumber}</Text> : null}
                {r.address ? <Text style={styles.meta}>{r.address}</Text> : null}
              </View>
              <View style={styles.badges}>
                <View style={[styles.badge, r.verificationStatus === 'VERIFIED' && styles.badgeOk]}>
                  <Text style={[styles.badgeText, r.verificationStatus === 'VERIFIED' && styles.badgeTextOk]}>
                    {r.verificationStatus === 'VERIFIED' ? 'VERIFIED' : 'PENDING'}
                  </Text>
                </View>
                <View style={[styles.badge, !r.isActive && styles.badgeOff]}>
                  <Text style={[styles.badgeText, !r.isActive && styles.badgeTextOff]}>
                    {r.isActive ? 'ACTIVE' : 'DISABLED'}
                  </Text>
                </View>
              </View>
            </View>

            <View style={styles.toggleRow}>
              <Text style={styles.toggleLabel}>Account active</Text>
              <Switch
                value={!!r.isActive}
                onValueChange={() => toggle(r)}
                trackColor={{ true: COLORS.primary, false: COLORS.border }}
              />
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
  loader: { marginVertical: SPACING.xl },
  error: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, marginTop: SPACING.xl, padding: SPACING.md },
  errorText: { flex: 1, ...TYPOGRAPHY.small, color: COLORS.accentDark, fontWeight: '600' },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: 18,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: SPACING.md,
  },
  cardTop: { flexDirection: 'row', alignItems: 'flex-start' },
  avatar: {
    width: 46, height: 46, borderRadius: 15,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center', justifyContent: 'center',
    marginRight: SPACING.md,
  },
  avatarText: { fontSize: 18, fontWeight: '800', color: COLORS.primary },
  info: { flex: 1 },
  name: { ...TYPOGRAPHY.bodyLarge, fontWeight: '700', color: COLORS.textPrimary },
  meta: { ...TYPOGRAPHY.small, color: COLORS.textSecondary, marginTop: 1 },
  badges: { gap: 5, alignItems: 'flex-end' },
  badge: { backgroundColor: COLORS.surfaceAlt, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10 },
  badgeOk: { backgroundColor: COLORS.primaryLight },
  badgeOff: { backgroundColor: COLORS.accentLight },
  badgeText: { ...TYPOGRAPHY.smallBold, fontSize: 10, color: COLORS.textHint },
  badgeTextOk: { color: COLORS.primary },
  badgeTextOff: { color: COLORS.accentDark },
  toggleRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    borderTopWidth: 1, borderTopColor: COLORS.border, paddingTop: SPACING.md, marginTop: SPACING.md,
  },
  toggleLabel: { ...TYPOGRAPHY.caption, fontWeight: '700', color: COLORS.textPrimary },
});
