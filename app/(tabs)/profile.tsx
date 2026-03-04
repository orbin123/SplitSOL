import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppStore } from '@/store/useAppStore';
import { Avatar } from '@/components/ui/Avatar';
import { Card } from '@/components/ui/Card';
import { ConnectButton } from '@/components/wallet/ConnectButton';
import { truncateAddress } from '@/utils/formatters';
import { getSOLBalance } from '@/utils/solana';
import {
  COLORS,
  GRADIENTS,
  SPACING,
  FONT,
  RADIUS,
  TAB_BAR_HEIGHT,
  APP,
  SOLANA,
} from '@/utils/constants';

let QRCode: any = null;
try {
  const mod = require('react-native-qrcode-svg');
  QRCode = mod.default || mod;
} catch {}

export default function Profile() {
  const insets = useSafeAreaInsets();
  const user = useAppStore((s) => s.user);
  const walletAddress = useAppStore((s) => s.walletAddress);
  const disconnectWallet = useAppStore((s) => s.disconnectWallet);
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
      contentContainerStyle={[
        styles.content,
        { paddingTop: insets.top + SPACING.xxl },
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
      {/* User Header */}
      <View style={styles.header}>
        <Avatar name={user.name || 'Me'} size={80} />
        <Text style={styles.userName}>{user.name || 'SplitSOL User'}</Text>
        {walletAddress && (
          <TouchableOpacity onPress={copyAddress} style={styles.addressRow}>
            <View style={styles.dot} />
            <Text style={styles.addressText}>
              {truncateAddress(walletAddress, 8)}
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {/* QR Code */}
      {walletAddress && QRCode && (
        <Card style={styles.qrCard}>
          <QRCode
            value={walletAddress}
            size={160}
            color={COLORS.text.primary}
            backgroundColor="transparent"
          />
          <Text style={styles.qrHint}>Scan to add your wallet</Text>
        </Card>
      )}

      {/* SOL Balance */}
      {walletAddress && balance !== null && (
        <LinearGradient
          colors={GRADIENTS.purple}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.balanceGradient}
        >
          <Text style={styles.balanceLabel}>
            {SOLANA.CLUSTER === 'devnet' ? 'DEVNET' : 'MAINNET'} SOL BALANCE
          </Text>
          <Text style={styles.balanceValue}>{balance.toFixed(3)}  SOL</Text>
        </LinearGradient>
      )}

      {/* Connect prompt */}
      {!walletAddress && (
        <Card style={styles.connectCard}>
          <Text style={styles.connectPrompt}>
            Connect your wallet to settle on-chain.
          </Text>
          <ConnectButton />
        </Card>
      )}

      {/* Settings */}
      <View style={styles.settingsList}>
        <SettingsItem
          icon="notifications-outline"
          label="Notifications"
          value="On"
        />
        <SettingsItem
          icon="globe-outline"
          label="Network"
          value={SOLANA.CLUSTER === 'devnet' ? 'Devnet' : 'Mainnet'}
        />
        <SettingsItem
          icon="heart-outline"
          label={`About ${APP.NAME}`}
          value={`v${APP.VERSION}`}
        />
        {walletAddress && (
          <TouchableOpacity
            style={styles.settingsRow}
            onPress={() => {
              Alert.alert('Disconnect Wallet', 'Are you sure?', [
                { text: 'Cancel', style: 'cancel' },
                {
                  text: 'Disconnect',
                  style: 'destructive',
                  onPress: disconnectWallet,
                },
              ]);
            }}
          >
            <Ionicons
              name="log-out-outline"
              size={20}
              color={COLORS.text.danger}
            />
            <Text style={[styles.settingsLabel, { color: COLORS.text.danger }]}>
              Disconnect Wallet
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </ScrollView>
  );
}

function SettingsItem({
  icon,
  label,
  value,
}: {
  icon: string;
  label: string;
  value: string;
}) {
  return (
    <View style={styles.settingsRow}>
      <Ionicons name={icon as any} size={20} color={COLORS.text.secondary} />
      <Text style={styles.settingsLabel}>{label}</Text>
      <Text style={styles.settingsValue}>{value}</Text>
    </View>
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

  header: {
    alignItems: 'center',
    gap: SPACING.sm,
  },
  userName: {
    color: COLORS.text.primary,
    fontSize: FONT.size.xxl,
    fontWeight: FONT.weight.bold,
  },
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
  addressText: {
    color: COLORS.text.secondary,
    fontSize: FONT.size.sm,
  },

  qrCard: {
    alignItems: 'center',
    paddingVertical: SPACING.xxl,
    gap: SPACING.md,
  },
  qrHint: {
    color: COLORS.text.tertiary,
    fontSize: FONT.size.sm,
  },

  balanceGradient: {
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

  connectCard: {
    alignItems: 'center',
    gap: SPACING.md,
    paddingVertical: SPACING.xxl,
  },
  connectPrompt: {
    color: COLORS.text.secondary,
    fontSize: FONT.size.md,
    textAlign: 'center',
  },

  settingsList: {
    backgroundColor: COLORS.bg.secondary,
    borderRadius: RADIUS.lg,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  settingsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.lg,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border.default,
    gap: SPACING.md,
  },
  settingsLabel: {
    flex: 1,
    color: COLORS.text.primary,
    fontSize: FONT.size.md,
    fontWeight: FONT.weight.medium,
  },
  settingsValue: {
    color: COLORS.text.tertiary,
    fontSize: FONT.size.sm,
  },
});
