import React, { useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, ScrollView, ActivityIndicator } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, TYPOGRAPHY } from '../theme';
import { StatusBadge } from '../components/ReusableComponents';
import { submitVerification } from '../services/supabaseStorage';
import { getCurrentUser } from '../services/storage';

export default function ResidentVerificationScreen({ navigation }: any) {
  const [docUri, setDocUri] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      getCurrentUser()
        .then((u) => setStatus(u?.verificationStatus ?? null))
        .catch(() => setStatus(null));
    }, [])
  );

  const pickImage = async (useCamera: boolean) => {
    try {
      const result = useCamera
        ? await ImagePicker.launchCameraAsync({ quality: 0.7 })
        : await ImagePicker.launchImageLibraryAsync({ quality: 0.7 });
      if (!result.canceled && result.assets && result.assets[0]) {
        setDocUri(result.assets[0].uri);
      }
    } catch {
      Alert.alert('Error', 'Could not access the image picker.');
    }
  };

  const handleSubmit = async () => {
    if (!docUri) {
      Alert.alert('No document', 'Please take or select a proof of residency first.');
      return;
    }
    setBusy(true);
    try {
      await submitVerification(docUri);
      setSubmitted(true);
      Alert.alert('Submitted', 'Your verification document has been submitted for review.');
    } catch (error: any) {
      Alert.alert('Could not submit', error?.message ?? 'Please try again.');
    } finally {
      setBusy(false);
    }
  };

  const current = submitted ? 'PENDING_VERIFICATION' : status;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Verify Your Residency</Text>
      <Text style={styles.desc}>
        To help verify that you are a resident of the barangay, submit a valid ID or accepted proof of residency.
      </Text>

      {current === 'VERIFIED' ? (
        <View style={[styles.notice, styles.noticeOk]}>
          <Ionicons name="checkmark-circle" size={20} color={COLORS.primary} />
          <Text style={styles.noticeTextOk}>
            Your verification is confirmed. You no longer need to submit a document.
          </Text>
        </View>
      ) : current === 'REJECTED' ? (
        <View style={[styles.notice, styles.noticeReject]}>
          <Ionicons name="close-circle" size={20} color={COLORS.accentDark} />
          <Text style={styles.noticeTextReject}>
            Your verification was rejected. Select a new document below and submit again.
          </Text>
        </View>
      ) : (
        <StatusBadge
          status={current ?? 'PENDING_VERIFICATION'}
          label={
            current === 'NEEDS_CORRECTION'
              ? 'NEEDS CORRECTION'
              : submitted || current === 'PENDING_VERIFICATION'
                ? 'PENDING VERIFICATION'
                : 'NOT SUBMITTED'
          }
        />
      )}

      <View style={styles.actions}>
        <TouchableOpacity style={styles.pickBtn} onPress={() => pickImage(true)}>
          <Ionicons name="camera" size={30} color={COLORS.primary} style={styles.pickIcon} />
          <Text style={styles.pickText}>Take Photo</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.pickBtn} onPress={() => pickImage(false)}>
          <Ionicons name="images" size={30} color={COLORS.primary} style={styles.pickIcon} />
          <Text style={styles.pickText}>Choose Image</Text>
        </TouchableOpacity>
      </View>

      {docUri && (
        <View style={styles.docRow}>
          <Ionicons name="checkmark-circle" size={15} color={COLORS.primary} />
          <Text style={styles.docText}>Document selected</Text>
        </View>
      )}

      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.submitBtn}
          onPress={handleSubmit}
          disabled={busy}
          activeOpacity={0.9}
          accessibilityRole="button"
        >
          {busy ? (
            <ActivityIndicator color={COLORS.onBrand} />
          ) : (
            <Text style={styles.submitText}>SUBMIT PROOF</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation.goBack()}
          disabled={busy}
          activeOpacity={0.9}
          accessibilityRole="button"
        >
          <Text style={styles.backText}>BACK</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: SPACING.xl, flexGrow: 1, justifyContent: 'center' },
  title: { ...TYPOGRAPHY.h2, color: COLORS.textPrimary, textAlign: 'center' },
  desc: {
    ...TYPOGRAPHY.body,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: SPACING.sm,
    marginBottom: SPACING.lg,
    lineHeight: 21,
  },
  notice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    borderRadius: 14,
    padding: SPACING.md,
    borderWidth: 1,
  },
  noticeOk: { backgroundColor: COLORS.primaryLight, borderColor: COLORS.primary },
  noticeTextOk: { flex: 1, ...TYPOGRAPHY.small, color: COLORS.primary, fontWeight: '600', lineHeight: 18 },
  noticeReject: { backgroundColor: COLORS.accentLight, borderColor: COLORS.accent },
  noticeTextReject: { flex: 1, ...TYPOGRAPHY.small, color: COLORS.accentDark, fontWeight: '600', lineHeight: 18 },
  actions: { flexDirection: 'row', justifyContent: 'space-around', marginVertical: SPACING.xl },
  pickBtn: {
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: 18,
    padding: SPACING.lg,
    width: '45%',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  pickIcon: { marginBottom: SPACING.sm },
  pickText: { ...TYPOGRAPHY.bodyLarge, fontWeight: '600', color: COLORS.textPrimary },
  docRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginBottom: SPACING.sm,
  },
  docText: { ...TYPOGRAPHY.smallBold, color: COLORS.primary },
  footer: { marginTop: SPACING.xl },
  submitBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: 16,
    paddingVertical: 17,
    alignItems: 'center',
  },
  submitText: { ...TYPOGRAPHY.button, color: COLORS.onBrand },
  backBtn: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    paddingVertical: 17,
    alignItems: 'center',
    marginTop: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  backText: { ...TYPOGRAPHY.button, color: COLORS.primary },
});
