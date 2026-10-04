import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, TYPOGRAPHY, COMPONENT_STYLES, SHADOWS } from '../theme';
import { EmergencyContactItem } from '../components/EmergencyContactItem';
import { getEmergencyContacts } from '../services/storage';
import { AppLogo } from '../components/AppLogo';

export default function EmergencyContactsScreen({ navigation }: any) {
  const [contacts, setContacts] = useState<any[]>([]);

  useEffect(() => {
    const load = async () => {
      const data = (await getEmergencyContacts()) || [];
      setContacts(data);
    };
    load();
  }, []);

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: SPACING.xl }}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <View style={styles.backRow}>
            <Ionicons name="arrow-back" size={18} color={COLORS.primary} />
            <Text style={styles.backBtn}>Back</Text>
          </View>
        </TouchableOpacity>
        <AppLogo size={54} />
      </View>
      <Text style={styles.title}>Emergency Contacts</Text>
      <Text style={styles.subtitle}>Quickly contact verified emergency services.</Text>
      {contacts.map((c) => (
        <EmergencyContactItem key={c.id} item={c} />
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.lightGray },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.xl,
  },
  backRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  backBtn: {
    ...TYPOGRAPHY.captionBold,
    color: COLORS.primaryGreen,
  },
  title: { ...TYPOGRAPHY.h2, color: COLORS.textPrimary, marginBottom: SPACING.xs },
  subtitle: { ...TYPOGRAPHY.caption, color: COLORS.textSecondary, marginTop: SPACING.xs },
});