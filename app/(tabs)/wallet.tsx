import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Linking,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';
import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';
import { useAppStore } from '@/store/useAppStore';
import { truncateAddress } from '@/utils/formatters';
import { isValidWalletAddress } from '@/utils/memberQr';
import { getRpcErrorCopy } from '@/utils/errorMessages';
import { MOCK_USDC_BALANCE, MOCK_SOL_BALANCE } from '@/utils/seedMockData';
import { getSOLBalanceWithRetry, getUSDCBalance } from '@/utils/solana';
import {
  COLORS,
  SPACING,
  FONT,
  TAB_BAR_HEIGHT,
  SOLANA,
} from '@/utils/constants';

export default function Wallet() {
  const insets = useSafeAreaInsets();
  const walletAddress = useAppStore((s) => s.user.walletAddress);
  const [balance, setBalance] = useState<number | null>(null);
  const [usdcBalance, setUsdcBalance] = useState<number | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const isMockWallet = walletAddress?.startsWith('DEMO') || walletAddress?.startsWith('MOCK');

  const fetchBalance = useCallback(async () => {
    if (!walletAddress || !isValidWalletAddress(walletAddress)) {
      // Use mock balances for demo wallets
      if (isMockWallet) {
        setBalance(MOCK_SOL_BALANCE);
        setUsdcBalance(MOCK_USDC_BALANCE);
        setErrorMessage(null);
        return;
      }
      setBalance(null);
      setUsdcBalance(null);
      setErrorMessage(null);
      return;
    }
    try {
      const [sol, usdc] = await Promise.all([
        getSOLBalanceWithRetry(walletAddress),
        getUSDCBalance(walletAddress).catch(() => 0),
      ]);
      setBalance(sol);
      setUsdcBalance(usdc);
      setErrorMessage(null);
    } catch (error) {
      // Fallback to mock balances on error for demo wallets
      if (isMockWallet) {
        setBalance(MOCK_SOL_BALANCE);
        setUsdcBalance(MOCK_USDC_BALANCE);
        setErrorMessage(null);
        return;
      }
      setBalance(null);
      setUsdcBalance(null);
      setErrorMessage(getRpcErrorCopy(error).message);
    }
  }, [walletAddress, isMockWallet]);

  useEffect(() => {
    fetchBalance();
  }, [fetchBalance]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchBalance();
    setRefreshing(false);
  };

  const copyAddress = async () => {
    if (!walletAddress) return;
    await Clipboard.setStringAsync(walletAddress);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const openExplorer = () => {
    if (!walletAddress) return;
    const url = `${SOLANA.EXPLORER_BASE}/address/${walletAddress}?cluster=${SOLANA.CLUSTER}`;
    Linking.openURL(url);
  };

  return (
    <LinearGradient
      colors={['#FDCBEE', '#E7D4FC', '#C1E6F5']}
      style={styles.container}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    >
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + SPACING.lg },
        ]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={COLORS.text.primary}
          />
        }
      >
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Wallet</Text>
          {walletAddress ? (
            <View style={styles.connectedBadge}>
              <View style={styles.connectedDot} />
              <Text style={styles.connectedText}>Connected</Text>
            </View>
          ) : (
            <View style={styles.disconnectedBadge}>
              <View style={styles.disconnectedDot} />
              <Text style={styles.connectedText}>Offline</Text>
            </View>
          )}
        </View>

        {/* Hero Balance Card */}
        <View style={styles.heroCard}>
          <Text style={styles.heroLabel}>Wallet Balance</Text>
          <View style={styles.heroAmountRow}>
            <Text style={styles.heroAmount}>
              {balance !== null ? balance.toFixed(2) : '0.00'}
            </Text>
            <Text style={styles.heroCurrency}> SOL</Text>
          </View>
          <Text style={styles.heroSubText}>
            ≈ {usdcBalance !== null ? usdcBalance.toFixed(2) : '0.00'} USDC available
          </Text>
          <View style={styles.devnetBadge}>
            <Text style={styles.devnetText}>
              {SOLANA.CLUSTER === 'devnet' ? 'Devnet' : 'Mainnet'}
            </Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Your Tokens</Text>

        <View style={styles.tokensCard}>
          {/* SOL Row */}
          <View style={styles.tokenRow}>
            <View style={styles.tokenLeft}>
              <View style={[styles.tokenIcon, { backgroundColor: '#000' }]}>
                <Text style={styles.tokenIconTextSol}>SOL</Text>
              </View>
              <Text style={styles.tokenName}>SOL</Text>
            </View>
            <View style={styles.tokenRight}>
              <Text style={styles.tokenAmount}>
                {balance !== null ? balance.toFixed(2) : '0.00'}
              </Text>
              <Text style={styles.tokenFiat}>
                ≈ ${(balance !== null ? balance * 140.89 : 0).toFixed(2)}
              </Text>
            </View>
          </View>

          {/* USDC Row */}
          <View style={styles.tokenRow}>
            <View style={styles.tokenLeft}>
              <View style={[styles.tokenIcon, { backgroundColor: '#3b82f6' }]}>
                <Text style={styles.tokenIconTextUsdc}>$</Text>
              </View>
              <Text style={styles.tokenName}>USDC</Text>
            </View>
            <View style={styles.tokenRight}>
              <Text style={styles.tokenAmount}>
                {usdcBalance !== null ? usdcBalance.toFixed(2) : '0.00'}
              </Text>
              <Text style={styles.tokenFiat}>
                ≈ ${usdcBalance !== null ? usdcBalance.toFixed(2) : '0.00'}
              </Text>
            </View>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Wallet Address</Text>

        <View style={styles.addressCard}>
          <Text style={styles.addressText} numberOfLines={1}>
            {walletAddress ? truncateAddress(walletAddress, 4) : 'Not Connected'}
          </Text>
          <View style={styles.addressActions}>
            <TouchableOpacity onPress={copyAddress} style={styles.actionBtn}>
              <Ionicons name="copy-outline" size={20} color="#4B5563" />
            </TouchableOpacity>
            <TouchableOpacity onPress={openExplorer} style={styles.actionBtn}>
              <Ionicons name="open-outline" size={20} color="#4B5563" />
            </TouchableOpacity>
          </View>
        </View>

      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingHorizontal: SPACING.xl,
    paddingBottom: TAB_BAR_HEIGHT + SPACING.xxxl + 72,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.xxl,
    paddingHorizontal: 4,
  },
  headerTitle: {
    color: '#111827',
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  connectedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.65)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.8)',
    gap: 6,
  },
  disconnectedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.65)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.8)',
    gap: 6,
  },
  connectedDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#10B981',
  },
  disconnectedDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#EF4444',
  },
  connectedText: {
    color: '#111827',
    fontSize: 14,
    fontWeight: '700',
  },
  heroCard: {
    backgroundColor: 'rgba(243, 232, 255, 0.45)', // very light purple tinted glass
    borderRadius: 32,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.8)',
    paddingTop: 32,
    paddingBottom: 28,
    alignItems: 'center',
    marginBottom: 32,
  },
  heroLabel: {
    color: '#6B7280',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 8,
  },
  heroAmountRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 8,
  },
  heroAmount: {
    fontSize: 56,
    fontWeight: '900',
    color: '#111827',
    letterSpacing: -1,
  },
  heroCurrency: {
    fontSize: 24,
    fontWeight: '800',
    color: '#9CA3AF',
    marginLeft: 8,
  },
  heroSubText: {
    fontSize: 16,
    color: '#6B7280',
    fontWeight: '700',
    marginBottom: 20,
  },
  devnetBadge: {
    backgroundColor: '#FFFBEB',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 16,
  },
  devnetText: {
    color: '#F59E0B',
    fontSize: 14,
    fontWeight: '800',
  },
  sectionTitle: {
    color: '#111827',
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  tokensCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.55)',
    borderRadius: 32,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 32,
    paddingVertical: 8,
  },
  tokenRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  tokenLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  tokenIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tokenIconTextSol: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '800',
  },
  tokenIconTextUsdc: {
    color: '#FFF',
    fontSize: 20,
    fontWeight: '600',
  },
  tokenName: {
    fontSize: 18,
    color: '#111827',
    fontWeight: '800',
  },
  tokenRight: {
    alignItems: 'flex-end',
  },
  tokenAmount: {
    fontSize: 18,
    color: '#111827',
    fontWeight: '800',
    marginBottom: 4,
  },
  tokenFiat: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '600',
  },
  addressCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255, 255, 255, 0.55)',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.8)',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  addressText: {
    fontSize: 16,
    color: '#111827',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  addressActions: {
    flexDirection: 'row',
    gap: 16,
  },
  actionBtn: {
    padding: 4,
  },
});
