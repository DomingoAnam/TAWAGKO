import React, { useState } from 'react';
import { View, Text, Modal, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, TYPOGRAPHY, SHADOWS } from '../theme';

type Props = {
  visible: boolean;
  title: string;
  message?: string;
  confirmLabel?: string;
  onCancel: () => void;
  /** Resolve to throw/reject to keep the prompt open on failure. */
  onSubmit: (password: string) => Promise<void>;
};

/**
 * Cross-platform replacement for `Alert.prompt`, which only exists on iOS.
 * Personnel writes are authorized by re-entering the account password, and the
 * server re-verifies it, so the password is never stored.
 */
export function PasswordPromptModal({
  visible,
  title,
  message,
  confirmLabel = 'CONFIRM',
  onCancel,
  onSubmit,
}: Props) {
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reset when the modal opens. Done during render rather than in an effect so
  // the first frame is already clean and no cascading render is triggered.
  const [wasVisible, setWasVisible] = useState(visible);
  if (visible !== wasVisible) {
    setWasVisible(visible);
    if (visible) {
      setPassword('');
      setError(null);
      setBusy(false);
    }
  }

  const submit = async () => {
    if (!password) {
      setError('Enter your password.');
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await onSubmit(password);
      setPassword('');
    } catch (e: any) {
      setError(e?.message ?? 'Could not verify your password.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={busy ? undefined : onCancel}>
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <View style={styles.iconWrap}>
            <Ionicons name="lock-closed" size={22} color={COLORS.primary} />
          </View>

          <Text style={styles.title}>{title}</Text>
          {message ? <Text style={styles.message}>{message}</Text> : null}

          <TextInput
            style={[styles.input, error && styles.inputError]}
            value={password}
            onChangeText={(t) => {
              setPassword(t);
              if (error) setError(null);
            }}
            placeholder="Personnel password"
            placeholderTextColor={COLORS.textHint}
            secureTextEntry
            autoCapitalize="none"
            autoCorrect={false}
            autoFocus
            onSubmitEditing={submit}
            editable={!busy}
          />

          {error ? (
            <Text style={styles.error}>
              <Ionicons name="alert-circle" size={13} color={COLORS.accentDark} />
              {'  '}
              {error}
            </Text>
          ) : null}

          <TouchableOpacity style={styles.confirmBtn} onPress={submit} disabled={busy} activeOpacity={0.9}>
            {busy ? (
              <ActivityIndicator color={COLORS.onBrand} />
            ) : (
              <Text style={styles.confirmText}>{confirmLabel}</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity style={styles.cancelBtn} onPress={onCancel} disabled={busy}>
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(15,17,34,0.55)',
    justifyContent: 'center',
    padding: SPACING.xl,
  },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: 22,
    padding: SPACING.lg,
    ...SHADOWS.lg,
  },
  iconWrap: { alignSelf: 'center', marginBottom: SPACING.sm },
  title: { ...TYPOGRAPHY.h4, color: COLORS.textPrimary, textAlign: 'center' },
  message: { ...TYPOGRAPHY.small, color: COLORS.textSecondary, textAlign: 'center', marginTop: 6 },
  input: {
    backgroundColor: COLORS.surfaceAlt,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: SPACING.md,
    paddingVertical: 13,
    fontSize: 15,
    color: COLORS.textPrimary,
    marginTop: SPACING.lg,
  },
  inputError: { borderColor: COLORS.accent },
  error: { ...TYPOGRAPHY.small, color: COLORS.accentDark, marginTop: 6, fontWeight: '600' },
  confirmBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: SPACING.md,
  },
  confirmText: { ...TYPOGRAPHY.button, color: COLORS.onBrand },
  cancelBtn: { alignSelf: 'center', marginTop: SPACING.md },
  cancelText: { ...TYPOGRAPHY.caption, color: COLORS.textSecondary, fontWeight: '600' },
});