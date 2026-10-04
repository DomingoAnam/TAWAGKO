import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Animated, ActivityIndicator } from 'react-native';
import { COLORS, SPACING } from '../theme';
import { AppLogo } from '../components/AppLogo';
import { initAppData } from '../services/sampleData';
import { getCurrentUser } from '../services/storage';

export default function SplashScreen({ navigation }: any) {
  const [scale] = useState(() => new Animated.Value(0.6));
  const [opacity] = useState(() => new Animated.Value(0));

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scale, { toValue: 1, useNativeDriver: true }),
      Animated.timing(opacity, { toValue: 1, duration: 600, useNativeDriver: true }),
    ]).start();

    const init = async () => {
      await initAppData();
      const user = await getCurrentUser();
      setTimeout(() => {
        if (user && user.role === 'resident') {
          navigation.replace('ResidentMain');
        } else if (user && user.role === 'personnel') {
          navigation.replace('PersonnelMain');
        } else {
          navigation.replace('RoleSelection');
        }
      }, 1800);
    };
    init();
  }, []);

  return (
    <View style={styles.container}>
      <Animated.View style={{ transform: [{ scale }], opacity }}>
        <AppLogo size={120} showWordmark={false} />
        <Text style={styles.appName}>TAWAGKO</Text>
        <Text style={styles.tagline}>“Your Barangay Connection”</Text>
      </Animated.View>
      <ActivityIndicator style={styles.loader} size="small" color={COLORS.primary} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  appName: {
    fontSize: 34,
    fontWeight: '900',
    color: COLORS.primary,
    textAlign: 'center',
    letterSpacing: 4,
    marginTop: SPACING.lg,
  },
  tagline: {
    fontSize: 15,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: 8,
    fontStyle: 'italic',
    letterSpacing: 0.5,
  },
  loader: { position: 'absolute', bottom: 72 },
});
