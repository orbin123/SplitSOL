import React from 'react';
import { Linking, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { APP, COLORS, FONT, SPACING } from '@/utils/constants';

export default function AboutScreen() {
  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.hero}>
        <Text style={styles.title}>About {APP.NAME}</Text>
        <Text style={styles.subtitle}>
          SplitSOL helps friends split shared expenses and settle them on Solana
          using wallet-based identity.
        </Text>
      </View>

      <Card style={styles.card}>
        <Text style={styles.cardTitle}>What SplitSOL Is</Text>
        <Text style={styles.cardBody}>
          SplitSOL is a lightweight group expense app for crypto-native payments.
          You can create groups, track who owes what, and settle balances with
          on-chain payments.
        </Text>
      </Card>

      <Card style={styles.card}>
        <Text style={styles.cardTitle}>Wallet-Based Auth</Text>
        <Text style={styles.cardBody}>
          Instead of usernames and passwords, SplitSOL uses your Solana wallet to
          identify you. Connecting Phantom authorizes the app to know your wallet
          address and request transaction approvals when you settle up.
        </Text>
      </Card>

      <Card style={styles.card}>
        <Text style={styles.cardTitle}>How Group Payments Work</Text>
        <Text style={styles.cardBody}>
          Expenses are tracked in USDC terms. When it&apos;s time to settle, SplitSOL
          can either pay directly from USDC or use AutoPay to swap another token
          into the required amount before completing the payment.
        </Text>
      </Card>

      <Card style={styles.card}>
        <Text style={styles.cardTitle}>Learn More</Text>
        <View style={styles.linkButtons}>
          <Button
            title="Solana"
            variant="secondary"
            onPress={() => Linking.openURL('https://solana.com')}
          />
          <Button
            title="Phantom"
            variant="secondary"
            onPress={() => Linking.openURL('https://phantom.app')}
          />
        </View>
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg.primary,
  },
  content: {
    padding: SPACING.xl,
    gap: SPACING.lg,
  },
  hero: {
    gap: SPACING.sm,
  },
  title: {
    color: COLORS.text.primary,
    fontSize: FONT.size.hero,
    fontWeight: FONT.weight.extrabold,
  },
  subtitle: {
    color: COLORS.text.secondary,
    fontSize: FONT.size.md,
    lineHeight: 22,
  },
  card: {
    gap: SPACING.sm,
  },
  cardTitle: {
    color: COLORS.text.primary,
    fontSize: FONT.size.md,
    fontWeight: FONT.weight.bold,
  },
  cardBody: {
    color: COLORS.text.secondary,
    fontSize: FONT.size.md,
    lineHeight: 22,
  },
  linkButtons: {
    flexDirection: 'row',
    gap: SPACING.md,
    marginTop: SPACING.sm,
  },
});
