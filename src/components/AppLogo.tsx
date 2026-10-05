import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import { COLORS } from '../theme/colors';

interface MarkProps {
  size?: number;
  style?: any;
}

/**
 * The TAWAGKO app mark: the actual brand square (blue tile + white phone ring,
 * wifi waves and location pin), as generated from the source logo. This keeps
 * the in-app header in lockstep with the launcher icon and splash.
 */
export function AppLogoMark({ size = 96, style }: MarkProps) {
  return (
    <View
      style={[
        styles.markImage,
        { width: size, height: size, borderRadius: Math.round(size * 0.235) },
        style,
      ]}
    >
      <Image
        source={require('../../assets/icon.png')}
        style={{ width: '100%', height: '100%', borderRadius: Math.round(size * 0.235) }}
        accessibilityIgnoresInvertColors
      />
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
  markImage: {
    overflow: 'hidden',
    shadowColor: 'rgba(4, 95, 228, 0.30)',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 1,
    shadowRadius: 14,
    elevation: 8,
  },
  wordmark: {
    marginTop: 14,
    fontWeight: '900',
    color: '#045FE4',
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