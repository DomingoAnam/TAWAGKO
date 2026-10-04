import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS } from '../theme';

export const AnnouncementCard = ({ item, onPress }: any) => (
  <View style={styles.card}>
    <View style={styles.headerRow}>
      <Text style={styles.category}>{item.category}</Text>
      {item.important && (
        <View style={styles.importantBadge}>
          <Text style={styles.importantText}>IMPORTANT</Text>
        </View>
      )}
    </View>
    <Text style={styles.title}>{item.title}</Text>
    <Text style={styles.meta}>
      {item.date} · {item.time}
    </Text>
    <Text style={styles.description} numberOfLines={3}>
      {item.description}
    </Text>
  </View>
);

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 20,
    padding: 18,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.primaryGreen,
    shadowColor: COLORS.shadowColor,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 4,
  },
  headerRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  category: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.primaryGreen,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  importantBadge: {
    marginLeft: 8,
    backgroundColor: '#FFEBEE',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  importantText: {
    color: COLORS.accentRed,
    fontSize: 10,
    fontWeight: '800',
  },
  title: { fontSize: 17, fontWeight: '700', color: COLORS.textPrimary, marginBottom: 4 },
  meta: { fontSize: 12, color: COLORS.textHint, marginBottom: 8 },
  description: { fontSize: 14, color: COLORS.textSecondary, lineHeight: 20 },
});
