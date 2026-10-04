import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  Pressable,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, TYPOGRAPHY, SHADOWS, BORDER_RADIUS } from '../theme';

type Props = {
  label?: string;
  value: string;
  options: string[];
  onChange: (value: string) => void;
  placeholder?: string;
  icon?: any;
  /** Enables free-text entry when this option is selected. */
  customOption?: string;
  customLabel?: string;
  customPlaceholder?: string;
};

/**
 * Modal-backed dropdown. Avoids adding a native picker dependency, and keeps the
 * two-tone design system by rendering the list ourselves.
 *
 * The custom option holds its own local state so the free-text field stays open
 * while typing instead of collapsing on the first keystroke.
 */
export function SelectField({
  label,
  value,
  options,
  onChange,
  placeholder = 'Select an option',
  icon = 'briefcase-outline',
  customOption = 'Other',
  customLabel = 'Or enter your own',
  customPlaceholder = 'Enter position',
}: Props) {
  const [open, setOpen] = useState(false);
  const [custom, setCustom] = useState('');

  const isCustom = custom.length > 0;
  const hasValue = value !== '' || isCustom;
  const display = isCustom ? custom : value || placeholder;

  const choose = (option: string) => {
    if (option === customOption) {
      setCustom('');
      onChange('');
    } else {
      setCustom('');
      onChange(option);
    }
    setOpen(false);
  };

  const selectedInList = (option: string) =>
    option === customOption ? !hasValue : option === value;

  return (
    <View>
      {label ? <Text style={styles.label}>{label}</Text> : null}

      <TouchableOpacity
        style={styles.field}
        onPress={() => setOpen(true)}
        activeOpacity={0.9}
        accessibilityRole="button"
        accessibilityLabel={`${label ?? 'Select'}. Currently ${display}`}
        accessibilityHint="Opens a list of options"
      >
        <Ionicons name={icon} size={19} color={COLORS.textSecondary} />
        <Text style={[styles.value, !hasValue && styles.placeholder]} numberOfLines={1}>
          {display}
        </Text>
        <Ionicons name={open ? 'chevron-up' : 'chevron-down'} size={18} color={COLORS.textHint} />
      </TouchableOpacity>

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable style={styles.backdrop} onPress={() => setOpen(false)}>
          <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
            <View style={styles.handle} />
            <Text style={styles.sheetTitle}>{label ?? 'Select an option'}</Text>

            <FlatList
              data={options}
              keyExtractor={(item) => item}
              style={styles.list}
              keyboardShouldPersistTaps="handled"
              renderItem={({ item }) => {
                const selected = selectedInList(item);
                return (
                  <TouchableOpacity
                    style={[styles.option, selected && styles.optionSelected]}
                    onPress={() => choose(item)}
                    activeOpacity={0.9}
                    accessibilityRole="button"
                    accessibilityState={{ selected }}
                  >
                    <Text style={[styles.optionText, selected && styles.optionTextSelected]}>
                      {item}
                    </Text>
                    {selected ? <Ionicons name="checkmark" size={19} color={COLORS.primary} /> : null}
                  </TouchableOpacity>
                );
              }}
            />

            <View style={styles.customWrap}>
              <Text style={styles.label}>{customLabel}</Text>
              <TextInput
                style={styles.customInput}
                value={custom}
                onChangeText={(t) => {
                  setCustom(t);
                  onChange(t);
                }}
                placeholder={customPlaceholder}
                placeholderTextColor={COLORS.textHint}
                autoCapitalize="words"
              />
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

/** Positions offered for barangay personnel accounts. */
export const POSITION_OPTIONS = [
  'Barangay Captain',
  'Barangay Secretary',
  'Barangay Treasurer',
  'Councilor',
  'Committee Chair',
  'Executive Assistant',
  'Administrative Officer',
  'Disaster Response Officer',
  'Health Worker',
  'Community Facilitator',
  'Other',
];

const styles = StyleSheet.create({
  label: { ...TYPOGRAPHY.smallBold, color: COLORS.textSecondary, marginBottom: 6 },
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    backgroundColor: COLORS.surfaceAlt,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: SPACING.md,
    minHeight: 50,
    marginBottom: SPACING.md,
  },
  value: { flex: 1, fontSize: 15, color: COLORS.textPrimary },
  placeholder: { color: COLORS.textHint },
  backdrop: { flex: 1, backgroundColor: 'rgba(15,17,34,0.55)', justifyContent: 'center', padding: SPACING.xl },
  sheet: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.xl,
    padding: SPACING.lg,
    maxHeight: '80%',
    ...SHADOWS.lg,
  },
  handle: {
    width: 44,
    height: 4,
    borderRadius: 2,
    backgroundColor: COLORS.border,
    alignSelf: 'center',
    marginBottom: SPACING.md,
  },
  sheetTitle: { ...TYPOGRAPHY.h4, color: COLORS.textPrimary, marginBottom: SPACING.md },
  list: { flexGrow: 0 },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 13,
    paddingHorizontal: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
  },
  optionSelected: { backgroundColor: COLORS.primaryLight },
  optionText: { flex: 1, fontSize: 15, color: COLORS.textPrimary },
  optionTextSelected: { fontWeight: '700' },
  customWrap: { marginTop: SPACING.md },
  customInput: {
    backgroundColor: COLORS.surfaceAlt,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: SPACING.md,
    paddingVertical: 13,
    fontSize: 15,
    color: COLORS.textPrimary,
  },
});