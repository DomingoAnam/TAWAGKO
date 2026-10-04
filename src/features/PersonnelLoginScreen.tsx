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
import { personnelSignIn, cachePersonnelPassword } from '../services/supabaseStorage';
import { setPersonnelSession } from '../services/storage';

export default function PersonnelLoginScreen({ navigation }: any) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSignIn = async () => {
    const u = username.trim();
    if (!u || !password) {
      Alert.alert('Missing fields', 'Please enter your username and password.');
      return;
    }

    setLoading(true);
    try {
      const account = await personnelSignIn(u, password);
      if (!account) {
        Alert.alert('Sign in failed', 'Incorrect username or password.');
        return;
      }

      // Access is withheld until the shared personnel token is presented.
      if (account.needs_token) {
        navigation.replace('PersonnelToken', {
          username: u,
          password,
          firstName: account.full_name?.split(' ')[0] ?? '',
        });
        return;
      }

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
      Alert.alert('Connection problem', error?.message ?? 'Could not reach the server.');
    } finally {
      setLoading(false);
    }
  };

  const indicators: { label: string; icon: any; color: string }[] = [
    { label: 'Official Account', icon: 'shield-checkmark', color: COLORS.primary },
    { label: 'Verified Personnel', icon: 'checkmark-circle', color: COLORS.accentDark },
  ];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <AppLogo size={86} />
        <Text style={styles.title}>Personnel Portal</Text>
        <Text style={styles.subtitle}>Barangay emergency management system</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Sign In</Text>
        <Text style={styles.cardSubtitle}>Access your official personnel account</Text>

        <Text style={styles.label}>Username / Email</Text>
        <View style={styles.field}>
          <Ionicons name="at-outline" size={19} color={COLORS.textSecondary} style={styles.fieldIcon} />
          <TextInput
            style={styles.input}
            value={username}
            onChangeText={setUsername}
            placeholder="official@barangay.ph"
            placeholderTextColor={COLORS.textHint}
            autoCapitalize="none"
            autoCorrect={false}
          />
        </View>

        <Text style={styles.label}>Password</Text>
        <View style={styles.field}>
          <Ionicons name="lock-closed-outline" size={19} color={COLORS.textSecondary} style={styles.fieldIcon} />
          <TextInput
            style={styles.input}
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!showPassword}
            placeholder="Enter your password"
            placeholderTextColor={COLORS.textHint}
            autoCapitalize="none"
            autoCorrect={false}
          />
          <TouchableOpacity
            onPress={() => setShowPassword((v) => !v)}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            accessibilityRole="button"
            accessibilityLabel={showPassword ? 'Hide password' : 'Show password'}
          >
            <Ionicons
              name={showPassword ? 'eye-off-outline' : 'eye-outline'}
              size={20}
              color={showPassword ? COLORS.primary : COLORS.textHint}
            />
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={styles.primaryBtn}
          onPress={handleSignIn}
          disabled={loading}
          activeOpacity={0.9}
        >
          {loading ? (
            <ActivityIndicator color={COLORS.onBrand} />
          ) : (
            <Text style={styles.primaryBtnText}>SIGN IN</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.linkBtn}
          onPress={() => navigation.navigate('PersonnelRegister')}
          disabled={loading}
        >
          <Text style={styles.linkText}>No account yet? </Text>
          <Text style={styles.linkAction}>Create one</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.indicators}>
        {indicators.map((i) => (
          <View key={i.label} style={styles.indicator}>
            <Ionicons name={i.icon} size={16} color={i.color} />
            <Text style={styles.indicatorText}>{i.label}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  // The whole block is centred as one unit. The header must NOT use flex: 1,
  // otherwise it absorbs all the leftover height and centres itself, leaving a
  // large gap between "Personnel Portal" and the sign-in card.
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    padding: SPACING.xl,
    justifyContent: 'center',
  },
  header: { alignItems: 'center', marginBottom: SPACING.lg },
  title: { marginTop: SPACING.lg, fontSize: 25, fontWeight: '800', color: COLORS.textPrimary },
  subtitle: { marginTop: 4, fontSize: 13, color: COLORS.textSecondary },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: 22,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.md,
  },
  cardTitle: { fontSize: 19, fontWeight: '800', color: COLORS.textPrimary },
  cardSubtitle: { ...TYPOGRAPHY.small, color: COLORS.textSecondary, marginBottom: SPACING.lg },
  label: { ...TYPOGRAPHY.smallBold, color: COLORS.textSecondary, marginBottom: 6 },
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surfaceAlt,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: SPACING.md,
    marginBottom: SPACING.md,
  },
  fieldIcon: { marginRight: SPACING.sm },
  input: { flex: 1, paddingVertical: 14, fontSize: 15, color: COLORS.textPrimary },
  primaryBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: SPACING.sm,
    ...SHADOWS.md,
  },
  primaryBtnText: { color: COLORS.onBrand, fontSize: 15, fontWeight: '800', letterSpacing: 0.4 },
  linkBtn: { flexDirection: 'row', justifyContent: 'center', marginTop: SPACING.md },
  linkText: { ...TYPOGRAPHY.small, color: COLORS.textSecondary },
  linkAction: { ...TYPOGRAPHY.smallBold, color: COLORS.primary },
  indicators: { flexDirection: 'row', justifyContent: 'center', gap: SPACING.lg, marginTop: SPACING.lg },
  indicator: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  indicatorText: { ...TYPOGRAPHY.small, color: COLORS.textSecondary, fontWeight: '600' },
});