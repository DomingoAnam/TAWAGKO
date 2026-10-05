import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  Image,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  Alert,
  Modal,
  ActivityIndicator,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, TYPOGRAPHY, SHADOWS, BORDER_RADIUS } from '../theme';
import { getEmergencyContacts, getCurrentUser } from '../services/storage';
import {
  upsertEmergencyContact,
  deleteEmergencyContact,
  requirePersonnelAuth,
} from '../services/supabaseStorage';
import { EmptyState } from '../components/ReusableComponents';
import { DirectoryCard } from '../components/DirectoryCard';
import { pickImageAsDataUri } from '../services/imagePicker';

const AVAILABILITY = ['Available', 'Unavailable'];

const blank = () => ({
  serviceName: '',
  description: '',
  contactNumber: '',
  availability: 'Available',
  photoUri: null as string | null,
  address: '',
  postalCode: '',
});

export default function ManageContactsScreen() {
  const [items, setItems] = useState<any[]>([]);
  const [username, setUsername] = useState('');
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState(blank);
  const [saving, setSaving] = useState(false);

  const choosePhoto = async () => {
    const uri = await pickImageAsDataUri();
    if (uri) setForm((f) => ({ ...f, photoUri: uri }));
  };

  const load = useCallback(async () => {
    try {
      const me = await getCurrentUser();
      setUsername(me?.username ?? '');
      setItems((await getEmergencyContacts()) || []);
    } catch (error: any) {
      Alert.alert('Could not load', error?.message ?? 'Check your connection.');
    }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const openAdd = () => {
    setEditing(null);
    setForm(blank());
    setOpen(true);
  };

  const openEdit = (item: any) => {
    setEditing(item);
    setForm({
      serviceName: item.serviceName ?? '',
      description: item.description ?? '',
      contactNumber: item.contactNumber ?? '',
      availability: item.availability ?? 'Available',
      photoUri: item.photoUri ?? null,
      address: item.address ?? '',
      postalCode: item.postalCode ?? '',
    });
    setOpen(true);
  };

  const save = async () => {
    if (!form.serviceName.trim() || !form.contactNumber.trim()) {
      Alert.alert('Missing fields', 'Service name and contact number are required.');
      return;
    }
    setSaving(true);
    try {
      await upsertEmergencyContact(requirePersonnelAuth(username), {
        id: editing?.id ?? null,
        ...form,
      });
      setOpen(false);
      await load();
    } catch (error: any) {
      Alert.alert('Could not save', error?.message ?? 'Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const remove = (item: any) => {
    Alert.alert('Delete contact?', item.serviceName, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteEmergencyContact(requirePersonnelAuth(username), item.id);
            await load();
          } catch (error: any) {
            Alert.alert('Could not delete', error?.message ?? 'Please try again.');
          }
        },
      },
    ]);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Emergency Contacts</Text>
      <Text style={styles.subtitle}>
        Saved to the database and shown to residents immediately.
      </Text>

      <TouchableOpacity style={styles.addBtn} onPress={openAdd} activeOpacity={0.9}>
        <Ionicons name="add" size={19} color={COLORS.onBrand} />
        <Text style={styles.addText}>ADD CONTACT</Text>
      </TouchableOpacity>

      {items.length === 0 ? (
        <EmptyState title="No contacts yet" message="Add the emergency services residents can call." />
      ) : null}

      {items.map((item) => (
        <View key={item.id}>
          <DirectoryCard
            item={item}
            kind="contact"
            actions={
              <View style={styles.actionsRow}>
                <TouchableOpacity style={styles.manageBtn} onPress={() => openEdit(item)} activeOpacity={0.9}>
                  <Ionicons name="create-outline" size={17} color={COLORS.primary} />
                  <Text style={styles.manageBtnText}>EDIT</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.manageBtn, styles.manageBtnDanger]}
                  onPress={() => remove(item)}
                  activeOpacity={0.9}
                >
                  <Ionicons name="trash-outline" size={17} color={COLORS.accentDark} />
                  <Text style={[styles.manageBtnText, styles.manageBtnDangerText]}>DELETE</Text>
                </TouchableOpacity>
              </View>
            }
          />
        </View>
      ))}

      <Modal visible={open} animationType="slide" transparent>
        <View style={styles.backdrop}>
          <View style={styles.sheet}>
            <View style={styles.handle} />
            <Text style={styles.sheetTitle}>
              {editing ? 'Edit Contact' : 'Add Contact'}
            </Text>

            <Text style={styles.label}>Image</Text>
            {/* The holder itself is the button: tap to insert, tap again to change. */}
            <TouchableOpacity
              style={[styles.photoHolder, form.photoUri && styles.photoHolderFilled]}
              onPress={choosePhoto}
              activeOpacity={0.85}
              accessibilityRole="button"
              accessibilityLabel={
                form.photoUri ? 'Change image' : 'Insert image for this contact'
              }
            >
              {form.photoUri ? (
                <>
                  <Image source={{ uri: form.photoUri }} style={styles.photoPreview} />
                  <View style={styles.photoOverlay}>
                    <Ionicons name="swap-horizontal" size={15} color={COLORS.onBrand} />
                    <Text style={styles.photoOverlayText}>CHANGE</Text>
                  </View>
                </>
              ) : (
                <View style={styles.photoEmpty}>
                  <Ionicons name="add" size={30} color={COLORS.primary} />
                  <Text style={styles.photoEmptyText}>Insert Image</Text>
                </View>
              )}
            </TouchableOpacity>

            {form.photoUri ? (
              <TouchableOpacity
                onPress={() => setForm((f) => ({ ...f, photoUri: null }))}
                style={styles.photoRemoveBtn}
                activeOpacity={0.9}
              >
                <Ionicons name="trash-outline" size={15} color={COLORS.accentDark} />
                <Text style={styles.photoRemove}>Remove image</Text>
              </TouchableOpacity>
            ) : null}

            <Text style={styles.label}>Service Name</Text>
            <TextInput
              style={styles.input}
              value={form.serviceName}
              onChangeText={(v) => setForm({ ...form, serviceName: v })}
              placeholder="PNP"
            />
            <Text style={styles.label}>Description</Text>
            <TextInput
              style={styles.input}
              value={form.description}
              onChangeText={(v) => setForm({ ...form, description: v })}
              placeholder="Philippine National Police"
            />
            <Text style={styles.label}>Contact Number</Text>
            <TextInput
              style={styles.input}
              value={form.contactNumber}
              onChangeText={(v) => setForm({ ...form, contactNumber: v })}
              placeholder="911"
              keyboardType="phone-pad"
            />
            <Text style={styles.label}>Address/Location</Text>
            <TextInput
              style={styles.input}
              value={form.address}
              onChangeText={(v) => setForm({ ...form, address: v })}
              placeholder="PNP headquarters, your address"
            />
            <Text style={styles.label}>Postal Code</Text>
            <TextInput
              style={styles.input}
              value={form.postalCode}
              onChangeText={(v) => setForm({ ...form, postalCode: v })}
              placeholder="Postal code"
              keyboardType="number-pad"
            />
            <Text style={styles.label}>Availability</Text>
            <View style={styles.availRow}>
              {AVAILABILITY.map((a) => (
                <TouchableOpacity
                  key={a}
                  style={[styles.availPick, form.availability === a && styles.availPickOn]}
                  onPress={() => setForm({ ...form, availability: a })}
                >
                  <Text
                    style={[styles.availPickText, form.availability === a && styles.availPickTextOn]}
                  >
                    {a}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity style={styles.saveBtn} onPress={save} disabled={saving} activeOpacity={0.9}>
              {saving ? (
                <ActivityIndicator color={COLORS.onBrand} />
              ) : (
                <Text style={styles.saveText}>SAVE</Text>
              )}
            </TouchableOpacity>
            <TouchableOpacity style={styles.cancelBtn} onPress={() => setOpen(false)}>
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
  title: { ...TYPOGRAPHY.h2, color: COLORS.textPrimary },
  subtitle: { ...TYPOGRAPHY.caption, color: COLORS.textSecondary, marginTop: 4, marginBottom: SPACING.lg },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: COLORS.primary,
    borderRadius: 16,
    paddingVertical: 16,
    marginBottom: SPACING.lg,
  },
  addText: { ...TYPOGRAPHY.button, color: COLORS.onBrand },
  actionsRow: { flexDirection: 'row', gap: SPACING.sm, marginTop: SPACING.md },
  manageBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: COLORS.surface,
    borderRadius: 14,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  manageBtnText: { ...TYPOGRAPHY.smallBold, color: COLORS.primary },
  manageBtnDanger: { backgroundColor: COLORS.accentLight, borderColor: COLORS.accent },
  manageBtnDangerText: { color: COLORS.accentDark },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: 18,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  cardTop: { flexDirection: 'row', alignItems: 'flex-start' },
  icon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md,
  },
  thumb: { width: '100%', height: '100%', borderRadius: 12 },
  info: { flex: 1 },
  name: { ...TYPOGRAPHY.bodyLarge, fontWeight: '700', color: COLORS.textPrimary },
  desc: { ...TYPOGRAPHY.small, color: COLORS.textSecondary, marginTop: 1 },
  availBadge: {
    backgroundColor: COLORS.primaryLight,
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderRadius: 12,
  },
  availBadgeOff: { backgroundColor: COLORS.surfaceAlt },
  availText: { ...TYPOGRAPHY.smallBold, color: COLORS.primary, fontSize: 10 },
  availTextOff: { color: COLORS.textHint },
  number: { ...TYPOGRAPHY.h4, color: COLORS.primary, marginTop: SPACING.md },
  actions: {
    flexDirection: 'row',
    gap: SPACING.lg,
    marginTop: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingTop: SPACING.md,
  },
  actionText: { ...TYPOGRAPHY.smallBold, color: COLORS.primary },
  actionDanger: { color: COLORS.accentDark },
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
  photoHolder: {
    height: 132,
    borderRadius: 18,
    backgroundColor: COLORS.surfaceAlt,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    marginBottom: SPACING.md,
  },
  photoHolderFilled: { borderStyle: 'solid', borderColor: COLORS.primary },
  photoEmpty: { alignItems: 'center', gap: 4 },
  photoEmptyText: { ...TYPOGRAPHY.smallBold, color: COLORS.primary },
  photoPreview: { width: '100%', height: '100%' },
  photoOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    backgroundColor: 'rgba(47,62,158,0.82)',
    paddingVertical: 7,
  },
  photoOverlayText: { ...TYPOGRAPHY.smallBold, color: COLORS.onBrand, fontSize: 11 },
  photoRemoveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    marginTop: -SPACING.sm,
    marginBottom: SPACING.lg,
    paddingVertical: 4,
  },
  photoRemove: { ...TYPOGRAPHY.small, color: COLORS.accentDark, fontWeight: '600' },
  label: { ...TYPOGRAPHY.smallBold, color: COLORS.textSecondary, marginBottom: 6 },
  input: {
    backgroundColor: COLORS.surfaceAlt,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: SPACING.md,
    paddingVertical: 13,
    marginBottom: SPACING.md,
    fontSize: 15,
    color: COLORS.textPrimary,
  },
  availRow: { flexDirection: 'row', gap: 8, marginBottom: SPACING.sm },
  availPick: {
    paddingVertical: 9,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  availPickOn: { backgroundColor: COLORS.primary },
  availPickText: { ...TYPOGRAPHY.smallBold, color: COLORS.primary },
  availPickTextOn: { color: COLORS.onBrand },
  saveBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: SPACING.md,
  },
  saveText: { ...TYPOGRAPHY.button, color: COLORS.onBrand },
  cancelBtn: { alignSelf: 'center', marginTop: SPACING.md },
  cancelText: { ...TYPOGRAPHY.caption, color: COLORS.textSecondary, fontWeight: '600' },
});
