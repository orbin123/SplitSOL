import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Alert,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useAppStore } from '@/store/useAppStore';
import { ConnectButton } from '@/components/wallet/ConnectButton';
import { Avatar } from '@/components/ui/Avatar';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import {
  formatCurrency,
  buildMemo,
  truncateAddress,
} from '@/utils/formatters';
import { buildSOLTransfer, addMemo, getExplorerUrl } from '@/utils/solana';
import { executeSettlement } from '@/utils/mwa';
import { COLORS, SPACING, FONT, RADIUS } from '@/utils/constants';

type SettleStatus = 'idle' | 'processing' | 'confirming' | 'failed';

// Devnet testing rate — replace with a price oracle for production
const MOCK_INR_TO_SOL = 0.001;

export default function Settlement() {
  const { id, settlementId } = useLocalSearchParams<{
    id: string;
    settlementId: string;
  }>();
  const router = useRouter();
  const [status, setStatus] = useState<SettleStatus>('idle');

  const group = useAppStore((s) => s.getGroup(id));
  const walletAddress = useAppStore((s) => s.walletAddress);
  const getSimplifiedDebts = useAppStore((s) => s.getSimplifiedDebts);
  const addSettlement = useAppStore((s) => s.addSettlement);

  const [fromId, toId] = settlementId?.split('_') ?? [];

  const debts = useMemo(() => getSimplifiedDebts(id), [getSimplifiedDebts, id]);

  const debt = useMemo(
    () => debts.find((d) => d.from.id === fromId && d.to.id === toId),
    [debts, fromId, toId],
  );

  const currentUser = debt?.from;
  const recipient = debt?.to;
  const amountInSOL = debt ? debt.amount * MOCK_INR_TO_SOL : 0;
  const recipientWallet = recipient?.walletAddress;

  const handleSettle = useCallback(async () => {
    if (
      !walletAddress ||
      !recipientWallet ||
      !debt ||
      !group ||
      !currentUser ||
      !recipient
    )
      return;

    setStatus('processing');

    try {
      let transaction = await buildSOLTransfer(
        walletAddress,
        recipientWallet,
        amountInSOL,
      );

      const memoText = buildMemo(
        group.name,
        currentUser.name,
        recipient.name,
        debt.amount,
      );
      transaction = addMemo(transaction, memoText);

      setStatus('confirming');

      const { signature, confirmed } = await executeSettlement(transaction);

      if (confirmed) {
        addSettlement({
          groupId: group.id,
          from: currentUser.id,
          to: recipient.id,
          amount: debt.amount,
          status: 'confirmed',
          txSignature: signature,
          memo: memoText,
          settledAt: new Date().toISOString(),
          explorerUrl: getExplorerUrl(signature),
        });

        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        router.replace(`/tx/${signature}?groupId=${group.id}`);
      } else {
        setStatus('failed');
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
    } catch (error: any) {
      setStatus('failed');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      const msg = error?.message ?? '';
      if (msg.includes('User rejected') || msg.includes('rejected')) {
        Alert.alert('Cancelled', 'You rejected the transaction in your wallet.');
      } else if (msg.includes('insufficient') || msg.includes('Insufficient')) {
        Alert.alert('Insufficient Funds', "You don't have enough SOL for this transaction and fees.");
      } else if (msg.includes('timeout') || msg.includes('Timeout')) {
        Alert.alert('Network Timeout', 'The Solana network is busy. Please try again.');
      } else {
        Alert.alert('Settlement Failed', 'Something went wrong. Please try again.');
      }
    }
  }, [
    walletAddress,
    recipientWallet,
    debt,
    group,
    currentUser,
    recipient,
    amountInSOL,
    addSettlement,
    router,
  ]);

  if (!group) {
    return (
      <View style={styles.container}>
        <View style={styles.centered}>
          <Text style={styles.errorEmoji}>😵</Text>
          <Text style={styles.errorTitle}>Group not found</Text>
          <Button
            title="Go Back"
            variant="secondary"
            onPress={() => router.back()}
            style={{ marginTop: SPACING.xl }}
          />
        </View>
      </View>
    );
  }

  if (!debt || !currentUser || !recipient) {
    return (
      <View style={styles.container}>
        <View style={styles.centered}>
          <Text style={styles.errorEmoji}>✅</Text>
          <Text style={styles.errorTitle}>No debt found</Text>
          <Text style={styles.errorSub}>
            This settlement may already be resolved.
          </Text>
          <Button
            title="Back to Group"
            variant="secondary"
            onPress={() => router.back()}
            style={{ marginTop: SPACING.xl }}
          />
        </View>
      </View>
    );
  }

  const isProcessing = status === 'processing' || status === 'confirming';
  const canSettle = !!walletAddress && !!recipientWallet && !isProcessing;

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Settlement Summary */}
        <View style={styles.summarySection}>
          <View style={styles.avatarRow}>
            <View style={styles.avatarWrap}>
              <Avatar name={currentUser.name} size={56} />
              <Text style={styles.avatarLabel} numberOfLines={1}>
                {currentUser.isCurrentUser ? 'You' : currentUser.name}
              </Text>
            </View>

            <View style={styles.arrowContainer}>
              <View style={styles.arrowLine} />
              <Text style={styles.arrowHead}>›</Text>
            </View>

            <View style={styles.avatarWrap}>
              <Avatar name={recipient.name} size={56} />
              <Text style={styles.avatarLabel} numberOfLines={1}>
                {recipient.name}
              </Text>
            </View>
          </View>

          <Text style={styles.summaryLabel}>
            {currentUser.isCurrentUser ? 'You owe' : `${currentUser.name} owes`}
          </Text>
          <Text style={styles.summaryAmount}>
            {formatCurrency(debt.amount)}
          </Text>
          <Text style={styles.summaryRecipient}>to {recipient.name}</Text>
        </View>

        {/* Transaction Details */}
        <Card style={styles.detailsCard}>
          <DetailRow label="Group" value={`${group.emoji} ${group.name}`} />
          <View style={styles.divider} />
          <DetailRow
            label="Amount (SOL)"
            value={`${amountInSOL.toFixed(4)} SOL`}
          />
          <View style={styles.divider} />
          <DetailRow label="Network" value="Solana Devnet" />
          {recipientWallet && (
            <>
              <View style={styles.divider} />
              <DetailRow
                label="Recipient Wallet"
                value={truncateAddress(recipientWallet, 6)}
              />
            </>
          )}
        </Card>

        {/* Wallet not connected */}
        {!walletAddress && (
          <Card style={styles.promptCard}>
            <Text style={styles.promptIcon}>🔗</Text>
            <Text style={styles.promptTitle}>Connect your wallet</Text>
            <Text style={styles.promptSub}>
              You need a Solana wallet to settle on-chain.
            </Text>
            <View style={styles.promptAction}>
              <ConnectButton />
            </View>
          </Card>
        )}

        {/* Recipient wallet missing */}
        {walletAddress && !recipientWallet && (
          <Card style={styles.promptCard}>
            <Text style={styles.promptIcon}>⚠️</Text>
            <Text style={styles.promptTitle}>Wallet address needed</Text>
            <Text style={styles.promptSub}>
              {recipient.name} hasn't added their Solana wallet address yet. Ask
              them to join the group or add their address manually.
            </Text>
          </Card>
        )}

        {/* Failure feedback */}
        {status === 'failed' && (
          <Card style={styles.failedCard}>
            <Text style={styles.failedIcon}>✗</Text>
            <Text style={styles.failedTitle}>Transaction Failed</Text>
            <Text style={styles.failedSub}>
              The transaction was rejected or didn't confirm on the network. You
              can try again below.
            </Text>
          </Card>
        )}
      </ScrollView>

      {/* Bottom Action Bar */}
      <View style={styles.bottomBar}>
        <Button
          title={
            status === 'processing'
              ? 'Building Transaction...'
              : status === 'confirming'
                ? 'Confirming on Solana...'
                : status === 'failed'
                  ? 'Retry Settlement'
                  : 'Settle Now'
          }
          onPress={handleSettle}
          variant={status === 'failed' ? 'danger' : 'primary'}
          size="lg"
          loading={isProcessing}
          disabled={!canSettle}
          style={styles.settleButton}
        />
      </View>

      {/* Processing Overlay */}
      {isProcessing && (
        <View style={styles.overlay}>
          <View style={styles.overlayBox}>
            <ActivityIndicator size="large" color={COLORS.bg.accentLight} />
            <Text style={styles.overlayTitle}>
              {status === 'processing'
                ? 'Building Transaction'
                : 'Confirming on Solana'}
            </Text>
            <Text style={styles.overlaySub}>
              {status === 'processing'
                ? 'Preparing your settlement...'
                : 'Waiting for network confirmation...'}
            </Text>
          </View>
        </View>
      )}
    </View>
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
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SPACING.xxxl,
  },
  errorEmoji: { fontSize: 48, marginBottom: SPACING.lg },
  errorTitle: {
    color: COLORS.text.primary,
    fontSize: FONT.size.xl,
    fontWeight: FONT.weight.bold,
    textAlign: 'center',
  },
  errorSub: {
    color: COLORS.text.secondary,
    fontSize: FONT.size.md,
    textAlign: 'center',
    marginTop: SPACING.sm,
  },

  scrollContent: {
    padding: SPACING.lg,
    paddingBottom: 120,
  },

  // Summary
  summarySection: {
    alignItems: 'center',
    paddingVertical: SPACING.xxl,
  },
  avatarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.xxl,
  },
  avatarWrap: {
    alignItems: 'center',
    width: 80,
  },
  avatarLabel: {
    color: COLORS.text.secondary,
    fontSize: FONT.size.xs,
    fontWeight: FONT.weight.medium,
    marginTop: SPACING.sm,
    textAlign: 'center',
  },
  arrowContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: SPACING.lg,
    width: 48,
  },
  arrowLine: {
    flex: 1,
    height: 2,
    backgroundColor: COLORS.bg.tertiary,
    borderRadius: 1,
  },
  arrowHead: {
    color: COLORS.text.accent,
    fontSize: 24,
    fontWeight: FONT.weight.bold,
    marginLeft: -2,
  },
  summaryLabel: {
    color: COLORS.text.secondary,
    fontSize: FONT.size.md,
    fontWeight: FONT.weight.medium,
  },
  summaryAmount: {
    color: COLORS.text.primary,
    fontSize: FONT.size.hero,
    fontWeight: FONT.weight.extrabold,
    marginTop: SPACING.xs,
  },
  summaryRecipient: {
    color: COLORS.text.accent,
    fontSize: FONT.size.lg,
    fontWeight: FONT.weight.semibold,
    marginTop: SPACING.xs,
  },

  // Details Card
  detailsCard: {
    marginBottom: SPACING.lg,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SPACING.xs,
  },
  detailLabel: {
    color: COLORS.text.secondary,
    fontSize: FONT.size.sm,
    fontWeight: FONT.weight.medium,
  },
  detailValue: {
    color: COLORS.text.primary,
    fontSize: FONT.size.sm,
    fontWeight: FONT.weight.semibold,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.border.default,
    marginVertical: SPACING.sm,
  },

  // Prompt Cards (wallet connect / missing wallet)
  promptCard: {
    alignItems: 'center',
    paddingVertical: SPACING.xxl,
    marginBottom: SPACING.lg,
  },
  promptIcon: {
    fontSize: 32,
    marginBottom: SPACING.md,
  },
  promptTitle: {
    color: COLORS.text.primary,
    fontSize: FONT.size.lg,
    fontWeight: FONT.weight.bold,
    textAlign: 'center',
  },
  promptSub: {
    color: COLORS.text.secondary,
    fontSize: FONT.size.sm,
    textAlign: 'center',
    marginTop: SPACING.sm,
    lineHeight: 20,
    paddingHorizontal: SPACING.md,
  },
  promptAction: {
    marginTop: SPACING.xl,
  },

  // Failed Card
  failedCard: {
    alignItems: 'center',
    paddingVertical: SPACING.xl,
    borderColor: COLORS.bg.danger,
    marginBottom: SPACING.lg,
  },
  failedIcon: {
    color: COLORS.text.danger,
    fontSize: 28,
    fontWeight: FONT.weight.bold,
    marginBottom: SPACING.sm,
  },
  failedTitle: {
    color: COLORS.text.danger,
    fontSize: FONT.size.lg,
    fontWeight: FONT.weight.bold,
  },
  failedSub: {
    color: COLORS.text.secondary,
    fontSize: FONT.size.sm,
    textAlign: 'center',
    marginTop: SPACING.sm,
    lineHeight: 20,
    paddingHorizontal: SPACING.md,
  },

  // Bottom Bar
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.lg,
    paddingBottom: SPACING.xxxl,
    backgroundColor: COLORS.bg.primary,
    borderTopWidth: 1,
    borderTopColor: COLORS.border.default,
  },
  settleButton: {
    width: '100%',
    paddingVertical: SPACING.lg,
    borderRadius: RADIUS.lg,
  },

  // Overlay
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  overlayBox: {
    backgroundColor: COLORS.bg.secondary,
    borderRadius: RADIUS.xl,
    padding: SPACING.xxxl,
    alignItems: 'center',
    width: 260,
    borderWidth: 1,
    borderColor: COLORS.border.default,
  },
  overlayTitle: {
    color: COLORS.text.primary,
    fontSize: FONT.size.lg,
    fontWeight: FONT.weight.bold,
    marginTop: SPACING.xl,
    textAlign: 'center',
  },
  overlaySub: {
    color: COLORS.text.secondary,
    fontSize: FONT.size.sm,
    marginTop: SPACING.sm,
    textAlign: 'center',
  },
});
