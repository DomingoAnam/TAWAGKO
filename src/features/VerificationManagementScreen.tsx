import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  TextInput,
  Modal,
  ActivityIndicator,
  Image,
  Dimensions,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, TYPOGRAPHY, SHADOWS, BORDER_RADIUS } from '../theme';
import { getVerificationRequests, getCurrentUser } from '../services/storage';
import { reviewVerification, requirePersonnelAuth } from '../services/supabaseStorage';
import { StatusBadge, EmptyState } from '../components/ReusableComponents';

export default function VerificationManagementScreen() {
  const [items, setItems] = useState<any[]>([]);
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(true);
  const [correctionModal, setCorrectionModal] = useState(false);
  const [correctionTarget, setCorrectionTarget] = useState<any>(null);
  const [correctionReason, setCorrectionReason] = useState('');
  const [correctionMode, setCorrectionMode] = useState<'correct' | 'reject'>('correct');
  const [enlargedUri, setEnlargedUri] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const me = await getCurrentUser();
      const uname = me?.username ?? '';
      setUsername(uname);
      if (!uname) return;
      const rows = (await getVerificationRequests(uname)) || [];
      // Only show work awaiting a decision. The database filters this too, but
      // filtering here keeps the list correct even if that function is an older
      // revision, and prevents a decided request lingering after a decision.
      setItems(rows.filter((r: any) => r.status === 'PENDING_VERIFICATION'));
    } catch (error: any) {
      Alert.alert('Could not load', error?.message ?? 'Check your connection.');
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const decide = async (item: any, status: 'VERIFIED' | 'NEEDS_CORRECTION' | 'REJECTED', reason?: string) => {
    try {
      const updated = await reviewVerification(
        requirePersonnelAuth(username),
        item.id,
        status,
        reason
      );
      // The RPC returns false when the row could not be matched. Treat that as a
      // failure rather than silently leaving the request in the queue.
      if (updated === false) {
        Alert.alert('Could not update', 'That request no longer exists. Pull to refresh.');
        return;
      }
      await load();
    } catch (error: any) {
      Alert.alert('Could not update', error?.message ?? 'Please try again.');
    }
  };

  const approve = (item: any) => {
    Alert.alert('Approve verification?', `Mark ${item.residentName} as a verified resident?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Approve', onPress: () => decide(item, 'VERIFIED') },
    ]);
  };

  const reject = (item: any) => {
    setCorrectionTarget(item);
    setCorrectionReason('');
    setCorrectionMode('reject');
    setCorrectionModal(true);
  };

  const requestCorrection = (item: any) => {
    setCorrectionTarget(item);
    setCorrectionReason('');
    setCorrectionMode('correct');
    setCorrectionModal(true);
  };

  const submitModal = () => {
    if (!correctionReason.trim()) {
      Alert.alert(
        'Reason required',
        correctionMode === 'reject'
          ? 'Tell the resident why their verification was rejected.'
          : 'Tell the resident what needs correcting.'
      );
      return;
    }
    const target = correctionTarget;
    const reason = correctionReason.trim();
    setCorrectionModal(false);
    decide(target, correctionMode === 'reject' ? 'REJECTED' : 'NEEDS_CORRECTION', reason);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Resident Verification</Text>
      <Text style={styles.subtitle}>
        Approving updates the resident&apos;s status on their profile immediately.
      </Text>

      {loading ? (
        <ActivityIndicator color={COLORS.primary} style={styles.loader} />
      ) : items.length === 0 ? (
        <EmptyState
          title="No pending requests"
          message="Residents who submit a verification appear here. Requests you approve, reject, or send back for correction are removed from this list."
        />
      ) : (
        items.map((item) => (
          <View key={item.id} style={styles.card}>
            <View style={styles.cardTop}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>
                  {(item.residentName || '?').charAt(0).toUpperCase()}
                </Text>
              </View>
              <View style={styles.info}>
                <Text style={styles.name}>{item.residentName}</Text>
                {item.submittedAt ? (
                  <Text style={styles.meta}>
                    Submitted {new Date(item.submittedAt).toLocaleDateString()}
                  </Text>
                ) : null}
              </View>
            </View>

            <View style={styles.badgeRow}>
              <StatusBadge status={item.status} label={String(item.status).replace(/_/g, ' ')} />
            </View>

            {item.documentUri ? (
              <TouchableOpacity onPress={() => setEnlargedUri(item.documentUri)} activeOpacity={0.9}>
                <Image
                  source={{ uri: item.documentUri }}
                  style={styles.docThumb}
                  resizeMode="cover"
                />
                <View style={styles.docHint}>
                  <Ionicons name="expand-outline" size={14} color={COLORS.onBrand} />
                  <Text style={styles.docHintText}>Tap to view document</Text>
                </View>
              </TouchableOpacity>
            ) : (
              <Text style={styles.noDoc}>No document image was attached.</Text>
            )}

            {item.correctionReason ? (
              <View style={styles.reasonBox}>
                <Ionicons name="alert-circle" size={14} color={COLORS.accentDark} />
                <Text style={styles.reasonText}>{item.correctionReason}</Text>
              </View>
            ) : null}

            <View style={styles.actions}>
              <View style={styles.actionsRow}>
                <TouchableOpacity style={styles.approveBtn} onPress={() => approve(item)} activeOpacity={0.9}>
                  <Ionicons name="checkmark-circle" size={17} color={COLORS.onBrand} />
                  <Text style={styles.approveText}>APPROVE</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.rejectBtn}
                  onPress={() => reject(item)}
                  activeOpacity={0.9}
                >
                  <Ionicons name="close-circle" size={17} color={COLORS.accentDark} />
                  <Text style={styles.rejectText}>REJECT</Text>
                </TouchableOpacity>
              </View>
              <TouchableOpacity
                style={styles.correctBtn}
                onPress={() => requestCorrection(item)}
                activeOpacity={0.9}
              >
                <Ionicons name="refresh" size={17} color={COLORS.primary} />
                <Text style={styles.correctText}>REQUEST CORRECTION</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))
      )}

      <Modal visible={correctionModal} transparent animationType="fade">
        <View style={styles.backdrop}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>
              {correctionMode === 'reject' ? 'Reject Verification' : 'Request Correction'}
            </Text>
            <Text style={styles.modalSub}>
              {correctionMode === 'reject'
                ? `${correctionTarget?.residentName} will see "Verification Rejected" and must submit a new document.`
                : `${correctionTarget?.residentName} will see this reason on their profile.`}
            </Text>
            <TextInput
              style={styles.input}
              placeholder={
                correctionMode === 'reject'
                  ? 'e.g. The ID photo is unreadable'
                  : 'e.g. Upload a clearer photo of your ID'
              }
              value={correctionReason}
              onChangeText={setCorrectionReason}
              multiline
            />
            <TouchableOpacity
              style={[styles.submitBtn, correctionMode === 'reject' && styles.rejectSubmitBtn]}
              onPress={submitModal}
              activeOpacity={0.9}
            >
              <Text style={styles.submitText}>
                {correctionMode === 'reject' ? 'REJECT VERIFICATION' : 'SEND REQUEST'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setCorrectionModal(false)}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal visible={enlargedUri !== null} transparent animationType="fade" onRequestClose={() => setEnlargedUri(null)}>
        <TouchableOpacity style={styles.enlargeBackdrop} activeOpacity={1} onPress={() => setEnlargedUri(null)}>
          {enlargedUri ? (
            <Image
              source={{ uri: enlargedUri }}
              style={{ width: Dimensions.get('window').width - 32, height: Dimensions.get('window').width - 32 }}
              resizeMode="contain"
            />
          ) : null}
          <Text style={styles.enlargeHint}>Tap anywhere to close</Text>
        </TouchableOpacity>
      </Modal>

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: SPACING.xl, paddingBottom: SPACING.xxl },
  title: { ...TYPOGRAPHY.h2, color: COLORS.textPrimary },
  subtitle: { ...TYPOGRAPHY.caption, color: COLORS.textSecondary, marginTop: 4, marginBottom: SPACING.lg },
  loader: { marginVertical: SPACING.xl },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: 18,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  cardTop: { flexDirection: 'row', alignItems: 'center' },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md,
  },
  avatarText: { fontSize: 17, fontWeight: '800', color: COLORS.primary },
  info: { flex: 1 },
  name: { ...TYPOGRAPHY.bodyLarge, fontWeight: '700', color: COLORS.textPrimary },
  meta: { ...TYPOGRAPHY.small, color: COLORS.textSecondary, marginTop: 1 },
  badgeRow: { marginTop: SPACING.md },
  docThumb: { width: '100%', height: 140, borderRadius: 14, marginTop: SPACING.md, backgroundColor: COLORS.surfaceAlt },
  docHint: {
    position: 'absolute', bottom: 8, alignSelf: 'center',
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: 'rgba(15,17,34,0.72)',
    paddingHorizontal: 10, paddingVertical: 5, borderRadius: 12,
  },
  docHintText: { ...TYPOGRAPHY.small, color: COLORS.onBrand, fontWeight: '600' },
  noDoc: { ...TYPOGRAPHY.small, color: COLORS.textHint, marginTop: SPACING.md, fontStyle: 'italic' },
  enlargeBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.92)', justifyContent: 'center', alignItems: 'center', padding: SPACING.md },
  enlargeHint: { ...TYPOGRAPHY.small, color: COLORS.textHint, marginTop: SPACING.md },
  reasonBox: {
    flexDirection: 'row',
    gap: 7,
    backgroundColor: COLORS.accentLight,
    borderRadius: 12,
    padding: SPACING.sm,
    marginTop: SPACING.md,
  },
  reasonText: { flex: 1, ...TYPOGRAPHY.small, color: COLORS.accentDark, lineHeight: 17 },
  actions: { marginTop: SPACING.md, gap: SPACING.sm },
  actionsRow: { flexDirection: 'row', gap: SPACING.sm },
  approveBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: COLORS.primary,
    borderRadius: 14,
    paddingVertical: 13,
  },
  approveText: { ...TYPOGRAPHY.smallBold, color: COLORS.onBrand },
  rejectBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: COLORS.accentLight,
    borderRadius: 14,
    paddingVertical: 13,
    borderWidth: 1,
    borderColor: COLORS.accent,
  },
  rejectText: { ...TYPOGRAPHY.smallBold, color: COLORS.accentDark },
  correctBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: COLORS.surface,
    borderRadius: 14,
    paddingVertical: 13,
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  correctText: { ...TYPOGRAPHY.smallBold, color: COLORS.primary },
  backdrop: { flex: 1, backgroundColor: 'rgba(15,17,34,0.55)', justifyContent: 'center', padding: SPACING.xl },
  modalBox: { backgroundColor: COLORS.surface, borderRadius: 22, padding: SPACING.lg, ...SHADOWS.lg },
  modalTitle: { ...TYPOGRAPHY.h3, color: COLORS.textPrimary, textAlign: 'center' },
  modalSub: {
    ...TYPOGRAPHY.small,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: 4,
    marginBottom: SPACING.lg,
  },
  input: {
    backgroundColor: COLORS.surfaceAlt,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: SPACING.md,
    paddingVertical: 13,
    minHeight: 88,
    textAlignVertical: 'top',
    fontSize: 15,
    color: COLORS.textPrimary,
    marginBottom: SPACING.md,
  },
  submitBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: 16,
    paddingVertical: 15,
    alignItems: 'center',
  },
  rejectSubmitBtn: { backgroundColor: COLORS.accent },
  submitText: { ...TYPOGRAPHY.button, color: COLORS.onBrand },
  cancelText: { textAlign: 'center', color: COLORS.textSecondary, marginTop: SPACING.lg, fontWeight: '600' },
});
