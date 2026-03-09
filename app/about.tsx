import React from 'react';
import {
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Card } from '@/components/ui/Card';
import { SplitSolLogo } from '@/components/branding/SplitSolLogo';
import { APP, COLORS, FONT, SPACING } from '@/utils/constants';

const FEATURES = [
  {
    title: 'Wallet Authentication',
    description: 'Instead of usernames and passwords, SplitSOL uses your Solana wallet to identify you.',
    icon: 'shield-checkmark-outline' as const,
  },
  {
    title: 'On-Chain Settlement',
    description: 'Settle balances directly on Solana. Payments are recorded on-chain for transparency.',
    icon: 'link-outline' as const,
  },
  {
    title: 'Group Payments',
    description: 'Create groups, track who owes what, and settle balances with on-chain payments.',
    icon: 'people-outline' as const,
  },
  {
    title: 'AutoPay',
    description: 'Swap other tokens into USDC before completing payments when needed.',
    icon: 'swap-horizontal-outline' as const,
  },
];

const LINKS = [
  { label: 'Solana Explorer', url: 'https://explorer.solana.com' },
  { label: 'Solflare Wallet', url: 'https://solflare.com' },
  { label: 'SplitSOL GitHub', url: 'https://github.com' },
];

export default function AboutScreen() {
  const insets = useSafeAreaInsets();

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[
        styles.content,
        { paddingTop: insets.top + SPACING.lg + 56, paddingBottom: SPACING.xxxl },
      ]}
      showsVerticalScrollIndicator={false}
    >
      <Card style={styles.appCard}>
        <SplitSolLogo size={64} />
        <Text style={styles.appName}>{APP.NAME}</Text>
        <Text style={styles.tagline}>Split expenses. Settle on-chain.</Text>
        <Text style={styles.version}>v{APP.VERSION}</Text>
      </Card>

      <Card style={styles.featuresCard}>
        {FEATURES.map((feature, idx) => (
          <View key={feature.title}>
            {idx > 0 && <View style={styles.divider} />}
            <View style={styles.featureRow}>
              <View style={styles.featureIconWrap}>
                <Ionicons
                  name={feature.icon}
                  size={22}
                  color={COLORS.text.accent}
                />
              </View>
              <View style={styles.featureCopy}>
                <Text style={styles.featureTitle}>{feature.title}</Text>
                <Text style={styles.featureDesc}>{feature.description}</Text>
              </View>
            </View>
          </View>
        ))}
      </Card>

      <Card style={styles.linksCard}>
        {LINKS.map((link) => (
          <TouchableOpacity
            key={link.label}
            style={styles.linkRow}
            onPress={() => Linking.openURL(link.url)}
            activeOpacity={0.75}
          >
            <Text style={styles.linkLabel}>{link.label}</Text>
            <Ionicons
              name="open-outline"
              size={18}
              color={COLORS.text.accent}
            />
          </TouchableOpacity>
        ))}
      </Card>

      <Text style={styles.footer}>
        Built for Solana Mobile Monolith Hackathon
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  content: {
    paddingHorizontal: SPACING.xl,
    gap: SPACING.lg,
  },
  appCard: {
    alignItems: 'center',
    paddingVertical: SPACING.xxl,
  },
  appName: {
    color: COLORS.text.primary,
    fontSize: 24,
    fontWeight: FONT.weight.bold,
    marginTop: SPACING.lg,
  },
  tagline: {
    color: COLORS.text.secondary,
    fontSize: 14,
    marginTop: SPACING.xs,
  },
  version: {
    color: COLORS.text.secondary,
    fontSize: 12,
    marginTop: SPACING.xs,
  },
  featuresCard: {
    paddingVertical: 0,
    paddingHorizontal: SPACING.lg,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: SPACING.md,
    paddingVertical: SPACING.lg,
  },
  featureIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.bg.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureCopy: {
    flex: 1,
  },
  featureTitle: {
    color: COLORS.text.primary,
    fontSize: FONT.size.md,
    fontWeight: FONT.weight.bold,
  },
  featureDesc: {
    color: COLORS.text.secondary,
    fontSize: FONT.size.sm,
    marginTop: 4,
    lineHeight: 20,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.border.default,
    marginLeft: 40 + SPACING.md,
  },
  linksCard: {
    paddingVertical: SPACING.sm,
  },
  linkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: SPACING.lg,
    paddingHorizontal: SPACING.lg,
  },
  linkLabel: {
    color: COLORS.text.accent,
    fontSize: FONT.size.md,
    fontWeight: FONT.weight.semibold,
  },
  footer: {
    color: COLORS.text.secondary,
    fontSize: 11,
    textAlign: 'center',
    marginTop: SPACING.lg,
  },
});
