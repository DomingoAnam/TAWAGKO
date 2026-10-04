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
import { COLORS, SPACING, SHADOWS } from '../theme';
import { AppLogo } from '../components/AppLogo';
import { supabase } from '../services/supabase';

export default function ResidentLoginScreen({ navigation }: any) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!username.trim() || !password.trim()) {
      Alert.alert('Missing fields', 'Please enter both username and password.');
      return;
    }

    setLoading(true);
    const email = username
      .trim()
      .includes('@')
      ? username.trim()
      : `${username.trim()}@tawagko.local`;

    const { error } = await supabase.auth.signInWithPassword({ email, password });

    setLoading(false);
    if (error) {
      Alert.alert('Sign in failed', error.message);
      return;
    }
    navigation.replace('ResidentMain');
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <AppLogo size={84} showWordmark={false} />
        <Text style={styles.title}>Welcome Back</Text>
        <Text style={styles.subtitle}>Sign in to continue to TawagKo</Text>
      </View>

      <View style={styles.card}>
        <View style={styles.field}>
          <View style={styles.fieldIcon}>
            <Ionicons name="person-outline" size={20} color={COLORS.textSecondary} />
          </View>
          <TextInput
            style={styles.input}
            value={username}
            onChangeText={setUsername}
            autoCapitalize="none"
            autoCorrect={false}
            placeholder="Username or email"
            placeholderTextColor={COLORS.textHint}
          />
        </View>

        <View style={styles.field}>
          <View style={styles.fieldIcon}>
            <Ionicons name="lock-closed-outline" size={20} color={COLORS.textSecondary} />
          </View>
          <TextInput
            style={styles.input}
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!showPassword}
            placeholder="Password"
            placeholderTextColor={COLORS.textHint}
          />
          <TouchableOpacity
            onPress={() => setShowPassword((v) => !v)}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            accessibilityRole="button"
            accessibilityLabel={showPassword ? 'Hide password' : 'Show password'}
            style={styles.eyeButton}
          >
            <Ionicons
              name={showPassword ? 'eye-off-outline' : 'eye-outline'}
              size={21}
              color={showPassword ? COLORS.primary : COLORS.textHint}
            />
          </TouchableOpacity>
        </View>
      </View>

      <TouchableOpacity
        style={styles.primaryBtn}
        onPress={handleLogin}
        disabled={loading}
        activeOpacity={0.9}
      >
        {loading ? (
          <ActivityIndicator color={COLORS.textInverse} />
        ) : (
          <Text style={styles.primaryBtnText}>Sign In</Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.secondaryBtn}
        onPress={() => navigation.navigate('ResidentRegister')}
        activeOpacity={0.9}
      >
        <Ionicons name="person-add-outline" size={18} color={COLORS.primary} />
        <Text style={styles.secondaryBtnText}>Create New Account</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    padding: SPACING.xl,
    justifyContent: 'center',
  },
  header: { alignItems: 'center', marginBottom: SPACING.xl },
  title: {
    marginTop: SPACING.lg,
    fontSize: 26,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  subtitle: {
    marginTop: 6,
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: 20,
    padding: SPACING.lg,
    marginBottom: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.sm,
  },
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
  input: {
    flex: 1,
    paddingVertical: 14,
    fontSize: 15,
    color: COLORS.textPrimary,
  },
  eyeButton: { paddingLeft: SPACING.sm },
  primaryBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: 16,
    paddingVertical: 17,
    alignItems: 'center',
    width: '100%',
    marginBottom: SPACING.md,
    ...SHADOWS.md,
  },
  primaryBtnText: {
    color: COLORS.textInverse,
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  secondaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    borderWidth: 1.5,
    borderColor: COLORS.primary,
    borderRadius: 16,
    paddingVertical: 15,
    width: '100%',
  },
  secondaryBtnText: {
    color: COLORS.primary,
    fontSize: 15,
    fontWeight: '700',
  },
});