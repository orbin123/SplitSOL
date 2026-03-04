import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppStore } from '@/store/useAppStore';
import { ConnectButton } from '@/components/wallet/ConnectButton';
import { Card } from '@/components/ui/Card';
import { truncateAddress } from '@/utils/formatters';
import { getSOLBalance } from '@/utils/solana';
import {
  COLORS,
  GRADIENTS,
  SPACING,
  FONT,
  RADIUS,
  TAB_BAR_HEIGHT,
  SOLANA,
} from '@/utils/constants';

export default function Wallet() {
  const insets = useSafeAreaInsets();
  const walletAddress = useAppStore((s) => s.walletAddress);
  const [balance, setBalance] = useState<number | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchBalance = useCallback(async () => {
    if (!walletAddress) {
      setBalance(null);
      return;
    }
    try {
      setBalance(await getSOLBalance(walletAddress));
    } catch {
      setBalance(null);
      Alert.alert('Connection Error', 'Unable to fetch balance. Check your internet connection.');
    }
  }, [walletAddress]);

  useEffect(() => {
    fetchBalance();
  }, [fetchBalance]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchBalance();
    setRefreshing(false);
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[
        styles.content,
        { paddingTop: insets.top + SPACING.lg },
      ]}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor={COLORS.text.secondary}
        />
      }
    >
      <Text style={styles.title}>Wallet</Text>

      {!walletAddress ? (
        <Card style={styles.connectCard}>
          <Text style={styles.connectEmoji}>🔗</Text>
          <Text style={styles.connectTitle}>Connect Your Wallet</Text>
          <Text style={styles.connectSub}>
            Link your Solana wallet to settle expenses on-chain.
          </Text>
          <View style={styles.connectBtnWrap}>
            <ConnectButton />
          </View>
        </Card>
      ) : (
        <>
          {/* Address */}
          <Card style={styles.addressCard}>
            <View style={styles.addressRow}>
              <View style={styles.dot} />
              <Text style={styles.addressLabel}>Connected</Text>
            </View>
            <Text style={styles.addressText}>
              {truncateAddress(walletAddress, 8)}
            </Text>
          </Card>

          {/* Balance */}
          <LinearGradient
            colors={GRADIENTS.purple}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.balanceCard}
          >
            <Text style={styles.balanceLabel}>
              {SOLANA.CLUSTER === 'devnet' ? 'DEVNET' : 'MAINNET'} SOL BALANCE
            </Text>
            <Text style={styles.balanceValue}>
              {balance !== null ? `${balance.toFixed(4)}  SOL` : '--  SOL'}
            </Text>
          </LinearGradient>

          {/* Network */}
          <Card>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Network</Text>
              <View style={styles.networkBadge}>
                <Text style={styles.networkText}>
                  {SOLANA.CLUSTER === 'devnet' ? 'Devnet' : 'Mainnet'}
                </Text>
              </View>
            </View>
          </Card>

          {SOLANA.CLUSTER === 'devnet' && (
            <Card style={styles.hintCard}>
              <Text style={styles.hintTitle}>Testing on Devnet?</Text>
              <Text style={styles.hintText}>
                Get free SOL at faucet.solana.com — paste your wallet address
                and request an airdrop.
              </Text>
            </Card>
          )}

          <View style={styles.disconnectWrap}>
            <ConnectButton />
          </View>
        </>
      )}
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
    paddingBottom: TAB_BAR_HEIGHT + SPACING.lg,
    gap: SPACING.lg,
  },
  title: {
    color: COLORS.text.primary,
    fontSize: FONT.size.xxl,
    fontWeight: FONT.weight.bold,
    marginBottom: SPACING.sm,
  },

  connectCard: {
    alignItems: 'center',
    paddingVertical: SPACING.xxxl,
    gap: SPACING.md,
  },
  connectEmoji: { fontSize: 56 },
  connectTitle: {
    color: COLORS.text.primary,
    fontSize: FONT.size.xl,
    fontWeight: FONT.weight.bold,
  },
  connectSub: {
    color: COLORS.text.secondary,
    fontSize: FONT.size.md,
    textAlign: 'center',
    lineHeight: 22,
  },
  connectBtnWrap: { marginTop: SPACING.lg },

  addressCard: { gap: SPACING.sm },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.bg.success,
  },
  addressLabel: {
    color: COLORS.text.success,
    fontSize: FONT.size.sm,
    fontWeight: FONT.weight.semibold,
  },
  addressText: {
    color: COLORS.text.primary,
    fontSize: FONT.size.lg,
    fontWeight: FONT.weight.semibold,
  },

  balanceCard: {
    borderRadius: RADIUS.xl,
    padding: SPACING.xxl,
    gap: SPACING.sm,
  },
  balanceLabel: {
    color: COLORS.text.accent,
    fontSize: FONT.size.xs,
    fontWeight: FONT.weight.semibold,
    letterSpacing: 1,
  },
  balanceValue: {
    color: COLORS.text.primary,
    fontSize: 32,
    fontWeight: FONT.weight.extrabold,
  },

  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  infoLabel: {
    color: COLORS.text.primary,
    fontSize: FONT.size.md,
    fontWeight: FONT.weight.medium,
  },
  networkBadge: {
    backgroundColor: COLORS.bg.warning,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: RADIUS.sm,
  },
  networkText: {
    color: COLORS.bg.dark,
    fontSize: FONT.size.xs,
    fontWeight: FONT.weight.bold,
  },

  hintCard: {
    borderLeftWidth: 3,
    borderLeftColor: COLORS.bg.warning,
  },
  hintTitle: {
    color: COLORS.text.primary,
    fontSize: FONT.size.md,
    fontWeight: FONT.weight.bold,
    marginBottom: SPACING.xs,
  },
  hintText: {
    color: COLORS.text.secondary,
    fontSize: FONT.size.sm,
    lineHeight: 20,
  },

  disconnectWrap: {
    alignItems: 'center',
    marginTop: SPACING.lg,
  },
});
