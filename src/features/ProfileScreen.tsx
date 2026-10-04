import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Modal,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, SHADOWS, TYPOGRAPHY, BORDER_RADIUS } from '../theme';
import { ProfileHeader } from '../components/ProfileHeader';
import { getCurrentUser, clearCurrentUser } from '../services/storage';
import { updateMyResidentProfile, changeResidentPassword } from '../services/supabaseStorage';

type IconName = React.ComponentProps<typeof Ionicons>['name'];

export default function ProfileScreen({ navigation }: any) {
  const [user, setUser] = useState<any>(null);
  const [sheet, setSheet] = useState(false);
  const [busy, setBusy] = useState(false);

  const [phone, setPhone] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [visible, setVisible] = useState(false);

  const load = useCallback(async () => {
    const u = await getCurrentUser();
    setUser(u);
    setPhone(u?.contactNumber ?? '');
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const openSheet = () => {
    setPhone(user?.contactNumber ?? '');
    setCurrentPassword('');
    setNewPassword('');
    setVisible(false);
    setSheet(true);
  };

  const closeSheet = () => {
    setSheet(false);
    setCurrentPassword('');
    setNewPassword('');
  };

  /**
   * The current password is always required: it both authorises the phone change
   * and is what Supabase Auth re-checks before a password change.
   */
  const save = async () => {
    const wantsPhone = phone.trim() !== (user?.contactNumber ?? '');
    const wantsPassword = newPassword.length > 0;

    if (!wantsPhone && !wantsPassword) {
      Alert.alert('Nothing to save', 'Change your phone number or enter a new password.');
      return;
    }
    if (!currentPassword) {
      Alert.alert('Confirm your password', 'Enter your current password to save changes.');
      return;
    }
    if (wantsPassword && newPassword.length < 8) {
      Alert.alert('Weak password', 'New password must be at least 8 characters.');
      return;
    }

    setBusy(true);
    try {
      // Verify the current password first. Supabase Auth owns the resident
      // credential, so this is the only proof of identity available.
      if (wantsPassword) {
        await changeResidentPassword(currentPassword, newPassword);
      } else {
        await updateMyResidentProfile({ phone });
      }

      await load();
      closeSheet();
      Alert.alert(
        'Saved',
        wantsPassword
          ? 'Your password has been changed. Use it the next time you sign in.'
          : 'Your phone number has been updated.'
      );
    } catch (error: any) {
      Alert.alert('Could not save', error?.message ?? 'Please try again.');
    } finally {
      setBusy(false);
    }
  };

  const handleLogout = () => {
    Alert.alert('Log out', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Log out',
        style: 'destructive',
        onPress: async () => {
          await clearCurrentUser();
          navigation.replace('RoleSelection');
        },
      },
    ]);
  };

  const status = user?.verificationStatus;
  const verificationLabel =
    status === 'VERIFIED'
      ? 'Verification Confirmed'
      : status === 'REJECTED'
        ? 'Resubmit Verification'
        : status === 'NEEDS_CORRECTION'
          ? 'Resubmit Verification'
          : 'Verify Your Residency';

  const verificationHint =
    status === 'VERIFIED'
      ? 'Your residency has been confirmed by the barangay.'
      : status === 'REJECTED'
        ? 'Your verification was rejected. Please submit a new document.'
        : status === 'NEEDS_CORRECTION'
          ? 'Personnel asked for a clearer document. Please submit again.'
          : 'Submit a valid ID or proof of residency to get verified.';

  const actions: {
    key: string;
    label: string;
    icon: IconName;
    onPress: () => void;
    needsAction?: boolean;
  }[] = [
    { key: 'edit', label: 'Edit Profile', icon: 'create-outline', onPress: openSheet },
    {
      key: 'verify',
      label: verificationLabel,
      icon: status === 'VERIFIED' ? 'shield-checkmark' : 'shield-checkmark-outline',
      onPress: () => navigation.navigate('ResidentVerification'),
      // Red dot marks verification that still needs the resident's attention.
      needsAction: status !== 'VERIFIED',
    },
  ];

  const field = (
    label: string,
    value: string,
    onChange: (v: string) => void,
    placeholder: string,
    options: { secure?: boolean; keyboardType?: any; right?: React.ReactNode } = {}
  ) => (
    <>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.field}>
        <TextInput
          style={styles.input}
          value={value}
          onChangeText={onChange}
          placeholder={placeholder}
          placeholderTextColor={COLORS.textHint}
          secureTextEntry={options.secure}
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType={options.keyboardType}
        />
        {options.right}
      </View>
    </>
  );

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <ProfileHeader user={user} />

      <View style={styles.infoBox}>
        <Text style={styles.infoRow}>
          <Text style={styles.infoLabel}>Full Name: </Text>
          {user?.fullName}
        </Text>
        <Text style={styles.infoRow}>
          <Text style={styles.infoLabel}>Address: </Text>
          {user?.address || 'Not set'}
        </Text>
        <Text style={[styles.infoRow, !user?.contactNumber && styles.infoLast]}>
          <Text style={styles.infoLabel}>Contact: </Text>
          {user?.contactNumber || 'Not set'}
        </Text>
        <Text style={[styles.infoRow, !user?.contactNumber && styles.infoLast]}>
          <Text style={styles.infoLabel}>Username: </Text>
          {user?.username}
        </Text>
      </View>

      {status !== 'VERIFIED' ? (
        <View style={[styles.hint, status === 'REJECTED' && styles.hintReject]}>
          <Ionicons
            name={status === 'REJECTED' ? 'close-circle' : 'information-circle'}
            size={16}
            color={status === 'REJECTED' ? COLORS.accentDark : COLORS.textSecondary}
          />
          <Text
            style={[
              styles.hintText,
              status === 'REJECTED' && styles.hintTextReject,
            ]}
          >
            {verificationHint}
          </Text>
        </View>
      ) : null}

      <View style={styles.actions}>
        {actions.map((a) => (
          <TouchableOpacity
            key={a.key}
            style={styles.actionRow}
            onPress={a.onPress}
            activeOpacity={0.9}
            accessibilityRole="button"
          >
            <View style={styles.actionIcon}>
              <Ionicons name={a.icon} size={19} color={COLORS.primary} />
            </View>
            <Text style={styles.actionLabel}>{a.label}</Text>
            {a.needsAction ? <View style={styles.actionDot} /> : null}
            <Ionicons name="chevron-forward" size={18} color={COLORS.textHint} />
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.divider} />

      <TouchableOpacity
        style={styles.logoutBtn}
        onPress={handleLogout}
        activeOpacity={0.9}
        accessibilityRole="button"
      >
        <Ionicons name="log-out-outline" size={19} color={COLORS.accentDark} />
        <Text style={styles.logoutText}>LOG OUT</Text>
      </TouchableOpacity>

      <Modal visible={sheet} transparent animationType="slide" onRequestClose={closeSheet}>
        <View style={styles.backdrop}>
          <View style={styles.sheet}>
            <View style={styles.handle} />
            <Text style={styles.sheetTitle}>Edit Profile</Text>

            {field('Phone Number', phone, setPhone, '0917 123 4567', {
              keyboardType: 'phone-pad',
            })}

            {field('New Password', newPassword, setNewPassword, 'Leave blank to keep current', {
              secure: !visible,
              right: (
                <TouchableOpacity
                  onPress={() => setVisible((v) => !v)}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  accessibilityRole="button"
                  accessibilityLabel={visible ? 'Hide password' : 'Show password'}
                >
                  <Ionicons
                    name={visible ? 'eye-off-outline' : 'eye-outline'}
                    size={20}
                    color={visible ? COLORS.primary : COLORS.textHint}
                  />
                </TouchableOpacity>
              ),
            })}

            {field('Current Password', currentPassword, setCurrentPassword, 'Required to save', {
              secure: true,
            })}

            <View style={styles.note}>
              <Ionicons name="lock-closed-outline" size={14} color={COLORS.textHint} />
              <Text style={styles.noteText}>
                Your current password is required for both changes. Name, address and
                verification are managed by barangay personnel.
              </Text>
            </View>

            <TouchableOpacity style={styles.saveBtn} onPress={save} disabled={busy} activeOpacity={0.9}>
              {busy ? (
                <ActivityIndicator color={COLORS.onBrand} />
              ) : (
                <Text style={styles.saveText}>SAVE CHANGES</Text>
              )}
            </TouchableOpacity>
            <TouchableOpacity style={styles.cancelBtn} onPress={closeSheet} disabled={busy}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: SPACING.xl, paddingBottom: SPACING.xxl },
  infoBox: {
    backgroundColor: COLORS.surface,
    borderRadius: 18,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  infoRow: { ...TYPOGRAPHY.caption, color: COLORS.textPrimary, marginBottom: 8 },
  infoLast: { marginBottom: 0 },
  infoLabel: { fontWeight: '700', color: COLORS.textSecondary },
  hint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    backgroundColor: COLORS.surfaceAlt,
    borderRadius: 14,
    padding: SPACING.md,
    marginTop: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  hintReject: { backgroundColor: COLORS.accentLight, borderColor: COLORS.accent },
  hintText: { flex: 1, ...TYPOGRAPHY.small, color: COLORS.textSecondary, lineHeight: 17 },
  hintTextReject: { color: COLORS.accentDark, fontWeight: '600' },
  actions: { marginTop: SPACING.lg, gap: SPACING.sm },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  actionIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md,
  },
  actionLabel: { flex: 1, ...TYPOGRAPHY.bodyLarge, fontWeight: '600', color: COLORS.textPrimary },
  actionDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: COLORS.accentRed,
    marginRight: SPACING.sm,
  },
  divider: { height: 1, backgroundColor: COLORS.border, marginVertical: SPACING.xl },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    backgroundColor: COLORS.accentLight,
    borderRadius: 16,
    paddingVertical: 16,
    borderWidth: 1,
    borderColor: COLORS.accent,
  },
  logoutText: { ...TYPOGRAPHY.button, color: COLORS.accentDark },
  backdrop: { flex: 1, backgroundColor: 'rgba(15,17,34,0.55)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    padding: SPACING.xl,
    paddingBottom: SPACING.xxl,
    ...SHADOWS.lg,
  },
  handle: {
    width: 44,
    height: 4,
    borderRadius: 2,
    backgroundColor: COLORS.border,
    alignSelf: 'center',
    marginBottom: SPACING.lg,
  },
  sheetTitle: { ...TYPOGRAPHY.h3, color: COLORS.textPrimary, marginBottom: SPACING.lg },
  label: { ...TYPOGRAPHY.smallBold, color: COLORS.textSecondary, marginBottom: 6 },
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surfaceAlt,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: SPACING.md,
    marginBottom: SPACING.md,
  },
  input: { flex: 1, paddingVertical: 13, fontSize: 15, color: COLORS.textPrimary },
  note: {
    flexDirection: 'row',
    gap: 7,
    backgroundColor: COLORS.surfaceAlt,
    borderRadius: 12,
    padding: SPACING.sm,
    marginBottom: SPACING.sm,
  },
  noteText: { flex: 1, ...TYPOGRAPHY.small, color: COLORS.textSecondary, lineHeight: 16 },
  saveBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: SPACING.sm,
  },
  saveText: { ...TYPOGRAPHY.button, color: COLORS.onBrand },
  cancelBtn: { alignSelf: 'center', marginTop: SPACING.md },
  cancelText: { ...TYPOGRAPHY.caption, color: COLORS.textSecondary, fontWeight: '600' },
});