import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { ConnectButton } from '@/components/wallet/ConnectButton';
import { useAppStore } from '@/store/useAppStore';
import { AutoPayResult, buildAutoPayTransaction, getAutoPayPreviewLabel } from '@/utils/autopay';
import { COLORS, FONT, RADIUS, SOLANA, SPACING } from '@/utils/constants';
import { buildMemo, formatCurrency, truncateAddress } from '@/utils/formatters';
import { executeSettlement } from '@/utils/mwa';
import { addMemoToTransaction, getExplorerUrl, getRpcEndpoint } from '@/utils/solana';

type SettleStatus = 'idle' | 'preparing' | 'ready' | 'confirming' | 'failed';

const PREPARED_PAYMENT_MAX_AGE_MS = 30_000;

const formatInputAmount = (amount: number): string => {
  if (amount >= 100) return amount.toFixed(2);
  if (amount >= 1) return amount.toFixed(4);
  return amount.toFixed(6);
};

const getPaymentMethodLabel = (payment: AutoPayResult): string => {
  if (payment.method === 'direct_usdc') return 'Direct USDC';
  if (payment.isDevnetFallback) return 'Devnet SOL equivalent';
  return 'Jupiter swap';
};

export default function Settlement() {
  const { id, settlementId } = useLocalSearchParams<{
    id: string;
    settlementId: string;
  }>();
  const router = useRouter();
  const [status, setStatus] = useState<SettleStatus>('idle');
  const [preparedPayment, setPreparedPayment] = useState<AutoPayResult | null>(null);
  const [preparedAt, setPreparedAt] = useState<number | null>(null);
  const [isOffline, setIsOffline] = useState(false);

  const group = useAppStore((s) => s.getGroup(id));
  const walletAddress = useAppStore((s) => s.user.walletAddress);
  const getSimplifiedDebts = useAppStore((s) => s.getSimplifiedDebts);
  const addSettlement = useAppStore((s) => s.addSettlement);
  const addTransaction = useAppStore((s) => s.addTransaction);
  const addNotification = useAppStore((s) => s.addNotification);
  const updateContactLastTransaction = useAppStore(
    (s) => s.updateContactLastTransaction,
  );

  const [fromId, toId] = settlementId?.split('_') ?? [];
  const debts = useMemo(() => getSimplifiedDebts(id), [getSimplifiedDebts, id]);
  const debt = useMemo(
    () => debts.find((item) => item.from.id === fromId && item.to.id === toId),
    [debts, fromId, toId],
  );

  const currentUser = debt?.from;
  const recipient = debt?.to;
  const recipientWallet = recipient?.walletAddress;
  const isCurrentUserDebtor = Boolean(currentUser?.isCurrentUser);
  const networkLabel = SOLANA.CLUSTER === 'devnet' ? 'Solana Devnet' : 'Solana Mainnet';

  useEffect(() => {
    const checkConnectivity = async () => {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 5000);

        await fetch(getRpcEndpoint(), {
          method: 'HEAD',
          signal: controller.signal,
        });

        clearTimeout(timeout);
        setIsOffline(false);
      } catch {
        setIsOffline(true);
      }
    };

    checkConnectivity();
  }, [status]);

  useEffect(() => {
    setPreparedPayment(null);
    setPreparedAt(null);
    setStatus('idle');
  }, [debt?.amount, debt?.from.id, debt?.to.id, recipientWallet, walletAddress]);

  const buildPayment = useCallback(async () => {
    if (!walletAddress || !recipientWallet || !debt) {
      throw new Error('Missing payment data.');
    }

    return buildAutoPayTransaction(walletAddress, recipientWallet, debt.amount);
  }, [walletAddress, recipientWallet, debt]);

  const preparePayment = useCallback(async () => {
    const payment = await buildPayment();
    setPreparedPayment(payment);
    setPreparedAt(Date.now());
    return payment;
  }, [buildPayment]);

  const getFreshPreparedPayment = useCallback(async () => {
    const isFresh =
      preparedPayment &&
      preparedAt &&
      Date.now() - preparedAt < PREPARED_PAYMENT_MAX_AGE_MS;

    if (isFresh) {
      return preparedPayment;
    }

    return preparePayment();
  }, [preparedAt, preparedPayment, preparePayment]);

  const handlePreparePayment = useCallback(async () => {
    if (!walletAddress || !recipientWallet || !debt || !isCurrentUserDebtor) return;

    setStatus('preparing');

    try {
      await preparePayment();
      setStatus('ready');
    } catch (error: any) {
      setPreparedPayment(null);
      setPreparedAt(null);
      setStatus('failed');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);

      const message = error?.message ?? '';
      if (message.includes('No supported token balances')) {
        Alert.alert(
          'No Available Tokens',
          "We couldn't find enough spendable tokens in your wallet for this payment.",
        );
      } else if (message.includes('No Jupiter swap route')) {
        Alert.alert(
          'AutoPay Unavailable',
          'No swap route was found for the tokens currently in your wallet.',
        );
      } else {
        Alert.alert(
          'Payment Prep Failed',
          'We could not prepare the settlement. Please try again.',
        );
      }
    }
  }, [walletAddress, recipientWallet, debt, isCurrentUserDebtor, preparePayment]);

  const handleConfirmPayment = useCallback(async () => {
    if (
      !walletAddress ||
      !recipientWallet ||
      !debt ||
      !group ||
      !currentUser ||
      !recipient ||
      !isCurrentUserDebtor
    ) {
      return;
    }

    setStatus('confirming');

    try {
      const payment = await getFreshPreparedPayment();
      const memoText = buildMemo(
        group.name,
        currentUser.name,
        recipient.name,
        debt.amount,
      );
      const transaction = await addMemoToTransaction(payment.transaction, memoText);
      const { signature, confirmed } = await executeSettlement(transaction);

      if (!confirmed) {
        setStatus('failed');
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        return;
      }

      const settledAt = new Date().toISOString();

      addSettlement({
        groupId: group.id,
        from: currentUser.id,
        to: recipient.id,
        amount: debt.amount,
        status: 'confirmed',
        txSignature: signature,
        memo: memoText,
        settledAt,
        explorerUrl: getExplorerUrl(signature),
      });

      addTransaction({
        groupId: group.id,
        payerWallet: walletAddress,
        receiverWallet: recipientWallet,
        amountUSDC: debt.amount,
        status: 'confirmed',
        signature,
        timestamp: settledAt,
        swap:
          payment.method === 'swap'
            ? {
                inputToken: payment.inputToken,
                inputAmount: Number(payment.inputAmount.toFixed(6)),
                outputUSDC: payment.outputUSDC,
                route: payment.route,
                slippage: payment.slippage,
                fee: 0,
              }
            : null,
        chain: {
          networkFee: 0,
          confirmationStatus: 'confirmed',
          blockTime: null,
        },
      });

      if (recipient.contactId) {
        updateContactLastTransaction(recipient.contactId);
      }

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.replace(`/tx/${signature}?groupId=${group.id}`);
    } catch (error: any) {
      setStatus('failed');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);

      const message = error?.message ?? '';
      if (message.includes('User rejected') || message.includes('rejected')) {
        Alert.alert('Cancelled', 'You rejected the transaction in your wallet.');
      } else if (message.includes('insufficient') || message.includes('Insufficient')) {
        Alert.alert(
          'Insufficient Funds',
          "You don't have enough tokens or SOL for this settlement and network fees.",
        );
      } else if (message.includes('timeout') || message.includes('Timeout')) {
        Alert.alert(
          'Network Timeout',
          'The Solana network is busy. Please try again.',
        );
      } else {
        Alert.alert(
          'Settlement Failed',
          'Something went wrong while confirming the settlement. Please try again.',
        );
      }
    }
  }, [
    walletAddress,
    recipientWallet,
    debt,
    group,
    currentUser,
    recipient,
    isCurrentUserDebtor,
    getFreshPreparedPayment,
    addSettlement,
    addTransaction,
    updateContactLastTransaction,
    router,
  ]);

  const handleSendReminder = useCallback(() => {
    if (!group || !currentUser || !recipient) return;

    addNotification({
      type: 'reminder',
      relatedGroupId: group.id,
      relatedPaymentId: null,
      message: `Reminder: ${currentUser.name} owes ${formatCurrency(debt.amount)} to ${recipient.name} in ${group.name}.`,
    });
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    Alert.alert('Reminder Sent', 'A local reminder has been added to notifications.');
  }, [addNotification, currentUser, debt?.amount, group, recipient]);

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

  const isProcessing = status === 'preparing' || status === 'confirming';
  const canPrepare =
    !!walletAddress &&
    !!recipientWallet &&
    !isOffline &&
    !isProcessing &&
    isCurrentUserDebtor;
  const canConfirm = canPrepare && !!preparedPayment;
  const primaryAction = preparedPayment ? handleConfirmPayment : handlePreparePayment;

  const buttonTitle = isOffline
    ? 'No Connection'
    : status === 'preparing'
      ? 'Preparing Payment...'
      : status === 'confirming'
        ? 'Confirming on Solana...'
        : !isCurrentUserDebtor
          ? 'Only Debtor Can Pay'
          : !walletAddress
            ? 'Connect Wallet Above'
            : !recipientWallet
              ? 'Recipient Wallet Needed'
              : preparedPayment
                ? 'Confirm Payment'
                : 'Prepare Payment';

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
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

          <Text style={styles.summaryLabel}>Pay</Text>
          <Text style={styles.summaryAmount}>{formatCurrency(debt.amount)}</Text>
          <Text style={styles.summaryRecipient}>to {recipient.name}</Text>
          <Text style={styles.summaryMethod}>
            {preparedPayment
              ? getAutoPayPreviewLabel(preparedPayment)
              : 'Prepare payment to choose the best available route.'}
          </Text>
          {preparedPayment?.isDevnetFallback && (
            <Text style={styles.summaryNote}>
              Devnet mode: settling with SOL equivalent.
            </Text>
          )}
        </View>

        <Card style={styles.detailsCard}>
          <DetailRow label="Group" value={`${group.emoji} ${group.name}`} />
          <View style={styles.divider} />
          <DetailRow label="Amount (USDC)" value={formatCurrency(debt.amount)} />
          <View style={styles.divider} />
          <DetailRow label="Network" value={networkLabel} />
          {recipientWallet && (
            <>
              <View style={styles.divider} />
              <DetailRow
                label="Recipient Wallet"
                value={truncateAddress(recipientWallet, 6)}
              />
            </>
          )}
          {preparedPayment && (
            <>
              <View style={styles.divider} />
              <DetailRow
                label="Payment Method"
                value={getPaymentMethodLabel(preparedPayment)}
              />
              <View style={styles.divider} />
              <DetailRow
                label="Input Asset"
                value={`${formatInputAmount(preparedPayment.inputAmount)} ${preparedPayment.inputToken}`}
              />
              <View style={styles.divider} />
              <DetailRow label="Route" value={preparedPayment.route} />
              {preparedPayment.method === 'swap' &&
                !preparedPayment.isDevnetFallback && (
                  <>
                    <View style={styles.divider} />
                    <DetailRow
                      label="Slippage"
                      value={`${preparedPayment.slippage.toFixed(2)}%`}
                    />
                  </>
                )}
            </>
          )}
        </Card>

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

        {walletAddress && !recipientWallet && (
          <Card style={styles.promptCard}>
            <Text style={styles.promptIcon}>⚠️</Text>
            <Text style={styles.promptTitle}>Wallet address needed</Text>
            <Text style={styles.promptSub}>
              {recipient.name} hasn&apos;t added their Solana wallet address yet.
              Ask them to join the group or add their address manually.
            </Text>
          </Card>
        )}

        {!isCurrentUserDebtor && (
          <Card style={styles.promptCard}>
            <Text style={styles.promptIcon}>🧾</Text>
            <Text style={styles.promptTitle}>Only the debtor can settle</Text>
            <Text style={styles.promptSub}>
              This debt belongs to {currentUser.name}. Open a debt where you are
              the payer to continue.
            </Text>
            <View style={styles.promptAction}>
              <Button
                title="Send Reminder"
                onPress={handleSendReminder}
                variant="secondary"
              />
            </View>
          </Card>
        )}

        {isOffline && (
          <Card style={styles.promptCard}>
            <Text style={styles.promptIcon}>📡</Text>
            <Text style={styles.promptTitle}>You&apos;re offline</Text>
            <Text style={styles.promptSub}>
              A network connection is required to prepare and confirm this
              settlement.
            </Text>
          </Card>
        )}

        {status === 'failed' && (
          <Card style={styles.failedCard}>
            <Text style={styles.failedIcon}>✗</Text>
            <Text style={styles.failedTitle}>Payment Not Completed</Text>
            <Text style={styles.failedSub}>
              Review the details above and try again when you&apos;re ready.
            </Text>
          </Card>
        )}
      </ScrollView>

      <View style={styles.bottomBar}>
        <Button
          title={buttonTitle}
          onPress={primaryAction}
          variant={status === 'failed' ? 'danger' : 'primary'}
          size="lg"
          loading={isProcessing}
          disabled={preparedPayment ? !canConfirm : !canPrepare}
          style={styles.settleButton}
        />
      </View>

      {isProcessing && (
        <View style={styles.overlay}>
          <View style={styles.overlayBox}>
            <ActivityIndicator size="large" color={COLORS.bg.accentLight} />
            <Text style={styles.overlayTitle}>
              {status === 'preparing' ? 'Preparing Payment' : 'Confirming on Solana'}
            </Text>
            <Text style={styles.overlaySub}>
              {status === 'preparing'
                ? 'Checking balances and building the best route...'
                : 'Waiting for wallet approval and network confirmation...'}
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
  errorEmoji: {
    fontSize: 48,
    marginBottom: SPACING.lg,
  },
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
  summaryMethod: {
    color: COLORS.text.secondary,
    fontSize: FONT.size.sm,
    textAlign: 'center',
    marginTop: SPACING.md,
    lineHeight: 20,
    paddingHorizontal: SPACING.lg,
  },
  summaryNote: {
    color: COLORS.text.tertiary,
    fontSize: FONT.size.sm,
    textAlign: 'center',
    marginTop: SPACING.sm,
  },
  detailsCard: {
    marginBottom: SPACING.lg,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: SPACING.md,
    paddingVertical: SPACING.xs,
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
    width: 280,
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
