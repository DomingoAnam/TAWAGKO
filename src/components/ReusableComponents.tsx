import React from 'react';
import { TouchableOpacity, Text, View, StyleSheet, Modal, Pressable } from 'react-native';
import { COLORS, SPACING, TYPOGRAPHY, SHADOWS, COMPONENT_STYLES, BORDER_RADIUS } from '../theme';

export const PrimaryButton = ({ title, onPress, disabled, style, textStyle }: any) => (
  <TouchableOpacity
    onPress={disabled ? undefined : onPress}
    disabled={disabled}
    style={[COMPONENT_STYLES.buttonPrimary, disabled && styles.primaryButtonDisabled, style]}
    accessible
    accessibilityState={{ disabled }}
  >
    <Text style={[TYPOGRAPHY.button, { color: COLORS.white }, textStyle]}>{title}</Text>
  </TouchableOpacity>
);

export const SecondaryButton = ({ title, onPress, disabled, style, textStyle }: any) => (
  <TouchableOpacity
    onPress={disabled ? undefined : onPress}
    disabled={disabled}
    style={[COMPONENT_STYLES.buttonSecondary, disabled && styles.secondaryButtonDisabled, style]}
    accessible
    accessibilityState={{ disabled }}
  >
    <Text style={[TYPOGRAPHY.button, { color: COLORS.primaryGreen }, textStyle]}>{title}</Text>
  </TouchableOpacity>
);

export const ConfirmationModal = ({
  visible,
  title,
  message,
  confirmTitle,
  cancelTitle,
  onConfirm,
  onCancel,
  destructive,
}: any) => (
  <Modal visible={visible} transparent animationType="fade">
    <View style={styles.modalOverlay}>
      <View style={styles.modalBox}>
        <Text style={styles.modalTitle}>{title}</Text>
        <Text style={styles.modalMessage}>{message}</Text>
        <View style={styles.modalButtons}>
          <Pressable style={[styles.modalBtn, styles.modalCancel]} onPress={onCancel}>
            <Text style={styles.modalCancelText}>{cancelTitle}</Text>
          </Pressable>
          <Pressable
            style={[styles.modalBtn, destructive ? styles.modalDanger : styles.modalConfirm]}
            onPress={onConfirm}
          >
            <Text style={styles.modalConfirmText}>{confirmTitle}</Text>
          </Pressable>
        </View>
      </View>
    </View>
  </Modal>
);

const STATUS_COLORS: Record<string, { bg: string; fg: string }> = {
  PENDING: { bg: '#FFF8E1', fg: '#F9A825' },
  UNDER_REVIEW: { bg: '#E3F2FD', fg: '#1E88E5' },
  ASSISTANCE_ARRANGED: { bg: '#E8F5E9', fg: '#2E7D32' },
  COMPLETED: { bg: '#E0F2F1', fg: '#00695C' },
  VERIFIED: { bg: '#E8F5E9', fg: '#2E7D32' },
  PENDING_VERIFICATION: { bg: '#FFF8E1', fg: '#F9A825' },
  NEEDS_CORRECTION: { bg: '#FFEBEE', fg: '#C62828' },
  AVAILABLE: { bg: '#E8F5E9', fg: '#2E7D32' },
  UNAVAILABLE: { bg: '#FFEBEE', fg: '#C62828' },
};

export const StatusBadge = ({ status, label }: any) => {
  const c = STATUS_COLORS[status] || { bg: '#EEEEEE', fg: '#616161' };
  return (
    <View style={[styles.badge, { backgroundColor: c.bg }]}>
      <Text style={[styles.badgeText, { color: c.fg }]}>
        {label || String(status).replace(/_/g, ' ')}
      </Text>
    </View>
  );
};

export const VerificationBadge = ({ status }: any) => {
  const map: Record<string, string> = {
    VERIFIED: 'Verification Confirmed',
    PENDING_VERIFICATION: 'Pending Verification',
    NEEDS_CORRECTION: 'Needs Correction',
    REJECTED: 'Verification Rejected',
  };
  return <StatusBadge status={status} label={map[status] || status} />;
};

export const EmptyState = ({ title, message, actionLabel, onAction }: any) => (
  <View style={styles.emptyState}>
    <Text style={styles.emptyTitle}>{title}</Text>
    <Text style={styles.emptyMessage}>{message}</Text>
    {actionLabel && (
      <PrimaryButton title={actionLabel} onPress={onAction} style={{ marginTop: SPACING.lg }} />
    )}
  </View>
);

const styles = StyleSheet.create({
  primaryButtonDisabled: {
    backgroundColor: '#A5D6A7',
  },
  secondaryButtonDisabled: {
    borderColor: '#BDBDBD',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: COLORS.overlayColor,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  modalBox: {
    backgroundColor: COLORS.white,
    borderRadius: 24,
    padding: 24,
    width: '100%',
    maxWidth: 360,
  },
  modalTitle: {
    ...TYPOGRAPHY.h3,
    color: COLORS.textPrimary,
    marginBottom: 12,
    textAlign: 'center',
  },
  modalMessage: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: 24,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 16,
  },
  modalBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 9999,
    alignItems: 'center',
  },
  modalCancel: {
    backgroundColor: COLORS.mediumGray,
  },
  modalCancelText: {
    ...TYPOGRAPHY.button,
    color: COLORS.textPrimary,
  },
  modalConfirm: {
    backgroundColor: COLORS.primaryGreen,
  },
  modalDanger: {
    backgroundColor: COLORS.accentRed,
  },
  modalConfirmText: {
    ...TYPOGRAPHY.button,
    color: COLORS.white,
  },
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 9999,
    alignSelf: 'flex-start',
  },
  badgeText: {
    ...TYPOGRAPHY.smallBold,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  emptyState: {
    alignItems: 'center',
    padding: 32,
  },
  emptyTitle: {
    ...TYPOGRAPHY.h3,
    color: COLORS.textPrimary,
    marginBottom: 16,
  },
  emptyMessage: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
});