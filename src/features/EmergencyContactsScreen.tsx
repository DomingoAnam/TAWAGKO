import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { COLORS, SPACING, TYPOGRAPHY } from '../theme';
import { EmergencyContactItem } from '../components/EmergencyContactItem';
import { getEmergencyContacts } from '../services/storage';
import { AppLogo } from '../components/AppLogo';

export default function EmergencyContactsScreen({ navigation }: any) {
  const [contacts, setContacts] = useState<any[]>([]);

  useFocusEffect(
    useCallback(() => {
      const load = async () => {
        const data = (await getEmergencyContacts()) || [];
        setContacts(data);
      };
      load();
    }, [])
  );

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: SPACING.xl }}>
      <View style={styles.header}>
        <AppLogo size={54} />
      </View>
      <Text style={styles.title}>Emergency Contacts</Text>
      <Text style={styles.subtitle}>Quickly contact verified emergency services.</Text>
      {contacts.length === 0 ? (
        <Text style={styles.empty}>No emergency contacts have been published yet.</Text>
      ) : null}
      {contacts.map((c) => (
        <EmergencyContactItem key={c.id} item={c} />
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: {
    alignItems: 'center',
    marginBottom: SPACING.xl,
  },
  empty: { ...TYPOGRAPHY.caption, color: COLORS.textHint, textAlign: 'center', marginTop: SPACING.lg },
  title: { ...TYPOGRAPHY.h2, color: COLORS.textPrimary, marginBottom: SPACING.xs },
  subtitle: { ...TYPOGRAPHY.caption, color: COLORS.textSecondary, marginTop: SPACING.xs },
});