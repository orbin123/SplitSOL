import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Button } from '@/components/ui/Button';
import { SplitSolLogo } from '@/components/branding/SplitSolLogo';
import { COLORS, SPACING, FONT, RADIUS } from '@/utils/constants';

export default function Welcome() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <View style={styles.hero}>
          <SplitSolLogo size={104} showWordmark />
          <Text style={styles.title}>SplitSOL</Text>
          <Text style={styles.tagline}>Split bills. Settle on-chain.</Text>
          <Text style={styles.subtitle}>
            Connect your Phantom wallet to unlock groups, expenses, and
            instant on-chain settlements.
          </Text>
        </View>

        <View style={styles.ctaBlock}>
          <Button
            title="Connect Phantom Wallet"
            onPress={() => router.push('/(onboarding)/connect' as any)}
            size="lg"
            style={styles.button}
          />
          <Text style={styles.helper}>
            Wallet connection is your onboarding. You will choose a display
            name next.
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg.primary,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: SPACING.xxl,
    paddingVertical: SPACING.xxxl,
  },
  hero: {
    alignItems: 'center',
    marginBottom: 56,
  },
  title: {
    color: COLORS.text.primary,
    fontSize: FONT.size.hero,
    fontWeight: FONT.weight.extrabold,
    marginTop: SPACING.xl,
    marginBottom: SPACING.md,
  },
  tagline: {
    color: COLORS.text.accent,
    fontSize: FONT.size.lg,
    fontWeight: FONT.weight.semibold,
    marginBottom: SPACING.md,
  },
  subtitle: {
    color: COLORS.text.secondary,
    fontSize: FONT.size.md,
    textAlign: 'center',
    lineHeight: 24,
    maxWidth: 280,
  },
  ctaBlock: {
    backgroundColor: COLORS.bg.secondary,
    borderRadius: RADIUS.xl,
    padding: SPACING.xl,
    gap: SPACING.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.05,
    shadowRadius: 18,
    elevation: 4,
  },
  button: {
    width: '100%',
  },
  helper: {
    color: COLORS.text.tertiary,
    fontSize: FONT.size.sm,
    textAlign: 'center',
    lineHeight: 20,
  },
});
