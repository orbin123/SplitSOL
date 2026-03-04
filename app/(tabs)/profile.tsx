import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Alert,
} from 'react-native';
import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';
import { useAppStore } from '@/store/useAppStore';
import { ConnectButton } from '@/components/wallet/ConnectButton';
import { Avatar } from '@/components/ui/Avatar';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { truncateAddress } from '@/utils/formatters';
import { getSOLBalance } from '@/utils/solana';
import { COLORS, SPACING, FONT, RADIUS, APP, SOLANA } from '@/utils/constants';

export default function Profile() {
  const user = useAppStore((s) => s.user);
  const walletAddress = useAppStore((s) => s.walletAddress);
  const groups = useAppStore((s) => s.groups);
  const [balance, setBalance] = useState<number | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const totalSettlements = groups.reduce(
    (sum, g) => sum + g.settlements.filter((s) => s.status === 'confirmed').length,
    0,
  );

  const fetchBalance = useCallback(async () => {
    if (!walletAddress) {
      setBalance(null);
      return;
    }
    try {
      const bal = await getSOLBalance(walletAddress);
      setBalance(bal);
    } catch {
      setBalance(null);
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

  const copyAddress = async () => {
    if (!walletAddress) return;
    await Clipboard.setStringAsync(walletAddress);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    Alert.alert('Copied!', 'Wallet address copied to clipboard.');
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor={COLORS.text.secondary}
        />
      }
    >
      {/* User Header */}
      <View style={styles.header}>
        <Avatar name={user.name || 'Me'} size={72} />
        <Text style={styles.userName}>{user.name || 'SplitSOL User'}</Text>
        <Text style={styles.userSub}>
          {groups.length} group{groups.length !== 1 ? 's' : ''} · {totalSettlements} settlement{totalSettlements !== 1 ? 's' : ''}
        </Text>
      </View>

      {/* Wallet Section */}
      <Card style={styles.walletCard}>
        <Text style={styles.sectionTitle}>Solana Wallet</Text>

        {walletAddress ? (
          <View style={styles.walletConnected}>
            <View style={styles.walletRow}>
              <View style={styles.statusDot} />
              <Text style={styles.walletLabel}>Connected</Text>
            </View>

            <Card
              style={styles.addressCard}
              onPress={copyAddress}
            >
              <Text style={styles.addressText}>
                {truncateAddress(walletAddress, 8)}
              </Text>
              <Text style={styles.tapCopy}>Tap to copy full address</Text>
            </Card>

            {balance !== null && (
              <View style={styles.balanceRow}>
                <Text style={styles.balanceLabel}>Balance</Text>
                <Text style={styles.balanceValue}>
                  {balance.toFixed(4)} SOL
                </Text>
              </View>
            )}

            <View style={styles.balanceRow}>
              <Text style={styles.balanceLabel}>Network</Text>
              <View style={styles.networkBadge}>
                <Text style={styles.networkText}>
                  {SOLANA.CLUSTER === 'devnet' ? 'Devnet' : 'Mainnet'}
                </Text>
              </View>
            </View>
          </View>
        ) : (
          <View style={styles.walletDisconnected}>
            <Text style={styles.walletPrompt}>
              Connect your Solana wallet to settle expenses on-chain.
            </Text>
          </View>
        )}

        <View style={styles.connectWrap}>
          <ConnectButton />
        </View>
      </Card>

      {/* Airdrop hint for devnet */}
      {walletAddress && SOLANA.CLUSTER === 'devnet' && (
        <Card style={styles.hintCard}>
          <Text style={styles.hintTitle}>Testing on Devnet?</Text>
          <Text style={styles.hintText}>
            You can get free SOL for testing at{' '}
            <Text style={styles.hintLink}>faucet.solana.com</Text>
            . Paste your wallet address and request an airdrop.
          </Text>
        </Card>
      )}

      {/* App Info */}
      <View style={styles.appInfo}>
        <Text style={styles.appName}>{APP.NAME}</Text>
        <Text style={styles.appVersion}>v{APP.VERSION}</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg.primary,
  },
  content: {
    padding: SPACING.lg,
    paddingBottom: SPACING.xxxl,
    gap: SPACING.lg,
  },

  // Header
  header: {
    alignItems: 'center',
    paddingVertical: SPACING.xxl,
  },
  userName: {
    color: COLORS.text.primary,
    fontSize: FONT.size.xxl,
    fontWeight: FONT.weight.bold,
    marginTop: SPACING.lg,
  },
  userSub: {
    color: COLORS.text.secondary,
    fontSize: FONT.size.sm,
    marginTop: SPACING.xs,
  },

  // Wallet Card
  walletCard: {
    gap: SPACING.lg,
  },
  sectionTitle: {
    color: COLORS.text.primary,
    fontSize: FONT.size.lg,
    fontWeight: FONT.weight.bold,
  },
  walletConnected: {
    gap: SPACING.md,
  },
  walletRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.bg.success,
  },
  walletLabel: {
    color: COLORS.text.success,
    fontSize: FONT.size.sm,
    fontWeight: FONT.weight.semibold,
  },
  addressCard: {
    backgroundColor: COLORS.bg.tertiary,
    padding: SPACING.md,
    alignItems: 'center',
  },
  addressText: {
    color: COLORS.text.accent,
    fontSize: FONT.size.md,
    fontWeight: FONT.weight.semibold,
    fontFamily: 'monospace',
  },
  tapCopy: {
    color: COLORS.text.tertiary,
    fontSize: FONT.size.xs,
    marginTop: SPACING.xs,
  },
  balanceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SPACING.xs,
  },
  balanceLabel: {
    color: COLORS.text.secondary,
    fontSize: FONT.size.sm,
    fontWeight: FONT.weight.medium,
  },
  balanceValue: {
    color: COLORS.text.primary,
    fontSize: FONT.size.md,
    fontWeight: FONT.weight.bold,
  },
  networkBadge: {
    backgroundColor: COLORS.bg.warning,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
    borderRadius: RADIUS.sm,
  },
  networkText: {
    color: COLORS.bg.primary,
    fontSize: FONT.size.xs,
    fontWeight: FONT.weight.bold,
  },
  walletDisconnected: {
    paddingVertical: SPACING.sm,
  },
  walletPrompt: {
    color: COLORS.text.secondary,
    fontSize: FONT.size.sm,
    lineHeight: 20,
  },
  connectWrap: {
    alignItems: 'center',
  },

  // Devnet hint
  hintCard: {
    borderColor: COLORS.bg.warning,
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
  hintLink: {
    color: COLORS.text.accent,
    fontWeight: FONT.weight.semibold,
  },

  // App info
  appInfo: {
    alignItems: 'center',
    paddingTop: SPACING.xl,
  },
  appName: {
    color: COLORS.text.tertiary,
    fontSize: FONT.size.sm,
    fontWeight: FONT.weight.semibold,
  },
  appVersion: {
    color: COLORS.text.tertiary,
    fontSize: FONT.size.xs,
    marginTop: 2,
  },
});
