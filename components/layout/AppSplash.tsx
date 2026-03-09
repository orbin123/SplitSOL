import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { SplitSolLogo } from '@/components/branding/SplitSolLogo';

const SPLASH_GRADIENT = ['#7C3AED', '#A855F7', '#BFDBFE'] as const;

export function AppSplash() {
  const insets = useSafeAreaInsets();

  return (
    <LinearGradient
      colors={SPLASH_GRADIENT}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.gradient}
    >
      <View style={[styles.content, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
        <View style={styles.logoSection}>
          <SplitSolLogo size={88} />
          <Text style={styles.title}>SplitSOL</Text>
          <ActivityIndicator
            size="small"
            color="#FFFFFF"
            style={styles.loader}
          />
        </View>
        <Text style={styles.footer}>Powered by Solana</Text>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: {
    flex: 1,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
  },
  logoSection: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -60,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: '700',
    marginTop: 24,
  },
  loader: {
    marginTop: 24,
  },
  footer: {
    color: 'rgba(255, 255, 255, 0.4)',
    fontSize: 12,
    marginBottom: 32,
  },
});
