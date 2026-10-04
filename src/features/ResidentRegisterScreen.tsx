import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  StyleSheet,
  Alert,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, SHADOWS } from '../theme';
import { AppLogo } from '../components/AppLogo';
import { supabase } from '../services/supabase';

type FieldKey =
  | 'fullName'
  | 'username'
  | 'password'
  | 'confirmPassword'
  | 'contactNumber'
  | 'address';

export default function ResidentRegisterScreen({ navigation }: any) {
  const [form, setForm] = useState({
    fullName: '',
    username: '',
    password: '',
    confirmPassword: '',
    contactNumber: '',
    address: '',
  });
  const [visible, setVisible] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(false);

  const update = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));
  const toggle = (k: string) => setVisible((v) => ({ ...v, [k]: !v[k] }));

  const handleRegister = async () => {
    const { fullName, username, password, confirmPassword, contactNumber, address } = form;

    if (!fullName || !username || !password || !confirmPassword || !contactNumber || !address) {
      Alert.alert('Missing fields', 'Please complete all required fields.');
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert('Password mismatch', 'Passwords do not match. Please try again.');
      return;
    }
    if (password.length < 6) {
      Alert.alert('Weak password', 'Password must be at least 6 characters.');
      return;
    }

    setLoading(true);
    const email = username.includes('@') ? username : `${username}@tawagko.local`;
    const { data, error } = await supabase.auth.signUp({ email, password });

    if (error) {
      setLoading(false);
      Alert.alert('Registration failed', error.message);
      return;
    }

    if (!data.user) {
      setLoading(false);
      Alert.alert('Registration failed', 'Could not create the account.');
      return;
    }

    // When email confirmation is enabled, signUp returns a user but no session.
    // The profile insert needs an authenticated caller (auth.uid()), so we must
    // stop here and ask them to confirm their email first.
    if (!data.session) {
      setLoading(false);
      Alert.alert(
        'Confirm your email',
        'We sent a confirmation link to your email. Please confirm it, then sign in to finish setting up your account.'
      );
      navigation.replace('ResidentLogin');
      return;
    }

    const { error: dbError } = await supabase.rpc('create_resident_profile', {
      p_id: data.user.id,
      p_full_name: fullName,
      p_username: username,
      p_contact_number: contactNumber,
      p_address: address,
    });

    setLoading(false);
    if (dbError) {
      Alert.alert('Profile save failed', dbError.message);
      return;
    }
    Alert.alert(
      'Account created',
      'You can verify your residency any time from your Profile.'
    );
    navigation.replace('ResidentMain');
  };

  const fields: {
    label: string;
    k: FieldKey;
    placeholder: string;
    icon: any;
    secure?: boolean;
    keyboardType?: any;
    autoCapitalize?: any;
  }[] = [
    { label: 'Full Name', k: 'fullName', placeholder: 'Juan Dela Cruz', icon: 'person-outline', autoCapitalize: 'words' },
    { label: 'Username / Email', k: 'username', placeholder: 'juan@email.com', icon: 'at-outline' },
    { label: 'Password', k: 'password', placeholder: 'At least 6 characters', icon: 'lock-closed-outline', secure: true },
    { label: 'Confirm Password', k: 'confirmPassword', placeholder: 'Repeat password', icon: 'shield-checkmark-outline', secure: true },
    { label: 'Contact Number', k: 'contactNumber', placeholder: '09123456789', icon: 'call-outline', keyboardType: 'phone-pad' },
    { label: 'Address', k: 'address', placeholder: 'Barangay', icon: 'location-outline', autoCapitalize: 'words' },
  ];

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
    >
      <View style={styles.header}>
        <AppLogo size={72} showWordmark={false} />
        <Text style={styles.title}>Create Account</Text>
        <Text style={styles.subtitle}>Register as a TawagKo resident</Text>
      </View>

      <View style={styles.card}>
        {fields.map((f) => (
          <View key={f.k} style={styles.fieldGroup}>
            <Text style={styles.label}>{f.label}</Text>

            <View style={styles.field}>
              <View style={styles.fieldIcon}>
                <Ionicons name={f.icon} size={19} color={COLORS.textSecondary} />
              </View>

              <TextInput
                style={styles.input}
                value={(form as any)[f.k]}
                onChangeText={(v) => update(f.k, v)}
                secureTextEntry={f.secure ? !visible[f.k] : false}
                placeholder={f.placeholder}
                placeholderTextColor={COLORS.textHint}
                autoCapitalize={f.autoCapitalize || 'none'}
                autoCorrect={false}
                keyboardType={f.keyboardType}
              />

              {f.secure && (
                <TouchableOpacity
                  onPress={() => toggle(f.k)}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  accessibilityRole="button"
                  accessibilityLabel={visible[f.k] ? `Hide ${f.label}` : `Show ${f.label}`}
                  style={styles.eyeButton}
                >
                  <Ionicons
                    name={visible[f.k] ? 'eye-off-outline' : 'eye-outline'}
                    size={20}
                    color={visible[f.k] ? COLORS.primary : COLORS.textHint}
                  />
                </TouchableOpacity>
              )}
            </View>
          </View>
        ))}
      </View>

      <TouchableOpacity
        style={styles.primaryBtn}
        onPress={handleRegister}
        disabled={loading}
        activeOpacity={0.9}
      >
        {loading ? (
          <ActivityIndicator color={COLORS.textInverse} />
        ) : (
          <Text style={styles.primaryBtnText}>Create Account</Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.linkBtn}
        onPress={() => navigation.goBack()}
        activeOpacity={0.9}
      >
        <Ionicons name="arrow-back" size={16} color={COLORS.textSecondary} />
        <Text style={styles.linkText}>Back to sign in</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: SPACING.xl, paddingBottom: SPACING.xxl },
  header: { alignItems: 'center', marginBottom: SPACING.lg },
  title: {
    marginTop: SPACING.md,
    fontSize: 24,
    fontWeight: '800',
    color: COLORS.textPrimary,
    textAlign: 'center',
  },
  subtitle: {
    marginTop: 4,
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: 20,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.sm,
  },
  fieldGroup: { marginBottom: SPACING.md },
  label: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textSecondary,
    marginBottom: 6,
    letterSpacing: 0.3,
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
  fieldIcon: { marginRight: SPACING.sm },
  input: {
    flex: 1,
    paddingVertical: 13,
    fontSize: 15,
    color: COLORS.textPrimary,
  },
  eyeButton: { paddingLeft: SPACING.sm },
  primaryBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: 16,
    paddingVertical: 17,
    alignItems: 'center',
    marginTop: SPACING.lg,
    ...SHADOWS.md,
  },
  primaryBtnText: {
    color: COLORS.textInverse,
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  linkBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: SPACING.lg,
  },
  linkText: { color: COLORS.textSecondary, fontSize: 14, fontWeight: '600' },
});