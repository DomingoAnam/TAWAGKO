import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert, RefreshControl } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, TYPOGRAPHY } from '../theme';
import { getOfficials, getCurrentUser } from '../services/storage';
import { EmptyState } from '../components/ReusableComponents';

export default function ManageOfficialsScreen({ navigation }: any) {
  const [items, setItems] = useState<any[]>([]);
  const [selfId, setSelfId] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const me = await getCurrentUser();
      setSelfId(me?.id ?? null);
      setItems((await getOfficials()) || []);
    } catch (error: any) {
      Alert.alert('Could not load officials', error?.message ?? 'Check your connection.');
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  // You manage other officials; your own details live in your profile.
  const others = items.filter((o) => o.id !== selfId);
  const incomplete = others.filter((o) => !o.phone || !o.facebook_url);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />
      }
    >
      <Text style={styles.title}>Officials</Text>
      <Text style={styles.subtitle}>
        Personnel who created an account and entered the official token. Tap anyone to
        call them or open their Facebook page.
      </Text>

      {incomplete.length > 0 ? (
        <View style={styles.warn}>
          <Ionicons name="warning" size={16} color={COLORS.accentDark} />
          <Text style={styles.warnText}>
            {incomplete.length} official{incomplete.length > 1 ? 's are' : ' is'} missing a
            phone number or Facebook page. They can add these in Profile → Edit Profile.
          </Text>
        </View>
      ) : null}

      {loading ? null : others.length === 0 ? (
        <EmptyState
          title="No other officials yet"
          message="Personnel appear here automatically once they create an account and enter the official token."
        />
      ) : (
        others.map((item) => (
          <TouchableOpacity
            key={item.id}
            style={styles.row}
            onPress={() => navigation.navigate('OfficialDetail', { official: item })}
            activeOpacity={0.9}
            accessibilityRole="button"
            accessibilityLabel={`${item.full_name}, ${item.position ?? 'Barangay personnel'}`}
            accessibilityHint="Opens contact options"
          >
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {(item.full_name || '?').charAt(0).toUpperCase()}
              </Text>
            </View>

            <View style={styles.info}>
              <Text style={styles.name} numberOfLines={1}>
                {item.full_name}
              </Text>
              <Text style={styles.position} numberOfLines={1}>
                {item.position || 'Barangay Personnel'}
              </Text>
            </View>

            <Ionicons name="chevron-forward" size={18} color={COLORS.textHint} />
          </TouchableOpacity>
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
  warn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    backgroundColor: COLORS.accentLight,
    borderRadius: 14,
    padding: SPACING.md,
    marginBottom: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.accent,
  },
  warnText: { flex: 1, ...TYPOGRAPHY.small, color: COLORS.accentDark, fontWeight: '600', lineHeight: 17 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: SPACING.md,
    marginBottom: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md,
  },
  avatarText: { fontSize: 17, fontWeight: '800', color: COLORS.primary },
  info: { flex: 1 },
  name: { ...TYPOGRAPHY.bodyLarge, fontWeight: '700', color: COLORS.textPrimary },
  position: { ...TYPOGRAPHY.small, color: COLORS.primary, fontWeight: '600', marginTop: 1 },
});