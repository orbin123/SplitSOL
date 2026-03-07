import React, { useMemo, useState } from 'react';
import {
  Alert,
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { useAppStore } from '@/store/useAppStore';
import { COLORS, FONT, RADIUS, SPACING } from '@/utils/constants';
import { formatCurrency, truncateAddress } from '@/utils/formatters';
import { getExplorerUrl } from '@/utils/solana';
import { resolveTransactionDetails } from '@/utils/transactions';

const formatDateTime = (value: string) =>
  new Date(value).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });

export default function TransactionDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [showTechnicalDetails, setShowTechnicalDetails] = useState(false);

  const user = useAppStore((s) => s.user);
  const groups = useAppStore((s) => s.groups);
  const transactions = useAppStore((s) => s.transactions);

  const transaction = transactions.find((item) => item.id === id);
  const resolved = useMemo(
    () =>
      transaction ? resolveTransactionDetails(transaction, groups, user) : null,
    [groups, transaction, user],
  );

  if (!transaction || !resolved) {
    return (
      <View style={styles.missingWrap}>
        <EmptyState
          emoji="🧾"
          title="Transaction not found"
          subtitle="This transaction may have been removed from local history."
          action={
            <Button
              title="Back to Transactions"
              onPress={() => router.replace('/(tabs)/activity')}
            />
          }
        />
      </View>
    );
  }

  const openExplorer = () => {
    if (!transaction.signature) return;
    Linking.openURL(getExplorerUrl(transaction.signature));
  };

  const copySignature = async () => {
    if (!transaction.signature) return;
    await Clipboard.setStringAsync(transaction.signature);
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    Alert.alert('Copied', 'Transaction signature copied to clipboard.');
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <Card style={styles.heroCard}>
        <Text style={styles.heroLabel}>Transaction</Text>
        <Text style={styles.heroTitle}>{resolved.title}</Text>
        {resolved.swapSummary && (
          <Text style={styles.heroSub}>{resolved.swapSummary}</Text>
        )}
      </Card>

      <Card>
        <DetailRow label="Amount" value={formatCurrency(transaction.amountUSDC)} />
        <View style={styles.divider} />
        <DetailRow label="Payer" value={resolved.payerName} />
        <View style={styles.divider} />
        <DetailRow label="Receiver" value={resolved.receiverName} />
        <View style={styles.divider} />
        <DetailRow
          label="Group"
          value={`${resolved.groupEmoji} ${resolved.groupName}`}
        />
        <View style={styles.divider} />
        <DetailRow label="Date" value={formatDateTime(transaction.timestamp)} />
        <View style={styles.divider} />
        <DetailRow
          label="Status"
          value={transaction.status.charAt(0).toUpperCase() + transaction.status.slice(1)}
        />
        {transaction.swap && (
          <>
            <View style={styles.divider} />
            <DetailRow
              label="Swap Input"
              value={`${transaction.swap.inputAmount.toFixed(2)} ${transaction.swap.inputToken}`}
            />
            <View style={styles.divider} />
            <DetailRow
              label="Swap Output"
              value={formatCurrency(transaction.swap.outputUSDC)}
            />
          </>
        )}
      </Card>

      <Card style={styles.techCard}>
        <TouchableOpacity
          style={styles.techHeader}
          onPress={() => setShowTechnicalDetails((value) => !value)}
          activeOpacity={0.75}
        >
          <Text style={styles.techTitle}>Technical Details</Text>
          <Ionicons
            name={showTechnicalDetails ? 'chevron-up' : 'chevron-down'}
            size={20}
            color={COLORS.text.secondary}
          />
        </TouchableOpacity>

        {showTechnicalDetails && (
          <View style={styles.techBody}>
            <DetailRow
              label="Signature"
              value={
                transaction.signature
                  ? truncateAddress(transaction.signature, 10)
                  : 'Unavailable'
              }
            />
            {transaction.signature && (
              <TouchableOpacity
                style={styles.copyButton}
                onPress={() => {
                  void copySignature();
                }}
                activeOpacity={0.75}
              >
                <Text style={styles.copyButtonText}>Copy signature</Text>
              </TouchableOpacity>
            )}
            <View style={styles.divider} />
            <DetailRow
              label="Network Fee"
              value={`${transaction.chain?.networkFee ?? 0} SOL`}
            />
            <View style={styles.divider} />
            <DetailRow
              label="Confirmation"
              value={transaction.chain?.confirmationStatus ?? 'Unknown'}
            />
            <View style={styles.divider} />
            <DetailRow
              label="Block Time"
              value={
                transaction.chain?.blockTime
                  ? new Date(transaction.chain.blockTime * 1000).toLocaleString()
                  : 'Unavailable'
              }
            />
            {transaction.swap && (
              <>
                <View style={styles.divider} />
                <DetailRow label="Swap Route" value={transaction.swap.route} />
                <View style={styles.divider} />
                <DetailRow
                  label="Slippage"
                  value={`${transaction.swap.slippage.toFixed(2)}%`}
                />
                <View style={styles.divider} />
                <DetailRow
                  label="Swap Fees"
                  value={`${transaction.swap.fee.toFixed(2)} USDC`}
                />
              </>
            )}
            {transaction.signature && (
              <Button
                title="View on Solana Explorer"
                onPress={openExplorer}
                variant="secondary"
                style={styles.explorerButton}
              />
            )}
          </View>
        )}
      </Card>
    </ScrollView>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.detailRow}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg.primary,
  },
  content: {
    padding: SPACING.lg,
    gap: SPACING.lg,
  },
  missingWrap: {
    flex: 1,
    backgroundColor: COLORS.bg.primary,
  },
  heroCard: {
    gap: SPACING.sm,
  },
  heroLabel: {
    color: COLORS.text.tertiary,
    fontSize: FONT.size.xs,
    fontWeight: FONT.weight.semibold,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  heroTitle: {
    color: COLORS.text.primary,
    fontSize: FONT.size.xl,
    fontWeight: FONT.weight.bold,
  },
  heroSub: {
    color: COLORS.text.secondary,
    fontSize: FONT.size.sm,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: SPACING.md,
  },
  detailLabel: {
    color: COLORS.text.secondary,
    fontSize: FONT.size.sm,
    fontWeight: FONT.weight.medium,
    flex: 1,
  },
  detailValue: {
    color: COLORS.text.primary,
    fontSize: FONT.size.sm,
    fontWeight: FONT.weight.semibold,
    flex: 1,
    textAlign: 'right',
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.border.default,
    marginVertical: SPACING.sm,
  },
  techCard: {
    gap: SPACING.md,
  },
  techHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  techTitle: {
    color: COLORS.text.primary,
    fontSize: FONT.size.md,
    fontWeight: FONT.weight.bold,
  },
  techBody: {
    marginTop: SPACING.sm,
  },
  copyButton: {
    alignSelf: 'flex-end',
    marginTop: SPACING.sm,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.bg.accentSoft,
  },
  copyButtonText: {
    color: COLORS.text.accent,
    fontSize: FONT.size.sm,
    fontWeight: FONT.weight.semibold,
  },
  explorerButton: {
    marginTop: SPACING.lg,
  },
});
