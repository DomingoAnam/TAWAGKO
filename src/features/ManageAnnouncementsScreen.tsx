import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
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
import { COLORS, SPACING, TYPOGRAPHY } from '../theme';
import { getAnnouncements, getCurrentUser } from '../services/storage';
import {
  publishAnnouncement,
  updateAnnouncement,
  deleteAnnouncement,
  requirePersonnelAuth,
} from '../services/supabaseStorage';
import { EmptyState } from '../components/ReusableComponents';

const CATEGORIES = ['EMERGENCY', 'SERVICES', 'COMMUNITY'];

const blankForm = () => ({
  title: '',
  description: '',
  category: 'COMMUNITY',
  date: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
  time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
  important: false,
});

export default function ManageAnnouncementsScreen() {
  const [items, setItems] = useState<any[]>([]);
  const [creds, setCreds] = useState<{ username: string; password: string } | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState(blankForm);
  const [saving, setSaving] = useState(false);

  useFocusEffect(
    useCallback(() => {
      const load = async () => {
        const u = await getCurrentUser();
        if (u?.username) setCreds({ username: u.username, password: '' });
        try {
          setItems((await getAnnouncements()) || []);
        } catch (error: any) {
          Alert.alert('Could not load', error?.message ?? 'Check your connection.');
        }
      };
      load();
    }, [])
  );

  const openAdd = () => {
    setEditing(null);
    setForm(blankForm());
    setModalVisible(true);
  };

  const openEdit = (item: any) => {
    setEditing(item);
    setForm({
      title: item.title,
      description: item.description ?? '',
      category: item.category ?? 'COMMUNITY',
      date: item.date ?? '',
      time: item.time ?? '',
      important: !!item.important,
    });
    setModalVisible(true);
  };

  const refresh = async () => setItems((await getAnnouncements()) || []);

  /** Saves straight to the database; the password comes from the sign-in cache. */
  const save = async () => {
    if (!form.title.trim() || !form.description.trim()) {
      Alert.alert('Missing fields', 'Title and description are required.');
      return;
    }

    setSaving(true);
    try {
      const c = requirePersonnelAuth(creds?.username ?? '');
      if (editing) {
        await updateAnnouncement(c, editing.id, form);
      } else {
        await publishAnnouncement(c, form);
      }
      setModalVisible(false);
      await refresh();
    } catch (error: any) {
      Alert.alert('Could not save', error?.message ?? 'Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const remove = (item: any) => {
    Alert.alert('Delete announcement?', item.title, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteAnnouncement(requirePersonnelAuth(creds?.username ?? ''), item.id);
            await refresh();
          } catch (error: any) {
            Alert.alert('Could not delete', error?.message ?? 'Please try again.');
          }
        },
      },
    ]);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Announcements</Text>
      <Text style={styles.subtitle}>
        Published announcements appear instantly on the resident home and
        announcements feed.
      </Text>

      <TouchableOpacity style={styles.addBtn} onPress={openAdd} activeOpacity={0.9}>
        <Ionicons name="megaphone" size={18} color={COLORS.onBrand} />
        <Text style={styles.addText}>PUBLISH ANNOUNCEMENT</Text>
      </TouchableOpacity>

      {items.length === 0 ? (
        <EmptyState
          title="Nothing published yet"
          message="Your announcements will be saved to the database and shown to residents."
        />
      ) : null}

      {items.map((item) => (
        <View key={item.id} style={styles.card}>
          <View style={styles.cardTop}>
            <Text style={styles.name}>{item.title}</Text>
            {item.important ? (
              <View style={styles.impBadge}>
                <Ionicons name="warning" size={11} color={COLORS.accentDark} />
                <Text style={styles.impText}>IMPORTANT</Text>
              </View>
            ) : null}
          </View>
          <Text style={styles.meta}>
            {item.category} · {item.date}
            {item.time ? ` · ${item.time}` : ''}
          </Text>
          <Text style={styles.desc}>{item.description}</Text>
          {item.createdBy ? <Text style={styles.by}>by {item.createdBy}</Text> : null}

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

      <Modal visible={modalVisible} animationType="slide">
        <ScrollView style={styles.modal} contentContainerStyle={styles.modalContent}>
          <Text style={styles.modalTitle}>
            {editing ? 'Edit Announcement' : 'New Announcement'}
          </Text>
          <TextInput
            style={styles.input}
            placeholder="Title"
            value={form.title}
            onChangeText={(v) => setForm({ ...form, title: v })}
          />
          <TextInput
            style={[styles.input, styles.multiline]}
            placeholder="Description"
            value={form.description}
            onChangeText={(v) => setForm({ ...form, description: v })}
            multiline
          />
          <Text style={styles.label}>Category</Text>
          <View style={styles.catRow}>
            {CATEGORIES.map((c) => (
              <TouchableOpacity
                key={c}
                style={[styles.catBtn, form.category === c && styles.catOn]}
                onPress={() => setForm({ ...form, category: c })}
              >
                <Text style={[styles.catText, form.category === c && styles.catTextOn]}>{c}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <TextInput
            style={styles.input}
            placeholder="Date"
            value={form.date}
            onChangeText={(v) => setForm({ ...form, date: v })}
          />
          <TextInput
            style={styles.input}
            placeholder="Time"
            value={form.time}
            onChangeText={(v) => setForm({ ...form, time: v })}
          />
          <TouchableOpacity
            style={styles.impRow}
            onPress={() => setForm({ ...form, important: !form.important })}
          >
            <View style={[styles.checkbox, form.important && styles.checkboxOn]}>
              {form.important ? <Ionicons name="checkmark" size={14} color={COLORS.onBrand} /> : null}
            </View>
            <Text style={styles.impRowText}>Mark as Important</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.saveBtn} onPress={save} disabled={saving}>
            {saving ? (
              <ActivityIndicator color={COLORS.onBrand} />
            ) : (
              <Text style={styles.saveText}>PUBLISH</Text>
            )}
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setModalVisible(false)} disabled={saving}>
            <Text style={styles.cancelText}>CANCEL</Text>
          </TouchableOpacity>
        </ScrollView>
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
    gap: SPACING.sm,
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
  cardTop: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm },
  name: { flex: 1, ...TYPOGRAPHY.h4, color: COLORS.textPrimary },
  impBadge: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  impText: { ...TYPOGRAPHY.smallBold, color: COLORS.accentDark, fontSize: 10 },
  meta: { ...TYPOGRAPHY.small, color: COLORS.primary, marginTop: 4, fontWeight: '600' },
  desc: { ...TYPOGRAPHY.body, color: COLORS.textPrimary, marginTop: 6 },
  by: { ...TYPOGRAPHY.small, color: COLORS.textHint, marginTop: 4 },
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
  modal: { flex: 1, backgroundColor: COLORS.surface },
  modalContent: { padding: SPACING.xl },
  modalTitle: { ...TYPOGRAPHY.h2, color: COLORS.textPrimary, marginBottom: SPACING.lg },
  input: {
    backgroundColor: COLORS.surfaceAlt,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: SPACING.md,
    paddingVertical: 13,
    marginBottom: SPACING.md,
    fontSize: 15,
    color: COLORS.textPrimary,
  },
  multiline: { minHeight: 110, textAlignVertical: 'top' },
  label: { ...TYPOGRAPHY.smallBold, color: COLORS.textSecondary, marginBottom: 6 },
  catRow: { flexDirection: 'row', gap: 8, marginBottom: SPACING.md },
  catBtn: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  catOn: { backgroundColor: COLORS.primary },
  catText: { ...TYPOGRAPHY.smallBold, color: COLORS.primary, fontSize: 12 },
  catTextOn: { color: COLORS.onBrand },
  impRow: { flexDirection: 'row', alignItems: 'center', marginBottom: SPACING.sm },
  impRowText: { marginLeft: 10, fontWeight: '600', color: COLORS.textPrimary },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxOn: { backgroundColor: COLORS.primary },
  saveBtn: {
    backgroundColor: COLORS.primary,
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
    marginTop: SPACING.lg,
  },
  saveText: { ...TYPOGRAPHY.button, color: COLORS.onBrand },
  cancelText: { textAlign: 'center', color: COLORS.textSecondary, marginTop: SPACING.lg, fontWeight: '600' },
});