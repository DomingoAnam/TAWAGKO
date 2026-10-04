import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { COLORS, SPACING, TYPOGRAPHY, COMPONENT_STYLES, SHADOWS } from '../theme';
import { ServiceItem } from '../components/ServiceItem';
import { SearchBar } from '../components/SearchBar';
import { getBarangayServices } from '../services/storage';
import { AppLogo } from '../components/AppLogo';

export default function ServicesScreen() {
  const [services, setServices] = useState<any[]>([]);
  const [query, setQuery] = useState('');

  useEffect(() => {
    const load = async () => {
      const data = (await getBarangayServices()) || [];
      setServices(data);
    };
    load();
  }, []);

  const filtered = services.filter((s) =>
    s.serviceName.toLowerCase().includes(query.toLowerCase()) ||
    s.description.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: SPACING.xl }}>
      <View style={styles.header}>
        <AppLogo size={54} />
      </View>
      <Text style={styles.title}>Barangay Services</Text>
      <SearchBar value={query} onChangeText={setQuery} placeholder="Search services…" />
      {filtered.map((s) => (
        <ServiceItem key={s.id} item={s} />
      ))}
      {filtered.length === 0 && (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>No services found.</Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.lightGray },
  header: {
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  title: { ...TYPOGRAPHY.h2, color: COLORS.textPrimary, textAlign: 'center', marginBottom: SPACING.md },
  emptyState: { alignItems: 'center', marginTop: SPACING.xl },
  emptyText: { ...TYPOGRAPHY.caption, color: COLORS.textHint },
});