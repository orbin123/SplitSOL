import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  PanResponder,
  ScrollView,
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Avatar } from '@/components/ui/Avatar';
import { useAppStore } from '@/store/useAppStore';
import { COLORS, FONT, SPACING, SOLANA } from '@/utils/constants';
import { buildMemo, formatCurrency, truncateAddress } from '@/utils/formatters';
import { MOCK_USDC_BALANCE, MOCK_SOL_BALANCE } from '@/utils/seedMockData';

type PaymentMethod = 'direct_usdc' | 'autopay';

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

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('direct_usdc');
  const [isOffline, setIsOffline] = useState(false);
  const [noWallet, setNoWallet] = useState(false);
  const [isSliding, setIsSliding] = useState(false);

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

  // Mock balances
  const usdcBalance = MOCK_USDC_BALANCE;
  const solBalance = MOCK_SOL_BALANCE;

  // Slide-to-pay animation
  const slideAnim = useRef(new Animated.Value(0)).current;
  const chevronAnim = useRef(new Animated.Value(0)).current;

  // Chevron pulse animation
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(chevronAnim, {
          toValue: 1,
          duration: 1200,
          useNativeDriver: true,
        }),
        Animated.timing(chevronAnim, {
          toValue: 0,
          duration: 1200,
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [chevronAnim]);

  const handlePaymentComplete = useCallback(() => {
    if (!group || !currentUser || !recipient || !debt) return;

    const memo = buildMemo(group.name, currentUser.name, recipient.name, debt.amount);
    const mockSignature = `mock_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
    const settledAt = new Date().toISOString();

    addSettlement({
      groupId: group.id,
      from: currentUser.id,
      to: recipient.id,
      amount: debt.amount,
      status: 'confirmed',
      txSignature: mockSignature,
      memo,
      settledAt,
    });

    addTransaction({
      groupId: group.id,
      payerWallet: walletAddress || 'DEMO111111111111111111111111111111111111111',
      receiverWallet: recipientWallet || '',
      amountUSDC: debt.amount,
      status: 'confirmed',
      signature: mockSignature,
      timestamp: settledAt,
      swap:
        paymentMethod === 'autopay'
          ? {
            inputToken: 'SOL',
            inputAmount: Number((debt.amount * SOLANA.DEVNET_USDC_TO_SOL).toFixed(6)),
            outputUSDC: debt.amount,
            route: 'Jupiter (Mock)',
            slippage: 0.5,
            fee: 0,
          }
          : null,
      chain: {
        networkFee: 0.000005,
        confirmationStatus: 'confirmed',
        blockTime: Math.floor(Date.now() / 1000),
      },
    });

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    router.replace(
      `/settle/success?txId=${mockSignature}&groupId=${group.id}&amount=${debt.amount}&from=${currentUser.name}&to=${recipient.name}&groupName=${group.name}&groupEmoji=${group.emoji}&method=${paymentMethod}&recipientWallet=${recipientWallet || ''}` as any,
    );
  }, [group, currentUser, recipient, debt, walletAddress, recipientWallet, paymentMethod, addSettlement, addTransaction, router]);

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderGrant: () => {
          setIsSliding(true);
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        },
        onPanResponderMove: (_, gestureState) => {
          const value = Math.max(0, Math.min(gestureState.dx, SLIDE_THRESHOLD));
          slideAnim.setValue(value);
        },
        onPanResponderRelease: (_, gestureState) => {
          setIsSliding(false);
          if (gestureState.dx >= SLIDE_THRESHOLD) {
            Animated.timing(slideAnim, {
              toValue: SLIDE_THRESHOLD,
              duration: 100,
              useNativeDriver: true,
            }).start(() => {
              handlePaymentComplete();
            });
          } else {
            Animated.spring(slideAnim, {
              toValue: 0,
              friction: 5,
              useNativeDriver: true,
            }).start();
          }
        },
      }),
    [slideAnim, handlePaymentComplete],
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

  const memoText = buildMemo(group.name, currentUser.name, recipient.name, debt.amount);

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
        showsVerticalScrollIndicator={true}
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
              <Text style={styles.avatarLabel}>
                {currentUser.isCurrentUser ? currentUser.name : currentUser.name}
              </Text>
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

        {/* Payment Method */}
        <View style={styles.paymentMethodHeader}>
          <Text style={styles.paymentMethodTitle}>Payment Method</Text>
          <View style={styles.devnetBadge}>
            <Text style={styles.devnetText}>Devnet</Text>
          </View>
        </View>

        {/* Direct USDC Option */}
        <TouchableOpacity
          style={[
            styles.paymentOption,
            paymentMethod === 'direct_usdc' && styles.paymentOptionSelected,
          ]}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            setPaymentMethod('direct_usdc');
          }}
          activeOpacity={0.7}
        >
          <View style={styles.paymentOptionLeft}>
            <View style={styles.paymentIconCircle}>
              <Ionicons name="checkmark-circle" size={28} color="#10B981" />
            </View>
            <View>
              <Text style={styles.paymentOptionTitle}>Direct USDC Transfer</Text>
              <Text style={styles.paymentOptionBalance}>
                Balance: {usdcBalance.toFixed(2)} USDC
              </Text>
            </View>
          </View>
          <View
            style={[
              styles.radioOuter,
              paymentMethod === 'direct_usdc' && styles.radioOuterSelected,
            ]}
          >
            {paymentMethod === 'direct_usdc' && (
              <View style={styles.radioInner} />
            )}
          </View>
        </TouchableOpacity>

        {/* AutoPay Option */}
        <TouchableOpacity
          style={[
            styles.paymentOption,
            paymentMethod === 'autopay' && styles.paymentOptionSelected,
          ]}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            setPaymentMethod('autopay');
          }}
          activeOpacity={0.7}
        >
          <View style={styles.paymentOptionLeft}>
            <View style={styles.paymentIconCircleGray}>
              <Ionicons name="swap-horizontal" size={24} color="#6B7280" />
            </View>
            <View>
              <Text style={styles.paymentOptionTitle}>AutoPay: Swap SOL →{'\n'}USDC</Text>
              <Text style={styles.paymentOptionBalance}>
                Balance: {solBalance.toFixed(2)} SOL
              </Text>
            </View>
          </View>
          <View
            style={[
              styles.radioOuter,
              paymentMethod === 'autopay' && styles.radioOuterSelected,
            ]}
          >
            {paymentMethod === 'autopay' && <View style={styles.radioInner} />}
          </View>
        </TouchableOpacity>

        {/* Transaction Details */}
        <View style={styles.txDetailsCard}>
          <View style={styles.txDetailsHeader}>
            <Ionicons name="checkmark-circle" size={22} color="#10B981" />
            <Text style={styles.txDetailsTitle}>Transaction Details</Text>
          </View>

          <View style={styles.txDetailRow}>
            <Text style={styles.txDetailLabel}>Memo</Text>
            <Text style={styles.txDetailValue} numberOfLines={2}>
              SplitSOL | {group.name}{'\n'}
              {currentUser.name} → {recipient.name} | {debt.amount.toFixed(2)} USDC
            </Text>
          </View>

          <View style={styles.txDetailRow}>
            <Text style={styles.txDetailLabel}>Network fee</Text>
            <Text style={styles.txDetailValue}>~0.000005 SOL</Text>
          </View>

          <View style={styles.txDetailRow}>
            <Text style={styles.txDetailLabel}>Recipient wallet</Text>
            <Text style={styles.txDetailValue}>
              {recipientWallet
                ? truncateAddress(recipientWallet, 4)
                : 'Not set'}
            </Text>
          </View>
        </View>

        {/* Dev Toggle Buttons */}
        <View style={styles.toggleRow}>
          <TouchableOpacity
            style={[
              styles.toggleBtn,
              isOffline && styles.toggleBtnActive,
            ]}
            onPress={() => setIsOffline((v) => !v)}
            activeOpacity={0.7}
          >
            <Text style={[styles.toggleBtnText, isOffline && styles.toggleBtnTextActive]}>
              Toggle Offline
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.toggleBtn,
              noWallet && styles.toggleBtnActive,
            ]}
            onPress={() => setNoWallet((v) => !v)}
            activeOpacity={0.7}
          >
            <Text style={[styles.toggleBtnText, noWallet && styles.toggleBtnTextActive]}>
              Toggle No Wallet
            </Text>
          </TouchableOpacity>
        </View>

        {/* Spacer for slide button */}
        <View style={{ height: 120 }} />
      </ScrollView>

      {/* Slide to Pay */}
      <View style={[styles.slideContainer, { paddingBottom: insets.bottom + 16 }]}>
        <View style={styles.sliderTrack}>
          <Animated.View
            style={[
              styles.sliderThumb,
              { transform: [{ translateX: slideAnim }] },
            ]}
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
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
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
  errorEmoji: {
    fontSize: 48,
    marginBottom: SPACING.lg,
  },
  errorTitle: {
    color: '#111827',
    fontSize: 22,
    fontWeight: '800',
    textAlign: 'center',
  },
  errorSub: {
    color: '#6B7280',
    fontSize: 15,
    textAlign: 'center',
    marginTop: SPACING.sm,
  },
  goBackBtn: {
    backgroundColor: '#7C3AED',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 20,
    marginTop: SPACING.xxl,
  },
  goBackBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },

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
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#111827',
  },

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
  avatarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  avatarWrap: {
    alignItems: 'center',
    width: 85,
  },
  avatarLabel: {
    color: '#111827',
    fontSize: 15,
    fontWeight: '700',
    marginTop: 8,
    textAlign: 'center',
  },
  arrowWrap: {
    paddingHorizontal: 20,
  },
  amountRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
    marginBottom: 8,
  },
  amountValue: {
    fontSize: 42,
    fontWeight: '900',
    color: '#111827',
    letterSpacing: -1,
  },
  amountCurrency: {
    fontSize: 20,
    fontWeight: '800',
    color: '#9CA3AF',
  },
  fromGroup: {
    color: '#6B7280',
    fontSize: 15,
    fontWeight: '600',
  },

  // Payment Method
  paymentMethodHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  paymentMethodTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#111827',
  },
  devnetBadge: {
    backgroundColor: '#FFFBEB',
    paddingHorizontal: 14,
    paddingVertical: 5,
    borderRadius: 14,
  },
  devnetText: {
    color: '#F59E0B',
    fontSize: 13,
    fontWeight: '800',
  },

  // Payment options
  paymentOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255, 255, 255, 0.55)',
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.8)',
    paddingVertical: 16,
    paddingHorizontal: 18,
    marginBottom: 12,
  },
  paymentOptionSelected: {
    borderColor: '#7C3AED',
    borderWidth: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.75)',
  },
  paymentOptionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    flex: 1,
  },
  paymentIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  paymentIconCircleGray: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(107, 114, 128, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  paymentOptionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#111827',
  },
  paymentOptionBalance: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6B7280',
    marginTop: 3,
  },
  radioOuter: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioOuterSelected: {
    borderColor: '#7C3AED',
  },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#7C3AED',
  },

  // Transaction Details
  txDetailsCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.65)',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.8)',
    padding: 20,
    marginTop: 8,
    marginBottom: 16,
  },
  txDetailsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 18,
  },
  txDetailsTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#111827',
  },
  txDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 14,
  },
  txDetailLabel: {
    color: '#6B7280',
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
  },
  txDetailValue: {
    color: '#111827',
    fontSize: 14,
    fontWeight: '700',
    textAlign: 'right',
    flex: 1.5,
  },

  // Toggle buttons
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
    marginTop: 8,
  },
  toggleBtn: {
    backgroundColor: 'rgba(255, 255, 255, 0.55)',
    borderRadius: 20,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.8)',
  },
  toggleBtnActive: {
    backgroundColor: 'rgba(124, 58, 237, 0.15)',
    borderColor: '#7C3AED',
  },
  toggleBtnText: {
    color: '#6B7280',
    fontSize: 13,
    fontWeight: '700',
  },
  toggleBtnTextActive: {
    color: '#7C3AED',
  },

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
  chevronGroup: {
    marginRight: 16,
  },
  chevrons: {
    color: '#7C3AED',
    fontSize: 22,
    fontWeight: '700',
    letterSpacing: 2,
  },
});
