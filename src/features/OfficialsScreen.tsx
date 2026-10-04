import React, { useState, useCallback, useMemo } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, RefreshControl } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, TYPOGRAPHY } from '../theme';
import { getOfficials } from '../services/storage';
import { EmptyState } from '../components/ReusableComponents';

const initials = (name: string) =>
  (name || '?')
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase();

export default function OfficialsScreen({ navigation }: any) {
  const [items, setItems] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      setItems((await getOfficials()) || []);
    } catch {
      setItems([]);
    }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const captain = useMemo(() => items.find((o) => o.position === 'Barangay Captain'), [items]);
  const rest = useMemo(() => items.filter((o) => o !== captain), [items, captain]);

  const renderItem = ({ item }: { item: any }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => navigation.navigate('OfficialDetail', { official: item })}
      activeOpacity={0.9}
      accessibilityRole="button"
      accessibilityLabel={`View ${item.full_name}, ${item.position ?? 'Barangay personnel'}`}
    >
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>{initials(item.full_name)}</Text>
      </View>

      <View style={styles.info}>
        <Text style={styles.name} numberOfLines={1}>
          {item.full_name}
        </Text>
        <Text style={styles.position} numberOfLines={1}>
          {item.position || 'Barangay Personnel'}
        </Text>
        {item.department ? (
          <Text style={styles.department} numberOfLines={1}>
            {item.department}
          </Text>
        ) : null}
      </View>

      <Ionicons name="chevron-forward" size={18} color={COLORS.textHint} />
    </TouchableOpacity>
  );

  return (
    <FlatList
      style={styles.container}
      contentContainerStyle={styles.content}
      data={rest}
      keyExtractor={(item) => item.id}
      renderItem={renderItem}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />
      }
      ListHeaderComponent={
        <View>
          <Text style={styles.title}>Barangay Officials</Text>
          <Text style={styles.subtitle}>
            Tap an official to view their details and contact them.
          </Text>

          {captain ? (
            <>
              <Text style={styles.sectionTitle}>Barangay Captain</Text>
              {renderItem({ item: captain })}
              <View style={styles.spacer} />
            </>
          ) : null}

          {rest.length > 0 ? (
            <Text style={styles.sectionTitle}>
              {captain ? 'Other Personnel' : 'Personnel'}
            </Text>
          ) : null}
        </View>
      }
      ListEmptyComponent={
        captain ? null : (
          <EmptyState
            title="No officials listed yet"
            message="Officials appear here once they create a personnel account and enter the official token."
          />
        )
      }
    />
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: SPACING.xl, paddingBottom: SPACING.xxl },
  title: { ...TYPOGRAPHY.h2, color: COLORS.textPrimary },
  subtitle: { ...TYPOGRAPHY.caption, color: COLORS.textSecondary, marginTop: 4, marginBottom: SPACING.lg },
  sectionTitle: { ...TYPOGRAPHY.h4, color: COLORS.textPrimary, marginBottom: SPACING.md },
  spacer: { height: SPACING.lg },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: 18,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md,
  },
  avatarText: { fontSize: 18, fontWeight: '800', color: COLORS.primary },
  info: { flex: 1 },
  name: { ...TYPOGRAPHY.bodyLarge, fontWeight: '700', color: COLORS.textPrimary },
  position: { ...TYPOGRAPHY.small, color: COLORS.primary, marginTop: 2, fontWeight: '600' },
  department: { ...TYPOGRAPHY.small, color: COLORS.textSecondary, marginTop: 1 },
});