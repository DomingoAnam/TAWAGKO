import React from 'react';
import { View, TextInput, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, TYPOGRAPHY } from '../theme';

export const SearchBar = ({ value, onChangeText, placeholder = 'Search…' }: any) => (
  <View style={styles.container}>
    <Ionicons name="search" size={19} color={COLORS.textHint} style={styles.icon} />
    <TextInput
      style={[TYPOGRAPHY.body, styles.input]}
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder}
      placeholderTextColor={COLORS.textHint}
      autoCorrect={false}
      returnKeyType="search"
    />
    {!!value && (
      <Ionicons name="close-circle" size={18} color={COLORS.textHint} />
    )}
  </View>
);

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: 28,
    paddingHorizontal: 20,
    height: 52,
    marginVertical: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  icon: { marginRight: SPACING.sm },
  input: {
    flex: 1,
    color: COLORS.textPrimary,
    paddingVertical: 0,
  },
});