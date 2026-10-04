import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  StyleSheet,
  Alert,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, SHADOWS, TYPOGRAPHY } from '../theme';
import { AppLogo } from '../components/AppLogo';
import { SelectField, POSITION_OPTIONS } from '../components/SelectField';
import { createPersonnelAccount } from '../services/supabaseStorage';

type FieldKey = 'fullName' | 'username' | 'password' | 'confirmPassword';

export default function PersonnelRegisterScreen({ navigation }: any) {
  const [form, setForm] = useState({
    fullName: '',
    username: '',
    password: '',
    confirmPassword: '',
    position: '',
  });
  const [visible, setVisible] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(false);

  const update = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));
  const toggle = (k: string) => setVisible((v) => ({ ...v, [k]: !v[k] }));

  const handleRegister = async () => {
    const { fullName, username, password, confirmPassword, position } = form;

    if (!fullName.trim() || !username.trim() || !password) {
      Alert.alert('Missing fields', 'Please complete the required fields.');
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert('Password mismatch', 'Passwords do not match.');
      return;
    }
    if (password.length < 8) {
      Alert.alert('Weak password', 'Password must be at least 8 characters.');
      return;
    }

    setLoading(true);
    try {
      await createPersonnelAccount({
        username,
        password,
        fullName,
        position,
      });

      // Access is withheld until the token is presented on the next screen.
      navigation.replace('PersonnelToken', { username, password, firstName: fullName.split(' ')[0] });
    } catch (error: any) {
      Alert.alert('Could not create account', error?.message ?? 'Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const fields: {
    label: string;
    k: FieldKey;
    placeholder: string;
    icon: any;
    secure?: boolean;
    required?: boolean;
  }[] = [
    { label: 'Full Name', k: 'fullName', placeholder: 'Juan Dela Cruz', icon: 'person-outline', required: true },
    { label: 'Username / Email', k: 'username', placeholder: 'official@barangay.ph', icon: 'at-outline', required: true },
    { label: 'Password', k: 'password', placeholder: 'At least 8 characters', icon: 'lock-closed-outline', secure: true, required: true },
    { label: 'Confirm Password', k: 'confirmPassword', placeholder: 'Repeat password', icon: 'shield-checkmark-outline', secure: true, required: true },
  ];

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
    >
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          style={styles.backBtn}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <Ionicons name="arrow-back" size={18} color={COLORS.primary} />
        </TouchableOpacity>
        <AppLogo size={64} showWordmark={false} />
        <Text style={styles.title}>Personnel Account</Text>
        <Text style={styles.subtitle}>Create your official account to continue</Text>
      </View>

      <View style={styles.card}>
        <View style={styles.cardGroup}>
          <SelectField
            label="Position"
            value={form.position}
            options={POSITION_OPTIONS}
            onChange={(v) => update('position', v)}
            placeholder="Select your position"
          />
        </View>

        {fields.map((f) => (
          <View key={f.k} style={styles.fieldGroup}>
            <Text style={styles.label}>
              {f.label}
              {f.required ? '' : '  (optional)'}
            </Text>
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
                autoCapitalize="none"
                autoCorrect={false}
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

      <View style={styles.notice}>
        <Ionicons name="key-outline" size={17} color={COLORS.accentDark} />
        <Text style={styles.noticeText}>
          After creating your account you will be asked for the official personnel
          token to unlock the dashboard.
        </Text>
      </View>

      <TouchableOpacity
        style={styles.primaryBtn}
        onPress={handleRegister}
        disabled={loading}
        activeOpacity={0.9}
      >
        {loading ? (
          <ActivityIndicator color={COLORS.onBrand} />
        ) : (
          <Text style={styles.primaryBtnText}>CREATE ACCOUNT</Text>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: SPACING.xl, paddingBottom: SPACING.xxl },
  header: { alignItems: 'center', marginBottom: SPACING.lg },
  backBtn: { alignSelf: 'flex-start', marginBottom: SPACING.md },
  title: { marginTop: SPACING.md, fontSize: 23, fontWeight: '800', color: COLORS.textPrimary },
  subtitle: { marginTop: 4, fontSize: 13, color: COLORS.textSecondary, textAlign: 'center' },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: 20,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.sm,
  },
  cardGroup: { marginBottom: SPACING.sm },
  fieldGroup: { marginBottom: SPACING.md },
  label: { ...TYPOGRAPHY.smallBold, color: COLORS.textSecondary, marginBottom: 6 },
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
  input: { flex: 1, paddingVertical: 13, fontSize: 15, color: COLORS.textPrimary },
  eyeButton: { paddingLeft: SPACING.sm },
  notice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    backgroundColor: COLORS.accentLight,
    borderRadius: 14,
    padding: SPACING.md,
    marginTop: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.accent,
  },
  noticeText: { flex: 1, fontSize: 12, color: COLORS.accentDark, lineHeight: 17, fontWeight: '600' },
  primaryBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: 16,
    paddingVertical: 17,
    alignItems: 'center',
    marginTop: SPACING.lg,
    ...SHADOWS.md,
  },
  primaryBtnText: { color: COLORS.onBrand, fontSize: 15, fontWeight: '800', letterSpacing: 0.4 },
});