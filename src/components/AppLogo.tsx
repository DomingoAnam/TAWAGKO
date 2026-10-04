import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../theme/colors';

interface MarkProps {
  size?: number;
  style?: any;
}

/**
 * The TAWAGKO app mark: indigo rounded tile, white handset, amber vibration
 * waves either side — matching the generated launcher icon.
 */
export function AppLogoMark({ size = 96, style }: MarkProps) {
  const glyph = Math.round(size * 0.44);
  const arc = Math.round(size * 0.19);
  const arcW = Math.max(2, Math.round(size * 0.045));
  const arcOffset = Math.round(size * 0.235);
  const arcSpread = Math.round(size * 0.115);

  // Colouring only the right edge of a fully rounded box draws a ")" arc; the
  // left-hand waves reuse it mirrored with scaleX: -1.
  const wave = (side: 1 | -1, index: number) => {
    const inset = arcOffset + arcSpread * index;
    const base = {
      width: arc,
      height: arc,
      borderRadius: arc / 2,
      borderWidth: arcW,
      borderTopColor: 'transparent' as const,
      borderBottomColor: 'transparent' as const,
      borderLeftColor: 'transparent' as const,
      borderRightColor: COLORS.accent,
      top: (size - arc) / 2,
    };

    return side > 0 ? (
      <View key={`r${index}`} style={[styles.wave, base, { right: -inset }]} />
    ) : (
      <View
        key={`l${index}`}
        style={[styles.wave, base, { left: -inset, transform: [{ scaleX: -1 }] }]}
      />
    );
  };

  return (
    <View
      style={[
        styles.mark,
        {
          width: size,
          height: size,
          borderRadius: Math.round(size * 0.235),
        },
        style,
      ]}
    >
      {wave(1, 0)}
      {wave(1, 1)}
      {wave(-1, 0)}
      {wave(-1, 1)}

      <Ionicons name="phone-portrait" size={glyph} color={COLORS.onBrand} />
    </View>
  );
}

interface LogoProps extends MarkProps {
  showWordmark?: boolean;
  tagline?: string;
  wordmarkSize?: number;
}

export function AppLogo({
  size = 96,
  showWordmark = true,
  tagline,
  wordmarkSize = 30,
  style,
}: LogoProps) {
  return (
    <View style={[styles.wrapper, style]}>
      <AppLogoMark size={size} />

      {showWordmark && (
        <Text style={[styles.wordmark, { fontSize: wordmarkSize }]}>TAWAGKO</Text>
      )}

      {tagline ? <Text style={styles.tagline}>{tagline}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    alignItems: 'center',
  },
  mark: {
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: 'rgba(47, 62, 158, 0.28)',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 1,
    shadowRadius: 14,
    elevation: 8,
  },
  wave: {
    position: 'absolute',
  },
  wordmark: {
    marginTop: 14,
    fontWeight: '900',
    color: COLORS.primary,
    letterSpacing: 3,
  },
  tagline: {
    marginTop: 4,
    fontSize: 13,
    color: COLORS.textSecondary,
    letterSpacing: 0.4,
  },
});

export default AppLogo;