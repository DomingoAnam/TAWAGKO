import React, { useCallback, useEffect } from 'react';
import { Animated, Easing, Platform, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, SPACING, TYPOGRAPHY } from '../theme';
import { setBannerPresenter, type BannerPayload, type BannerTone } from '../services/bannerStore';

const ICONS: Record<BannerTone, keyof typeof Ionicons.glyphMap> = {
  info: 'notifications',
  success: 'checkmark-circle',
  warn: 'alert-circle',
};

const ACCENT: Record<BannerTone, string> = {
  info: COLORS.primary,
  success: '#1E9E5A',
  warn: COLORS.accentDark,
};

/**
 * Renders a heads-up style banner that slides down from the top of the screen.
 * Used when the real system notification channel is unavailable (Expo Go).
 */
export default function NotificationHost() {
  const insets = useSafeAreaInsets();
  const [banner, setBanner] = React.useState<BannerPayload | null>(null);
  // Animated values are stable objects, so lazy state initialisers are the
  // ref-safe way to hold them (reading ref.current during render is not).
  const [slide] = React.useState(() => new Animated.Value(-160));
  const [opacity] = React.useState(() => new Animated.Value(0));
  const timer = React.useRef<{ id: ReturnType<typeof setTimeout> } | null>(null);

  const hide = useCallback(() => {
    Animated.parallel([
      Animated.timing(slide, { toValue: -160, duration: 220, easing: Easing.in(Easing.quad), useNativeDriver: true }),
      Animated.timing(opacity, { toValue: 0, duration: 180, useNativeDriver: true }),
    ]).start(() => setBanner(null));
  }, [slide, opacity]);

  const show = useCallback(
    (payload: BannerPayload) => {
      if (timer.current) clearTimeout(timer.current.id);
      setBanner(payload);
      slide.setValue(-160);
      opacity.setValue(0);
      Animated.parallel([
        Animated.timing(slide, { toValue: 0, duration: 280, easing: Easing.out(Easing.back(1.4)), useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 1, duration: 200, useNativeDriver: true }),
      ]).start();
      const id = setTimeout(hide, 4500);
      timer.current = { id };
    },
    [hide, opacity, slide]
  );

  useEffect(() => {
    setBannerPresenter(show);
    return () => setBannerPresenter(null);
  }, [show]);

  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current.id);
  }, []);

  if (!banner) return null;

  const tone = banner.tone ?? 'info';

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.wrap,
        { top: insets.top + SPACING.sm, opacity, transform: [{ translateY: slide }] },
      ]}
    >
      <View style={styles.card}>
        <View style={[styles.iconWrap, { backgroundColor: ACCENT[tone] }]}>
          <Ionicons name={ICONS[tone]} size={18} color={COLORS.onBrand} />
        </View>
        <View style={styles.text}>
          <Text style={styles.title} numberOfLines={1}>
            {banner.title}
          </Text>
          {banner.body ? (
            <Text style={styles.body} numberOfLines={3}>
              {banner.body}
            </Text>
          ) : null}
        </View>
      </View>
      <View style={styles.shadow} />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    left: SPACING.md,
    right: SPACING.md,
    zIndex: 999,
    elevation: 12,
    ...Platform.select({
      android: { elevation: 12 },
      default: {},
    }),
  },
  card: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: SPACING.md,
    backgroundColor: COLORS.surface,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
  },
  shadow: {
    position: 'absolute',
    left: 12,
    right: 12,
    bottom: -6,
    height: 12,
    borderRadius: 16,
    backgroundColor: 'rgba(4,95,228,0.18)',
  },
  iconWrap: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: { flex: 1 },
  title: { ...TYPOGRAPHY.body, fontWeight: '800', color: COLORS.textPrimary },
  body: { ...TYPOGRAPHY.small, color: COLORS.textSecondary, marginTop: 2 },
});