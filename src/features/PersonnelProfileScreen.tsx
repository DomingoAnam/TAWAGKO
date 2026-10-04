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
import { COLORS, SPACING, TYPOGRAPHY } from '../theme';
import { getCurrentUser, clearCurrentUser, setPersonnelSession } from '../services/storage';
import { updatePersonnelProfile, changePersonnelPassword } from '../services/supabaseStorage';
import { SelectField, POSITION_OPTIONS } from '../components/SelectField';

type Sheet = 'edit' | 'password' | null;

export default function PersonnelProfileScreen({ navigation }: any) {
  const [user, setUser] = useState<any>(null);
  const [sheet, setSheet] = useState<Sheet>(null);
  const [loading, setLoading] = useState(false);

  const [fullName, setFullName] = useState('');
  const [position, setPosition] = useState('');
  const [department, setDepartment] = useState('');
  const [phone, setPhone] = useState('');
  const [facebookUrl, setFacebookUrl] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');

  const load = useCallback(async () => {
    const u = await getCurrentUser();
    setUser(u);
    setFullName(u?.fullName ?? '');
    setPosition(u?.position ?? '');
    setDepartment(u?.department ?? '');
    setPhone(u?.phone ?? '');
    setFacebookUrl(u?.facebook_url ?? '');
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const closeSheet = () => {
    setSheet(null);
    setConfirmPassword('');
    setOldPassword('');
    setNewPassword('');
  };

  const handleSaveProfile = async () => {
    if (!fullName.trim()) {
      Alert.alert('Missing name', 'Full name cannot be empty.');
      return;
    }
    if (!confirmPassword) {
      Alert.alert('Confirm your identity', 'Enter your password to save changes.');
      return;
    }
    if (facebookUrl.trim() && !/^[a-z][a-z0-9+.-]*:\/\//i.test(facebookUrl.trim())) {
      // Preview what the database will store, so `fb.com/x` becomes a real link.
      setFacebookUrl(`https://${facebookUrl.trim()}`);
    }

    setLoading(true);
    try {
      const updated = await updatePersonnelProfile({
        username: user.username,
        password: confirmPassword,
        fullName,
        position,
        department,
        phone,
        facebookUrl,
      });
      await setPersonnelSession({
        id: updated.id ?? user.id,
        role: 'personnel',
        fullName: updated.full_name,
        username: updated.username,
        position: updated.position,
        department: updated.department,
        phone: updated.phone,
        facebook_url: updated.facebook_url,
      });
      await load();
      closeSheet();
      Alert.alert('Profile updated', 'Your changes have been saved.');
    } catch (error: any) {
      Alert.alert('Could not save', error?.message ?? 'Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async () => {
    if (!oldPassword || !newPassword) {
      Alert.alert('Missing fields', 'Enter your current and new password.');
      return;
    }
    if (newPassword.length < 8) {
      Alert.alert('Weak password', 'New password must be at least 8 characters.');
      return;
    }

    setLoading(true);
    try {
      const ok = await changePersonnelPassword(user.username, oldPassword, newPassword);
      if (!ok) {
        Alert.alert('Failed', 'Your current password is incorrect.');
        return;
      }
      closeSheet();
      Alert.alert('Password changed', 'Use your new password the next time you sign in.');
    } catch (error: any) {
      Alert.alert('Could not change password', error?.message ?? 'Please try again.');
    } finally {
      setLoading(false);
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

  const rows: { label: string; icon: any; onPress: () => void }[] = [
    { label: 'Edit Profile', icon: 'create-outline', onPress: () => setSheet('edit') },
    { label: 'Change Password', icon: 'key-outline', onPress: () => setSheet('password') },
  ];

  const field = (
    label: string,
    value: string,
    onChange: (v: string) => void,
    secure = false,
    placeholder?: string
  ) => (
    <>
      <Text style={styles.modalLabel}>{label}</Text>
      <TextInput
        style={styles.modalInput}
        value={value}
        onChangeText={onChange}
        secureTextEntry={secure}
        placeholder={placeholder}
        placeholderTextColor={COLORS.textHint}
        autoCapitalize="none"
        autoCorrect={false}
      />
    </>
  );

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {user?.fullName ? user.fullName.charAt(0).toUpperCase() : '?'}
          </Text>
        </View>
        <Text style={styles.name}>{user?.fullName}</Text>
        {user?.position ? <Text style={styles.position}>{user.position}</Text> : null}

        <View style={styles.badge}>
          <Ionicons name="shield-checkmark" size={14} color={COLORS.primary} />
          <Text style={styles.badgeText}>Verified Personnel</Text>
        </View>
      </View>

      <View style={styles.infoBox}>
        <View style={styles.infoRow}>
          <Ionicons name="at-outline" size={16} color={COLORS.textSecondary} />
          <Text style={styles.infoText}>{user?.username}</Text>
        </View>
        <View style={styles.infoRow}>
          <Ionicons name="briefcase-outline" size={16} color={COLORS.textSecondary} />
          <Text style={styles.infoText}>{user?.position || 'No position set'}</Text>
        </View>
        {user?.department ? (
          <View style={styles.infoRow}>
            <Ionicons name="business-outline" size={16} color={COLORS.textSecondary} />
            <Text style={styles.infoText}>{user.department}</Text>
          </View>
        ) : null}
        <View style={styles.infoRow}>
          <Ionicons
            name={user?.phone ? 'call' : 'call-outline'}
            size={16}
            color={user?.phone ? COLORS.textSecondary : COLORS.textHint}
          />
          <Text style={[styles.infoText, !user?.phone && styles.infoMissing]}>
            {user?.phone || 'No phone number — add one so residents can call you'}
          </Text>
        </View>
        <View style={styles.infoRow}>
          <Ionicons name="logo-facebook" size={16} color={COLORS.textSecondary} />
          <Text
            style={[styles.infoText, !user?.facebook_url && styles.infoMissing]}
            numberOfLines={1}
          >
            {user?.facebook_url || 'No Facebook page — add one below'}
          </Text>
        </View>
      </View>

      <Text style={styles.sectionTitle}>Account</Text>
      <View style={styles.list}>
        {rows.map((r) => (
          <TouchableOpacity
            key={r.label}
            style={styles.row}
            onPress={r.onPress}
            activeOpacity={0.9}
            accessibilityRole="button"
          >
            <View style={styles.rowIcon}>
              <Ionicons name={r.icon} size={19} color={COLORS.primary} />
            </View>
            <Text style={styles.rowLabel}>{r.label}</Text>
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

      <Modal visible={sheet !== null} animationType="slide" transparent onRequestClose={closeSheet}>
        <View style={styles.backdrop}>
          <View style={styles.sheet}>
            <View style={styles.sheetHandle} />
            <Text style={styles.sheetTitle}>
              {sheet === 'edit' ? 'Edit Profile' : 'Change Password'}
            </Text>

            {sheet === 'edit' ? (
              <>
                {field('Full Name', fullName, setFullName, false, 'Juan Dela Cruz')}
                <SelectField
                  label="Position"
                  value={position}
                  options={POSITION_OPTIONS}
                  onChange={setPosition}
                  placeholder="Select your position"
                />
                {field('Department', department, setDepartment, false, 'Office of the Captain')}
                {field('Phone Number', phone, setPhone, false, '0917 123 4567')}
                {field('Facebook Page URL', facebookUrl, setFacebookUrl, false, 'facebook.com/christianbedro')}
                {field('Confirm Password', confirmPassword, setConfirmPassword, true, 'Your current password')}
                <View style={styles.modalHint}>
                  <Ionicons name="information-circle-outline" size={13} color={COLORS.textHint} />
                  <Text style={styles.modalHintText}>
                    Your phone number and Facebook page appear on the resident-facing
                    Officials page with Call and Visit Facebook buttons.
                  </Text>
                </View>
              </>
            ) : (
              <>
                {field('Current Password', oldPassword, setOldPassword, true)}
                {field('New Password', newPassword, setNewPassword, true, 'At least 8 characters')}
              </>
            )}

            <TouchableOpacity
              style={styles.saveBtn}
              onPress={sheet === 'edit' ? handleSaveProfile : handleChangePassword}
              disabled={loading}
              activeOpacity={0.9}
            >
              {loading ? (
                <ActivityIndicator color={COLORS.onBrand} />
              ) : (
                <Text style={styles.saveBtnText}>SAVE CHANGES</Text>
              )}
            </TouchableOpacity>
            <TouchableOpacity style={styles.cancelBtn} onPress={closeSheet} disabled={loading}>
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
  header: { alignItems: 'center', paddingVertical: SPACING.lg },
  avatar: {
    width: 84,
    height: 84,
    borderRadius: 26,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.md,
  },
  avatarText: { fontSize: 34, fontWeight: '800', color: COLORS.primary },
  name: { ...TYPOGRAPHY.h3, color: COLORS.textPrimary },
  position: { ...TYPOGRAPHY.caption, color: COLORS.textSecondary, marginTop: 2 },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: COLORS.primaryLight,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginTop: SPACING.md,
  },
  badgeText: { ...TYPOGRAPHY.smallBold, color: COLORS.primary },
  infoBox: {
    backgroundColor: COLORS.surface,
    borderRadius: 18,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: SPACING.sm,
  },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm },
  infoText: { ...TYPOGRAPHY.caption, color: COLORS.textPrimary, flex: 1 },
  infoMissing: { color: COLORS.textHint },
  sectionTitle: { ...TYPOGRAPHY.h4, color: COLORS.textPrimary, marginTop: SPACING.lg, marginBottom: SPACING.md },
  list: { gap: SPACING.sm },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  rowIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md,
  },
  rowLabel: { flex: 1, ...TYPOGRAPHY.bodyLarge, fontWeight: '600', color: COLORS.textPrimary },
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
  },
  sheetHandle: {
    width: 44,
    height: 4,
    borderRadius: 2,
    backgroundColor: COLORS.border,
    alignSelf: 'center',
    marginBottom: SPACING.lg,
  },
  sheetTitle: { ...TYPOGRAPHY.h3, color: COLORS.textPrimary, marginBottom: SPACING.lg },
  modalLabel: { ...TYPOGRAPHY.smallBold, color: COLORS.textSecondary, marginBottom: 6 },
  modalInput: {
    backgroundColor: COLORS.surfaceAlt,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: SPACING.md,
    paddingVertical: 13,
    fontSize: 15,
    color: COLORS.textPrimary,
    marginBottom: SPACING.md,
  },
  modalHint: {
    flexDirection: 'row',
    gap: 6,
    backgroundColor: COLORS.surfaceAlt,
    borderRadius: 12,
    padding: SPACING.sm,
    marginBottom: SPACING.sm,
  },
  modalHintText: { flex: 1, ...TYPOGRAPHY.small, color: COLORS.textSecondary, lineHeight: 16 },
  saveBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: SPACING.sm,
  },
  saveBtnText: { ...TYPOGRAPHY.button, color: COLORS.onBrand },
  cancelBtn: { alignSelf: 'center', marginTop: SPACING.md },
  cancelText: { ...TYPOGRAPHY.caption, color: COLORS.textSecondary, fontWeight: '600' },
});