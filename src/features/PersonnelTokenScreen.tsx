import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Alert,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, SHADOWS, TYPOGRAPHY } from '../theme';
import { AppLogo } from '../components/AppLogo';
import { claimPersonnelToken, cachePersonnelPassword } from '../services/supabaseStorage';
import { setPersonnelSession } from '../services/storage';

export default function PersonnelTokenScreen({ navigation, route }: any) {
  // Credentials arrive in memory only (from the sign-in / sign-up form). They
  // are never persisted; the token claim re-verifies them server-side.
  const { username = '', password = '', firstName = '' } = route?.params ?? {};

  const [token, setToken] = useState('');
  const [loading, setLoading] = useState(false);

  const handleContinue = async () => {
    const value = token.replace(/\s+/g, '');
    if (!value) {
      Alert.alert('Missing token', 'Please enter the official personnel token.');
      return;
    }

    setLoading(true);
    try {
      const account = await claimPersonnelToken(username, password, value);
      await setPersonnelSession({
        id: account.id,
        role: 'personnel',
        fullName: account.full_name,
        username: account.username,
        position: account.position,
        department: account.department,
        phone: account.phone ?? null,
        facebook_url: account.facebook_url ?? null,
      });
      // Held in memory only, so saves can be authorized without re-prompting.
      cachePersonnelPassword(password);
      navigation.reset({ index: 0, routes: [{ name: 'PersonnelMain' }] });
    } catch (error: any) {
      Alert.alert('Token not accepted', error?.message ?? 'Please check the code and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.navigate('PersonnelLogin')}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          style={styles.backBtn}
          accessibilityRole="button"
          accessibilityLabel="Back to sign in"
        >
          <Ionicons name="arrow-back" size={18} color={COLORS.primary} />
        </TouchableOpacity>
        <AppLogo size={64} showWordmark={false} />
        <Text style={styles.title}>
          {firstName ? `Welcome, ${firstName}` : 'Enter Personnel Token'}
        </Text>
        <Text style={styles.subtitle}>
          Your account is ready. Enter the official token issued by the barangay to
          unlock the dashboard.
        </Text>
      </View>

      <View style={styles.tokenBox}>
        <View style={styles.tokenIcon}>
          <Ionicons name="key" size={24} color={COLORS.accentDark} />
        </View>
        <Text style={styles.boxLabel}>OFFICIAL PERSONNEL TOKEN</Text>
        <View style={styles.field}>
          <TextInput
            style={styles.input}
            value={token}
            onChangeText={setToken}
            placeholder="Paste your token"
            placeholderTextColor={COLORS.textHint}
            autoCapitalize="none"
            autoCorrect={false}
            multiline
          />
        </View>
        <Text style={styles.hint}>
          <Ionicons name="information-circle-outline" size={13} color={COLORS.textHint} />
          {'  '}Ask the barangay administrator if you do not have this code.
        </Text>
      </View>

      <View style={styles.actions}>
        <TouchableOpacity
          style={styles.primaryBtn}
          onPress={handleContinue}
          disabled={loading}
          activeOpacity={0.9}
        >
          {loading ? (
            <ActivityIndicator color={COLORS.onBrand} />
          ) : (
            <Text style={styles.primaryBtnText}>CONTINUE TO DASHBOARD</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.linkBtn}
          onPress={() => navigation.replace('PersonnelLogin')}
          disabled={loading}
        >
          <Text style={styles.linkText}>Use a different account</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  // Same rule as PersonnelLoginScreen: the header must not absorb the leftover
  // height, otherwise the token box is pushed to the bottom of the screen.
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    padding: SPACING.xl,
    justifyContent: 'center',
  },
  header: { alignItems: 'center', marginBottom: SPACING.lg },
  backBtn: { position: 'absolute', top: 0, left: 0 },
  title: { marginTop: SPACING.lg, fontSize: 23, fontWeight: '800', color: COLORS.textPrimary, textAlign: 'center' },
  subtitle: {
    marginTop: 6,
    fontSize: 13,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 19,
    paddingHorizontal: SPACING.sm,
  },
  tokenBox: {
    backgroundColor: COLORS.surface,
    borderRadius: 22,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.accent,
    ...SHADOWS.md,
  },
  tokenIcon: { alignSelf: 'center', marginBottom: SPACING.sm },
  boxLabel: {
    ...TYPOGRAPHY.smallBold,
    color: COLORS.accentDark,
    textAlign: 'center',
    letterSpacing: 0.6,
    marginBottom: SPACING.sm,
  },
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surfaceAlt,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: SPACING.md,
  },
  input: { flex: 1, paddingVertical: 14, fontSize: 15, color: COLORS.textPrimary, minHeight: 48 },
  hint: { ...TYPOGRAPHY.small, color: COLORS.textHint, marginTop: SPACING.sm, textAlign: 'center' },
  actions: { marginTop: SPACING.lg },
  primaryBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: 16,
    paddingVertical: 17,
    alignItems: 'center',
    ...SHADOWS.md,
  },
  primaryBtnText: { color: COLORS.onBrand, fontSize: 15, fontWeight: '800', letterSpacing: 0.4 },
  linkBtn: { alignSelf: 'center', marginTop: SPACING.lg },
  linkText: { ...TYPOGRAPHY.small, ...TYPOGRAPHY.smallBold, color: COLORS.textSecondary },
});