import { COLORS } from './colors';

export { COLORS };

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const BORDER_RADIUS = {
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  full: 9999,
};

export const SHADOWS = {
  none: {},
  sm: {
    shadowColor: COLORS.shadowColor,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  md: {
    shadowColor: COLORS.shadowColor,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 4,
  },
  lg: {
    shadowColor: COLORS.shadowColor,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
  },
};

export const TYPOGRAPHY = {
  h1: { fontSize: 32, fontWeight: '900' as const, lineHeight: 40 },
  h2: { fontSize: 24, fontWeight: '800' as const, lineHeight: 32 },
  h3: { fontSize: 20, fontWeight: '700' as const, lineHeight: 28 },
  h4: { fontSize: 18, fontWeight: '700' as const, lineHeight: 26 },
  body: { fontSize: 16, fontWeight: '400' as const, lineHeight: 24 },
  bodyLarge: { fontSize: 16, fontWeight: '500' as const, lineHeight: 24 },
  caption: { fontSize: 14, fontWeight: '400' as const, lineHeight: 20 },
  captionBold: { fontSize: 14, fontWeight: '600' as const, lineHeight: 20 },
  small: { fontSize: 12, fontWeight: '400' as const, lineHeight: 16 },
  smallBold: { fontSize: 12, fontWeight: '700' as const, lineHeight: 16 },
  button: { fontSize: 16, fontWeight: '700' as const, lineHeight: 24 },
};

export const COMPONENT_STYLES = {
  card: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    ...SHADOWS.md,
  },
  cardSm: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    ...SHADOWS.sm,
  },
  input: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.borderColor,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    fontSize: 16,
    color: COLORS.textPrimary,
    ...SHADOWS.sm,
  },
  buttonPrimary: {
    backgroundColor: COLORS.primaryGreen,
    borderRadius: BORDER_RADIUS.full,
    paddingVertical: 16,
    paddingHorizontal: 32,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    minHeight: 56,
    ...SHADOWS.md,
  },
  buttonSecondary: {
    backgroundColor: COLORS.white,
    borderWidth: 2,
    borderColor: COLORS.primaryGreen,
    borderRadius: BORDER_RADIUS.full,
    paddingVertical: 14,
    paddingHorizontal: 28,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    minHeight: 52,
  },
  buttonDanger: {
    backgroundColor: COLORS.accentRed,
    borderRadius: BORDER_RADIUS.full,
    paddingVertical: 16,
    paddingHorizontal: 32,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    minHeight: 56,
    ...SHADOWS.md,
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: BORDER_RADIUS.full,
    fontSize: 11,
    fontWeight: '700' as const,
    textTransform: 'uppercase' as const,
  },
};