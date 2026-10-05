import React, { useState, useCallback } from 'react';
import { Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { COLORS } from '../theme';
import { AnnouncementCard } from '../components/AnnouncementCard';
import { getAnnouncements } from '../services/storage';

const CATEGORIES = ['ALL', 'EMERGENCY', 'SERVICES', 'COMMUNITY'];

export default function AnnouncementsScreen() {
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [category, setCategory] = useState('ALL');

  useFocusEffect(
    useCallback(() => {
      const load = async () => {
        const data = (await getAnnouncements()) || [];
        setAnnouncements(data);
      };
      load();
    }, [])
  );

  const filtered = category === 'ALL'
    ? announcements
    : announcements.filter((a) => a.category === category);

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: 20 }}>
      <Text style={styles.title}>Barangay Updates</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.catRow}>
        {CATEGORIES.map((c) => (
          <TouchableOpacity
            key={c}
            style={[styles.catBtn, category === c && styles.catBtnOn]}
            onPress={() => setCategory(c)}
          >
            <Text style={[styles.catText, category === c && styles.catTextOn]}>{c}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
      {filtered.map((a) => (
        <AnnouncementCard key={a.id} item={a} />
      ))}
      {filtered.length === 0 && <Text style={styles.empty}>No announcements.</Text>}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.lightGray },
  title: { fontSize: 24, fontWeight: '800', color: COLORS.textPrimary, marginBottom: 12 },
  catRow: { marginBottom: 16 },
  catBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: COLORS.lightGray,
    marginRight: 8,
  },
  catBtnOn: { backgroundColor: COLORS.primaryGreen },
  catText: { fontWeight: '700', color: COLORS.textSecondary, fontSize: 12 },
  catTextOn: { color: COLORS.white },
  empty: { textAlign: 'center', color: COLORS.textSecondary, marginTop: 30 },
});
