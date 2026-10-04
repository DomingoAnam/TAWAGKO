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
import { getBarangayServices, getCurrentUser } from '../services/storage';
import {
  upsertBarangayService,
  deleteBarangayService,
  requirePersonnelAuth,
} from '../services/supabaseStorage';
import { EmptyState } from '../components/ReusableComponents';
import { pickImageAsDataUri } from '../services/imagePicker';

const AVAILABILITY = ['Available', 'Unavailable'];

const blank = () => ({
  serviceName: '',
  contactNumber: '',
  location: '',
  officeHours: '',
  availability: 'Available',
  description: '',
  photoUri: null as string | null,
});

export default function ManageServicesScreen() {
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
      setItems((await getBarangayServices()) || []);
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
      contactNumber: item.contactNumber ?? '',
      location: item.location ?? '',
      officeHours: item.officeHours ?? '',
      availability: item.availability ?? 'Available',
      description: item.description ?? '',
      photoUri: item.photoUri ?? null,
    });
    setOpen(true);
  };

  const save = async () => {
    if (!form.serviceName.trim()) {
      Alert.alert('Missing field', 'Service name is required.');
      return;
    }
    setSaving(true);
    try {
      await upsertBarangayService(requirePersonnelAuth(username), {
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
    Alert.alert('Delete service?', item.serviceName, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteBarangayService(requirePersonnelAuth(username), item.id);
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
      <Text style={styles.title}>Barangay Services</Text>
      <Text style={styles.subtitle}>
        Saved to the database and shown to residents immediately.
      </Text>

      <TouchableOpacity style={styles.addBtn} onPress={openAdd} activeOpacity={0.9}>
        <Ionicons name="add" size={19} color={COLORS.onBrand} />
        <Text style={styles.addText}>ADD SERVICE</Text>
      </TouchableOpacity>

      {items.length === 0 ? (
        <EmptyState title="No services yet" message="Add the services residents can avail of." />
      ) : null}

      {items.map((item) => (
        <View key={item.id} style={styles.card}>
          <View style={styles.cardTop}>
            <View style={styles.icon}>
              {item.photoUri ? (
                <Image source={{ uri: item.photoUri }} style={styles.thumb} />
              ) : (
                <Ionicons name="business" size={18} color={COLORS.primary} />
              )}
            </View>
            <View style={styles.info}>
              <Text style={styles.name}>{item.serviceName}</Text>
              {item.description ? <Text style={styles.desc}>{item.description}</Text> : null}
            </View>
          </View>

          <View style={styles.metaList}>
            {item.contactNumber ? (
              <View style={styles.metaRow}>
                <Ionicons name="call-outline" size={14} color={COLORS.primary} />
                <Text style={styles.metaText}>{item.contactNumber}</Text>
              </View>
            ) : null}
            {item.location ? (
              <View style={styles.metaRow}>
                <Ionicons name="location-outline" size={14} color={COLORS.primary} />
                <Text style={styles.metaText}>{item.location}</Text>
              </View>
            ) : null}
            {item.officeHours ? (
              <View style={styles.metaRow}>
                <Ionicons name="time-outline" size={14} color={COLORS.primary} />
                <Text style={styles.metaText}>{item.officeHours}</Text>
              </View>
            ) : null}
          </View>

          <View style={styles.actions}>
            <TouchableOpacity onPress={() => openEdit(item)} hitSlop={{ top: 8, bottom: 8 }}>
              <Text style={styles.actionText}>EDIT</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => remove(item)} hitSlop={{ top: 8, bottom: 8 }}>
              <Text style={[styles.actionText, styles.actionDanger]}>DELETE</Text>
            </TouchableOpacity>
          </View>
        </View>
      ))}

      <Modal visible={open} animationType="slide" transparent>
        <View style={styles.backdrop}>
          <ScrollView style={styles.sheetScroll} contentContainerStyle={styles.sheet}>
            <View style={styles.handle} />
            <Text style={styles.sheetTitle}>{editing ? 'Edit Service' : 'Add Service'}</Text>

            <Text style={styles.label}>Image</Text>
            {/* The holder itself is the button: tap to insert, tap again to change. */}
            <TouchableOpacity
              style={[styles.photoHolder, form.photoUri && styles.photoHolderFilled]}
              onPress={choosePhoto}
              activeOpacity={0.85}
              accessibilityRole="button"
              accessibilityLabel={
                form.photoUri ? 'Change image' : 'Insert image for this service'
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
              placeholder="Barangay Office"
            />
            <Text style={styles.label}>Contact Number</Text>
            <TextInput
              style={styles.input}
              value={form.contactNumber}
              onChangeText={(v) => setForm({ ...form, contactNumber: v })}
              placeholder="(02) 8123-0001"
              keyboardType="phone-pad"
            />
            <Text style={styles.label}>Location</Text>
            <TextInput
              style={styles.input}
              value={form.location}
              onChangeText={(v) => setForm({ ...form, location: v })}
              placeholder="Barangay Hall, Main Street"
            />
            <Text style={styles.label}>Office Hours</Text>
            <TextInput
              style={styles.input}
              value={form.officeHours}
              onChangeText={(v) => setForm({ ...form, officeHours: v })}
              placeholder="Mon–Fri, 8AM–5PM"
            />
            <Text style={styles.label}>Description</Text>
            <TextInput
              style={[styles.input, styles.multiline]}
              value={form.description}
              onChangeText={(v) => setForm({ ...form, description: v })}
              placeholder="Clearance, certifications, and general inquiries."
              multiline
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
          </ScrollView>
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
  info: { flex: 1 },
  name: { ...TYPOGRAPHY.bodyLarge, fontWeight: '700', color: COLORS.textPrimary },
  desc: { ...TYPOGRAPHY.small, color: COLORS.textSecondary, marginTop: 2, lineHeight: 18 },
  metaList: { gap: 6, marginTop: SPACING.md },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  metaText: { ...TYPOGRAPHY.small, color: COLORS.textPrimary, flex: 1 },
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
  sheetScroll: { flexGrow: 0, maxHeight: '90%' },
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
  thumb: { width: '100%', height: '100%', borderRadius: 12 },
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
  multiline: { minHeight: 88, textAlignVertical: 'top' },
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
