/**
 * TAWAGKO theme palette — two brand colours only.
 *
 *   Primary : Indigo  #2F3E9E
 *   Accent  : Amber   #F2A03D
 *
 * Every other value is a neutral (white / grey / ink) so the UI never
 * introduces a third hue. Success and error states are expressed with the
 * brand colours plus weight and badges instead of green / red.
 *
 * Legacy keys (primaryGreen, accentRed, ...) are kept as aliases so existing
 * screens keep working without a wide refactor.
 */
export const COLORS = {
  // ---- Brand (the only two hues) ----
  primary: '#2F3E9E',
  primaryDark: '#1F2A6E',
  primaryLight: '#E8EAF6',
  accent: '#F2A03D',
  accentDark: '#D9822B',
  accentLight: '#FDF1E2',

  // ---- Neutrals ----
  background: '#F5F6FB',
  surface: '#FFFFFF',
  surfaceAlt: '#F0F2F9',
  border: '#E2E5F0',

  ink: '#16182B',
  inkSoft: '#5A5F7A',
  inkMuted: '#9AA0B5',
  onBrand: '#FFFFFF',

  // ---- Effects ----
  shadow: 'rgba(31, 42, 110, 0.14)',
  overlay: 'rgba(16, 18, 38, 0.55)',

  // ---- Semantic (built from the two brand colours + neutrals) ----
  success: '#2F3E9E', // positive = primary
  successSoft: '#E8EAF6',
  warning: '#F2A03D', // caution = accent
  warningSoft: '#FDF1E2',
  error: '#D9822B', // attention = accentDark (deliberately not red)
  errorSoft: '#FDF1E2',
  info: '#2F3E9E',
  infoSoft: '#E8EAF6',

  // ---- Legacy aliases ----
  primaryGreen: '#2F3E9E',
  secondaryGreen: '#4A57B8',
  accentRed: '#F2A03D',
  lightGreen: '#E8EAF6',
  darkGreen: '#1F2A6E',
  white: '#FFFFFF',
  lightGray: '#F5F6FB',
  mediumGray: '#E2E5F0',
  darkGray: '#4A4F63',
  textPrimary: '#16182B',
  textSecondary: '#5A5F7A',
  textHint: '#9AA0B5',
  textInverse: '#FFFFFF',
  borderColor: '#E2E5F0',
  successGreen: '#2F3E9E',
  warningAmber: '#F2A03D',
  errorRed: '#D9822B',
  placeholderGray: '#C3C8DA',
  shadowColor: 'rgba(31, 42, 110, 0.14)',
  overlayColor: 'rgba(16, 18, 38, 0.55)',
};

export default COLORS;