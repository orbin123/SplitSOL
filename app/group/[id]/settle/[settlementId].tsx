import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  PanResponder,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Avatar } from '@/components/ui/Avatar';
import { useAppStore } from '@/store/useAppStore';
import { showAlert } from '@/store/useAlertStore';
import { COLORS, FONT, SPACING, SOLANA } from '@/utils/constants';
import { buildMemo, formatCurrency, truncateAddress } from '@/utils/formatters';
import { getSOLBalanceWithRetry, getUSDCBalance } from '@/utils/solana';
import {
  buildSettlementTransaction,
  getJupiterSolPrice,
  type AutoPayMethod,
} from '@/utils/autopay';
import { executeSettlement } from '@/utils/mwa';

type PayStatus = 'idle' | 'building' | 'signing' | 'error';

const SLIDER_WIDTH = 300;
const THUMB_SIZE = 56;
const SLIDE_THRESHOLD = SLIDER_WIDTH - THUMB_SIZE - 10;

export default function Settlement() {
  const { id, settlementId } = useLocalSearchParams<{
    id: string;
    settlementId: string;
  }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const group = useAppStore((s) => s.getGroup(id));
  const walletAddress = useAppStore((s) => s.user.walletAddress);
  const getSimplifiedDebts = useAppStore((s) => s.getSimplifiedDebts);
  const addSettlement = useAppStore((s) => s.addSettlement);
  const addTransaction = useAppStore((s) => s.addTransaction);

  const [fromId, toId] = settlementId?.split('_') ?? [];
  const debts = useMemo(() => getSimplifiedDebts(id), [getSimplifiedDebts, id]);
  const debt = useMemo(
    () => debts.find((item) => item.from.id === fromId && item.to.id === toId),
    [debts, fromId, toId],
  );

  const currentUser = debt?.from;
  const recipient = debt?.to;
  const recipientWallet = recipient?.walletAddress;

  // Balances & conversion
  const [usdcBalance, setUsdcBalance] = useState(0);
  const [solBalance, setSolBalance] = useState(0);
  const [solUsdcRate, setSolUsdcRate] = useState<number>(1 / SOLANA.DEVNET_USDC_TO_SOL);

  useEffect(() => {
    if (!walletAddress) return;
    Promise.all([
      getSOLBalanceWithRetry(walletAddress).catch(() => null),
      getUSDCBalance(walletAddress).catch(() => null),
      getJupiterSolPrice(),
    ]).then(([sol, usdc, livePrice]) => {
      if (sol !== null) setSolBalance(sol);
      if (usdc !== null) setUsdcBalance(usdc);
      if (livePrice !== null) setSolUsdcRate(livePrice);
    });
  }, [walletAddress]);

  // Detect payment method from balances
  const hasEnoughUsdc = debt ? usdcBalance >= debt.amount : false;
  const estimatedSOL = debt ? debt.amount / solUsdcRate : 0;

  // Payment flow state
  const [payStatus, setPayStatus] = useState<PayStatus>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const payStatusRef = useRef<PayStatus>('idle');

  // Keep ref in sync for panResponder access without re-creating it
  useEffect(() => {
    payStatusRef.current = payStatus;
  }, [payStatus]);

  // Slide-to-pay animation
  const slideAnim = useRef(new Animated.Value(0)).current;
  const chevronAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(chevronAnim, { toValue: 1, duration: 1200, useNativeDriver: true }),
        Animated.timing(chevronAnim, { toValue: 0, duration: 1200, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [chevronAnim]);

  const resetSlider = useCallback(() => {
    Animated.spring(slideAnim, { toValue: 0, friction: 5, useNativeDriver: true }).start();
  }, [slideAnim]);

  const handlePaymentComplete = useCallback(async () => {
    if (!group || !currentUser || !recipient || !debt) return;
    if (payStatusRef.current !== 'idle') return;

    if (!recipientWallet) {
      showAlert('Cannot Pay', 'This member has no wallet address linked. Ask them to share their QR code.');
      resetSlider();
      return;
    }
    if (!walletAddress) {
      showAlert('Not Connected', 'Connect your wallet to make a payment.');
      resetSlider();
      return;
    }

    const memo = buildMemo(group.name, currentUser.name, recipient.name, debt.amount);

    setPayStatus('building');
    payStatusRef.current = 'building';

    try {
      // Build the optimal transaction (USDC direct, SOL equivalent, or Jupiter swap)
      const txResult = await buildSettlementTransaction(
        {
          fromWallet: walletAddress,
          toWallet: recipientWallet,
          amountUSDC: debt.amount,
          cluster: SOLANA.CLUSTER,
        },
        memo,
      );

      setPayStatus('signing');
      payStatusRef.current = 'signing';

      // Open Solflare for signing
      const { signature, confirmed } = await executeSettlement(txResult.transaction);

      const settledAt = new Date().toISOString();

      addSettlement({
        groupId: group.id,
        from: currentUser.id,
        to: recipient.id,
        amount: debt.amount,
        status: 'confirmed',
        txSignature: signature,
        paymentMethod: txResult.paymentMethod,
        confirmedAt: settledAt,
        memo,
        settledAt,
        fromWallet: walletAddress,
        toWallet: recipientWallet,
      });

      addTransaction({
        groupId: group.id,
        payerWallet: walletAddress,
        receiverWallet: recipientWallet,
        amountUSDC: debt.amount,
        status: confirmed ? 'confirmed' : 'pending',
        signature,
        timestamp: settledAt,
        memo,
        swap: txResult.paymentMethod !== 'USDC'
          ? {
            inputToken: 'SOL',
            inputAmount: txResult.details.amountSOL ?? 0,
            outputUSDC: debt.amount,
            route: txResult.paymentMethod === 'JUPITER_SWAP'
              ? 'Jupiter v6 (ExactOut)'
              : `SOL Equivalent (~${txResult.details.solUsdcRate?.toFixed(0)} USDC/SOL)`,
            slippage: 0.5,
            fee: 0,
          }
          : null,
        chain: {
          networkFee: SOLANA.NETWORK_FEE,
          confirmationStatus: confirmed ? 'confirmed' : 'pending',
          blockTime: Math.floor(Date.now() / 1000),
        },
      });

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setPayStatus('idle');
      payStatusRef.current = 'idle';

      router.replace(
        `/settle/success?txId=${signature}&groupId=${group.id}&amount=${debt.amount}&from=${encodeURIComponent(currentUser.name)}&to=${encodeURIComponent(recipient.name)}&groupName=${encodeURIComponent(group.name)}&groupEmoji=${encodeURIComponent(group.emoji)}&method=${txResult.paymentMethod}&recipientWallet=${encodeURIComponent(recipientWallet)}&settledAt=${encodeURIComponent(settledAt)}&memo=${encodeURIComponent(memo)}` as any,
      );
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Payment failed. Please try again.';
      setErrorMsg(msg);
      setPayStatus('error');
      payStatusRef.current = 'error';
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      resetSlider();
    }
  }, [
    group, currentUser, recipient, debt, walletAddress, recipientWallet,
    addSettlement, addTransaction, router, resetSlider,
  ]);

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => payStatusRef.current === 'idle',
        onMoveShouldSetPanResponder: () => payStatusRef.current === 'idle',
        onPanResponderGrant: () => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        },
        onPanResponderMove: (_, gestureState) => {
          const value = Math.max(0, Math.min(gestureState.dx, SLIDE_THRESHOLD));
          slideAnim.setValue(value);
        },
        onPanResponderRelease: (_, gestureState) => {
          if (gestureState.dx >= SLIDE_THRESHOLD) {
            Animated.timing(slideAnim, {
              toValue: SLIDE_THRESHOLD,
              duration: 100,
              useNativeDriver: true,
            }).start(() => {
              void handlePaymentComplete();
            });
          } else {
            resetSlider();
          }
        },
      }),
    [slideAnim, handlePaymentComplete, resetSlider],
  );

  if (!group || !debt || !currentUser || !recipient) {
    return (
      <LinearGradient
        colors={['#FDCBEE', '#E7D4FC', '#C1E6F5']}
        style={styles.container}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={[styles.centered, { paddingTop: insets.top }]}>
          <Text style={styles.errorEmoji}>✅</Text>
          <Text style={styles.errorTitle}>No debt found</Text>
          <Text style={styles.errorSub}>
            This settlement may already be resolved.
          </Text>
          <TouchableOpacity
            style={styles.goBackBtn}
            onPress={() => router.back()}
            activeOpacity={0.7}
          >
            <Text style={styles.goBackBtnText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>
    );
  }

  const canPay = !!recipientWallet && !!walletAddress;

  // Determine what the payment method card shows based on current balances
  const detectedMethod: AutoPayMethod = hasEnoughUsdc
    ? 'USDC'
    : SOLANA.CLUSTER === 'devnet'
      ? 'SOL_EQUIVALENT'
      : 'JUPITER_SWAP';

  return (
    <LinearGradient
      colors={['#FDCBEE', '#E7D4FC', '#C1E6F5']}
      style={styles.container}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    >
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: insets.top + SPACING.lg },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
            activeOpacity={0.7}
          >
            <Ionicons name="arrow-back" size={24} color="#111827" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Settle Up</Text>
        </View>

        {/* Transfer Summary Card */}
        <View style={styles.summaryCard}>
          <View style={styles.avatarRow}>
            <View style={styles.avatarWrap}>
              <Avatar name={currentUser.name} size={60} color="#C4B5FD" />
              <Text style={styles.avatarLabel}>{currentUser.name}</Text>
            </View>
            <View style={styles.arrowWrap}>
              <Ionicons name="arrow-forward" size={22} color="#9CA3AF" />
            </View>
            <View style={styles.avatarWrap}>
              <Avatar name={recipient.name} size={60} color="#FBCFE8" />
              <Text style={styles.avatarLabel}>{recipient.name}</Text>
            </View>
          </View>
          <View style={styles.amountRow}>
            <Text style={styles.amountValue}>{debt.amount.toFixed(2)}</Text>
            <Text style={styles.amountCurrency}>USDC</Text>
          </View>
          <Text style={styles.fromGroup}>
            from {group.emoji} {group.name}
          </Text>
        </View>

        {/* Payment Method Detection Card */}
        <View style={styles.paymentMethodHeader}>
          <Text style={styles.paymentMethodTitle}>Payment Method</Text>
          <View style={styles.devnetBadge}>
            <Text style={styles.devnetText}>
              {SOLANA.CLUSTER === 'devnet' ? 'Devnet' : 'Mainnet'}
            </Text>
          </View>
        </View>

        {detectedMethod === 'USDC' ? (
          <View style={[styles.methodCard, styles.methodCardGreen]}>
            <View style={styles.methodIconCircle}>
              <Ionicons name="checkmark-circle" size={28} color="#10B981" />
            </View>
            <View style={styles.methodInfo}>
              <Text style={styles.methodTitle}>Direct USDC Transfer</Text>
              <Text style={styles.methodSub}>
                Balance: {usdcBalance.toFixed(2)} USDC · paying {formatCurrency(debt.amount)}
              </Text>
            </View>
          </View>
        ) : detectedMethod === 'SOL_EQUIVALENT' ? (
          <View style={[styles.methodCard, styles.methodCardPurple]}>
            <View style={styles.methodIconCircleAlt}>
              <Ionicons name="swap-horizontal" size={24} color="#7C3AED" />
            </View>
            <View style={styles.methodInfo}>
              <Text style={styles.methodTitle}>AutoPay: SOL Equivalent</Text>
              <Text style={styles.methodSub}>
                Sending ≈{estimatedSOL.toFixed(6)} SOL (≈{debt.amount.toFixed(2)} USDC)
              </Text>
              <Text style={styles.methodNote}>
                Devnet demo · rate ≈ {solUsdcRate.toFixed(0)} USDC/SOL
              </Text>
            </View>
          </View>
        ) : (
          <View style={[styles.methodCard, styles.methodCardPurple]}>
            <View style={styles.methodIconCircleAlt}>
              <Ionicons name="swap-horizontal" size={24} color="#7C3AED" />
            </View>
            <View style={styles.methodInfo}>
              <Text style={styles.methodTitle}>AutoPay: SOL → USDC</Text>
              <Text style={styles.methodSub}>
                Swapping SOL via Jupiter · paying {formatCurrency(debt.amount)}
              </Text>
              <Text style={styles.methodNote}>
                Best route selected automatically
              </Text>
            </View>
          </View>
        )}

        {/* Transaction Details */}
        <View style={styles.txDetailsCard}>
          <View style={styles.txDetailsHeader}>
            <Ionicons name="receipt-outline" size={20} color="#7C3AED" />
            <Text style={styles.txDetailsTitle}>Transaction Details</Text>
          </View>

          <View style={styles.txDetailRow}>
            <Text style={styles.txDetailLabel}>Memo</Text>
            <Text style={styles.txDetailValue} numberOfLines={2}>
              {buildMemo(group.name, currentUser.name, recipient.name, debt.amount)}
            </Text>
          </View>

          <View style={styles.txDetailRow}>
            <Text style={styles.txDetailLabel}>Network fee</Text>
            <Text style={styles.txDetailValue}>~{SOLANA.NETWORK_FEE} SOL</Text>
          </View>

          <View style={styles.txDetailRow}>
            <Text style={styles.txDetailLabel}>Recipient wallet</Text>
            <Text style={styles.txDetailValue}>
              {recipientWallet ? truncateAddress(recipientWallet, 4) : 'Not linked'}
            </Text>
          </View>

          {!recipientWallet && (
            <View style={styles.noWalletBanner}>
              <Ionicons name="alert-circle-outline" size={15} color="#F59E0B" />
              <Text style={styles.noWalletText}>
                {recipient.name} has no wallet address. Payment cannot proceed.
              </Text>
            </View>
          )}
        </View>

        {/* Error card */}
        {payStatus === 'error' && (
          <View style={styles.errorCard}>
            <Ionicons name="alert-circle" size={20} color="#EF4444" />
            <Text style={styles.errorCardText} numberOfLines={3}>{errorMsg}</Text>
            <TouchableOpacity
              onPress={() => {
                setPayStatus('idle');
                payStatusRef.current = 'idle';
                setErrorMsg('');
              }}
              activeOpacity={0.7}
            >
              <Text style={styles.errorDismiss}>Dismiss</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Spacer for slide button */}
        <View style={{ height: 120 }} />
      </ScrollView>

      {/* Slide to Pay */}
      <View style={[styles.slideContainer, { paddingBottom: insets.bottom + 16 }]}>
        {payStatus === 'building' || payStatus === 'signing' ? (
          <View style={styles.loadingTrack}>
            <ActivityIndicator size="small" color="#7C3AED" />
            <Text style={styles.loadingTrackText}>
              {payStatus === 'building' ? 'Preparing transaction…' : 'Waiting for Solflare…'}
            </Text>
          </View>
        ) : !canPay ? (
          <View style={[styles.sliderTrack, styles.sliderTrackDisabled]}>
            <Text style={styles.slideTextDisabled}>Wallet not linked</Text>
          </View>
        ) : (
          <View style={styles.sliderTrack}>
            <Animated.View
              style={[styles.sliderThumb, { transform: [{ translateX: slideAnim }] }]}
              {...panResponder.panHandlers}
            >
              <Ionicons name="arrow-forward" size={24} color="#FFFFFF" />
            </Animated.View>
            <Text style={styles.slideText}>Slide to Pay</Text>
            <Animated.View
              style={[
                styles.chevronGroup,
                {
                  opacity: chevronAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.3, 0.8],
                  }),
                },
              ]}
            >
              <Text style={styles.chevrons}>›››</Text>
            </Animated.View>
          </View>
        )}
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: {
    paddingHorizontal: SPACING.xl,
    paddingBottom: 40,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SPACING.xxxl,
  },
  errorEmoji: { fontSize: 48, marginBottom: SPACING.lg },
  errorTitle: { color: '#111827', fontSize: 22, fontWeight: '800', textAlign: 'center' },
  errorSub: { color: '#6B7280', fontSize: 15, textAlign: 'center', marginTop: SPACING.sm },
  goBackBtn: {
    backgroundColor: '#7C3AED',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 20,
    marginTop: SPACING.xxl,
  },
  goBackBtnText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.xxxl,
    paddingHorizontal: 4,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  headerTitle: { fontSize: 28, fontWeight: '800', color: '#111827' },

  // Summary card
  summaryCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.65)',
    borderRadius: 28,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.8)',
    paddingVertical: 28,
    paddingHorizontal: 24,
    alignItems: 'center',
    marginBottom: SPACING.xxl,
  },
  avatarRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  avatarWrap: { alignItems: 'center', width: 85 },
  avatarLabel: {
    color: '#111827', fontSize: 15, fontWeight: '700',
    marginTop: 8, textAlign: 'center',
  },
  arrowWrap: { paddingHorizontal: 20 },
  amountRow: { flexDirection: 'row', alignItems: 'baseline', gap: 8, marginBottom: 8 },
  amountValue: { fontSize: 42, fontWeight: '900', color: '#111827', letterSpacing: -1 },
  amountCurrency: { fontSize: 20, fontWeight: '800', color: '#9CA3AF' },
  fromGroup: { color: '#6B7280', fontSize: 15, fontWeight: '600' },

  // Payment method header
  paymentMethodHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  paymentMethodTitle: { fontSize: 18, fontWeight: '800', color: '#111827' },
  devnetBadge: {
    backgroundColor: '#FFFBEB',
    paddingHorizontal: 14,
    paddingVertical: 5,
    borderRadius: 14,
  },
  devnetText: { color: '#F59E0B', fontSize: 13, fontWeight: '800' },

  // Auto-detected method card
  methodCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 20,
    borderWidth: 1.5,
    paddingVertical: 16,
    paddingHorizontal: 18,
    marginBottom: SPACING.xxl,
    gap: 14,
  },
  methodCardGreen: {
    backgroundColor: 'rgba(16, 185, 129, 0.06)',
    borderColor: '#10B981',
  },
  methodCardPurple: {
    backgroundColor: 'rgba(124, 58, 237, 0.06)',
    borderColor: '#7C3AED',
  },
  methodIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  methodIconCircleAlt: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(124, 58, 237, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  methodInfo: { flex: 1 },
  methodTitle: { fontSize: 15, fontWeight: '800', color: '#111827', marginBottom: 3 },
  methodSub: { fontSize: 13, fontWeight: '600', color: '#6B7280' },
  methodNote: { fontSize: 12, fontWeight: '500', color: '#9CA3AF', marginTop: 2 },

  // Transaction details
  txDetailsCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.65)',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.8)',
    padding: 20,
    marginBottom: 16,
  },
  txDetailsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 18,
  },
  txDetailsTitle: { fontSize: 17, fontWeight: '800', color: '#111827' },
  txDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 14,
  },
  txDetailLabel: { color: '#6B7280', fontSize: 14, fontWeight: '600', flex: 1 },
  txDetailValue: {
    color: '#111827', fontSize: 14, fontWeight: '700',
    textAlign: 'right', flex: 1.5,
  },
  noWalletBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: 'rgba(245, 158, 11, 0.08)',
    borderRadius: 12,
    padding: 12,
    marginTop: 4,
  },
  noWalletText: { color: '#92400E', fontSize: 13, fontWeight: '600', flex: 1 },

  // Error card
  errorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: 'rgba(239, 68, 68, 0.08)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.2)',
    padding: 14,
    marginBottom: 8,
  },
  errorCardText: { flex: 1, color: '#EF4444', fontSize: 13, fontWeight: '600' },
  errorDismiss: { color: '#EF4444', fontSize: 13, fontWeight: '700' },

  // Slide to pay
  slideContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: SPACING.xl,
    paddingTop: 16,
    backgroundColor: 'transparent',
  },
  sliderTrack: {
    width: '100%',
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(237, 225, 255, 0.85)',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 4,
    overflow: 'hidden',
  },
  sliderTrackDisabled: {
    backgroundColor: 'rgba(209, 213, 219, 0.6)',
    justifyContent: 'center',
  },
  sliderThumb: {
    width: THUMB_SIZE,
    height: THUMB_SIZE,
    borderRadius: THUMB_SIZE / 2,
    backgroundColor: '#7C3AED',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
    shadowColor: '#7C3AED',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  slideText: {
    flex: 1,
    textAlign: 'center',
    color: '#7C3AED',
    fontSize: 18,
    fontWeight: '800',
    marginLeft: -THUMB_SIZE / 2,
  },
  slideTextDisabled: {
    flex: 1,
    textAlign: 'center',
    color: '#9CA3AF',
    fontSize: 16,
    fontWeight: '700',
  },
  chevronGroup: { marginRight: 16 },
  chevrons: { color: '#7C3AED', fontSize: 22, fontWeight: '700', letterSpacing: 2 },
  loadingTrack: {
    width: '100%',
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(237, 225, 255, 0.85)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  loadingTrackText: { color: '#7C3AED', fontSize: 16, fontWeight: '700' },
});
