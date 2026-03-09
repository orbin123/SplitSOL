import React, { useState } from 'react';
import {
  ActivityIndicator,
  Linking,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';
import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { useAppStore } from '@/store/useAppStore';
import { truncateAddress } from '@/utils/formatters';
import { useWalletBalance } from '@/hooks/useWalletBalance';
import { COLORS, SPACING, FONT, TAB_BAR_HEIGHT, SOLANA } from '@/utils/constants';

export default function Wallet() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const walletAddress = useAppStore((s) => s.user.walletAddress);
  const [refreshing, setRefreshing] = useState(false);

  const { solBalance, usdcBalance, loading, error, refresh } =
    useWalletBalance(walletAddress);

  const onRefresh = async () => {
    setRefreshing(true);
    await refresh();
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
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Wallet</Text>
          {walletAddress ? (
            <View style={styles.connectedBadge}>
              <View style={styles.connectedDot} />
              <Text style={styles.badgeText}>Connected</Text>
            </View>
          ) : (
            <View style={styles.disconnectedBadge}>
              <View style={styles.disconnectedDot} />
              <Text style={styles.badgeText}>Not Connected</Text>
            </View>
          )}
        </View>

        {!walletAddress ? (
          /* ── No wallet state ── */
          <View style={styles.emptyCard}>
            <View style={styles.emptyIconWrap}>
              <Ionicons name="wallet-outline" size={44} color={COLORS.bg.accent} />
            </View>
            <Text style={styles.emptyTitle}>No Wallet Connected</Text>
            <Text style={styles.emptySubtitle}>
              Connect your Solflare wallet to view your devnet balances.
            </Text>
            <TouchableOpacity
              style={styles.connectBtn}
              onPress={() => router.push('/(onboarding)/connect' as any)}
              activeOpacity={0.8}
            >
              <Ionicons name="wallet-outline" size={18} color="#FFFFFF" />
              <Text style={styles.connectBtnText}>Connect Wallet</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            {/* ── Hero Balance Card ── */}
            <View style={styles.heroCard}>
              <Text style={styles.heroLabel}>Wallet Balance</Text>

              {loading ? (
                <View style={styles.loadingWrap}>
                  <ActivityIndicator
                    size="large"
                    color={COLORS.bg.accent}
                    style={{ marginBottom: 12 }}
                  />
                  <Text style={styles.loadingText}>Fetching balances…</Text>
                </View>
              ) : (
                <>
                  <View style={styles.heroAmountRow}>
                    <Text style={styles.heroAmount}>
                      {solBalance !== null ? solBalance.toFixed(4) : '—'}
                    </Text>
                    <Text style={styles.heroCurrency}> SOL</Text>
                  </View>
                  <Text style={styles.heroSubText}>
                    {usdcBalance !== null
                      ? `${usdcBalance.toFixed(2)} USDC available`
                      : 'USDC balance unavailable'}
                  </Text>
                </>
              )}

              <View style={styles.devnetBadge}>
                <Text style={styles.devnetText}>
                  {SOLANA.CLUSTER === 'devnet' ? 'Devnet' : 'Mainnet'}
                </Text>
              </View>
            </View>

            {/* ── Error banner ── */}
            {error && !loading && (
              <View style={styles.errorBanner}>
                <Ionicons name="alert-circle-outline" size={16} color="#EF4444" />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}

            {/* ── Token rows ── */}
            <Text style={styles.sectionTitle}>Your Tokens</Text>
            <View style={styles.tokensCard}>
              {/* SOL */}
              <View style={styles.tokenRow}>
                <View style={styles.tokenLeft}>
                  <View style={[styles.tokenIcon, { backgroundColor: '#000' }]}>
                    <Text style={styles.tokenIconTextSol}>SOL</Text>
                  </View>
                  <Text style={styles.tokenName}>SOL</Text>
                </View>
                <View style={styles.tokenRight}>
                  {loading ? (
                    <ActivityIndicator size="small" color={COLORS.text.tertiary} />
                  ) : (
                    <>
                      <Text style={styles.tokenAmount}>
                        {solBalance !== null ? solBalance.toFixed(4) : '—'}
                      </Text>
                      <Text style={styles.tokenFiat}>Solana devnet</Text>
                    </>
                  )}
                </View>
              </View>

              <View style={styles.tokenDivider} />

              {/* USDC */}
              <View style={styles.tokenRow}>
                <View style={styles.tokenLeft}>
                  <View style={[styles.tokenIcon, { backgroundColor: '#3b82f6' }]}>
                    <Text style={styles.tokenIconTextUsdc}>$</Text>
                  </View>
                  <Text style={styles.tokenName}>USDC</Text>
                </View>
                <View style={styles.tokenRight}>
                  {loading ? (
                    <ActivityIndicator size="small" color={COLORS.text.tertiary} />
                  ) : (
                    <>
                      <Text style={styles.tokenAmount}>
                        {usdcBalance !== null ? usdcBalance.toFixed(2) : '—'}
                      </Text>
                      <Text style={styles.tokenFiat}>≈ ${usdcBalance !== null ? usdcBalance.toFixed(2) : '0.00'}</Text>
                    </>
                  )}
                </View>
              </View>
            </View>

            {/* ── Wallet address ── */}
            <Text style={styles.sectionTitle}>Wallet Address</Text>
            <View style={styles.addressCard}>
              <Text style={styles.addressText} numberOfLines={1}>
                {truncateAddress(walletAddress, 6)}
              </Text>
              <View style={styles.addressActions}>
                <TouchableOpacity onPress={copyAddress} style={styles.actionBtn} activeOpacity={0.7}>
                  <Ionicons name="copy-outline" size={20} color="#4B5563" />
                </TouchableOpacity>
                <TouchableOpacity onPress={openExplorer} style={styles.actionBtn} activeOpacity={0.7}>
                  <Ionicons name="open-outline" size={20} color="#4B5563" />
                </TouchableOpacity>
              </View>
            </View>
          </>
        )}
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

  // Header
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
  badgeText: {
    color: '#111827',
    fontSize: 14,
    fontWeight: '700',
  },

  // No-wallet empty state
  emptyCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.65)',
    borderRadius: 32,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.8)',
    alignItems: 'center',
    paddingVertical: 48,
    paddingHorizontal: SPACING.xxl,
    gap: SPACING.md,
  },
  emptyIconWrap: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.bg.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.sm,
  },
  emptyTitle: {
    color: '#111827',
    fontSize: 20,
    fontWeight: '800',
    textAlign: 'center',
  },
  emptySubtitle: {
    color: '#6B7280',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 22,
    maxWidth: 260,
  },
  connectBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: COLORS.bg.accent,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 9999,
    marginTop: SPACING.sm,
  },
  connectBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
  },

  // Hero card
  heroCard: {
    backgroundColor: 'rgba(243, 232, 255, 0.45)',
    borderRadius: 32,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.8)',
    paddingTop: 32,
    paddingBottom: 28,
    alignItems: 'center',
    marginBottom: 32,
    minHeight: 160,
    justifyContent: 'center',
  },
  heroLabel: {
    color: '#6B7280',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 8,
  },
  loadingWrap: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  loadingText: {
    color: '#9CA3AF',
    fontSize: 14,
    fontWeight: '600',
  },
  heroAmountRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 8,
  },
  heroAmount: {
    fontSize: 52,
    fontWeight: '900',
    color: '#111827',
    letterSpacing: -1,
  },
  heroCurrency: {
    fontSize: 22,
    fontWeight: '800',
    color: '#9CA3AF',
    marginLeft: 6,
  },
  heroSubText: {
    fontSize: 15,
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

  // Error
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    backgroundColor: 'rgba(239,68,68,0.08)',
    borderRadius: 16,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    marginBottom: SPACING.xxl,
  },
  errorText: {
    color: '#EF4444',
    fontSize: 13,
    fontWeight: '600',
    flex: 1,
  },

  // Token rows
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
  tokenDivider: {
    height: 1,
    backgroundColor: 'rgba(0,0,0,0.05)',
    marginHorizontal: 20,
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
    minWidth: 80,
  },
  tokenAmount: {
    fontSize: 18,
    color: '#111827',
    fontWeight: '800',
    marginBottom: 4,
  },
  tokenFiat: {
    fontSize: 13,
    color: '#6B7280',
    fontWeight: '600',
  },

  // Address
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
    fontSize: 15,
    color: '#111827',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    fontWeight: '600',
    letterSpacing: 0.5,
    flex: 1,
  },
  addressActions: {
    flexDirection: 'row',
    gap: 16,
    marginLeft: 12,
  },
  actionBtn: {
    padding: 4,
  },
});
