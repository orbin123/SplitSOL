import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
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
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppStore } from '@/store/useAppStore';
import { Avatar } from '@/components/ui/Avatar';
import { Card } from '@/components/ui/Card';
import { ConnectButton } from '@/components/wallet/ConnectButton';
import { truncateAddress } from '@/utils/formatters';
import { getSOLBalance } from '@/utils/solana';
import { disconnectWalletSession } from '@/utils/mwa';
import { buildContactQrPayload } from '@/utils/contactQr';
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
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const user = useAppStore((s) => s.user);
  const contacts = useAppStore((s) => s.contacts);
  const setUser = useAppStore((s) => s.setUser);
  const [balance, setBalance] = useState<number | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [editingName, setEditingName] = useState(false);
  const [draftName, setDraftName] = useState(user.name);
  const walletAddress = user.walletAddress;

  const saveName = () => {
    const trimmed = draftName.trim();
    if (trimmed) {
      setUser(trimmed.slice(0, 20), user.walletAddress, user.walletAuthToken);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } else {
      setDraftName(user.name);
    }
    setEditingName(false);
  };

  const handleDisconnect = async () => {
    try {
      if (user.walletAuthToken) {
        await disconnectWalletSession(user.walletAuthToken);
      }
    } catch {
      // Local logout should still proceed if wallet-side cleanup fails.
    } finally {
      setUser(user.name, null, null);
      router.replace('/(onboarding)/welcome');
    }
  };

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

  const copyAddress = async () => {
    if (!walletAddress) return;
    await Clipboard.setStringAsync(walletAddress);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    Alert.alert('Copied!', 'Wallet address copied to clipboard.');
  };

  const contactQrValue =
    user.name && walletAddress
      ? buildContactQrPayload(user.name, walletAddress)
      : null;

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
        {editingName ? (
          <View style={styles.editNameRow}>
            <TextInput
              style={styles.editNameInput}
              value={draftName}
              onChangeText={setDraftName}
              autoFocus
              maxLength={20}
              returnKeyType="done"
              onSubmitEditing={saveName}
              onBlur={saveName}
              selectTextOnFocus
            />
            <TouchableOpacity onPress={saveName} style={styles.editNameBtn}>
              <Ionicons name="checkmark-circle" size={28} color={COLORS.bg.accent} />
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity
            style={styles.nameRow}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setDraftName(user.name);
              setEditingName(true);
            }}
            activeOpacity={0.7}
          >
            <Text style={styles.userName}>{user.name || 'SplitSOL User'}</Text>
            <Ionicons name="pencil-outline" size={16} color={COLORS.text.tertiary} />
          </TouchableOpacity>
        )}
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
      {walletAddress && QRCode && contactQrValue && (
        <Card style={styles.qrCard}>
          <QRCode
            value={contactQrValue}
            size={184}
            color={COLORS.text.primary}
            backgroundColor="transparent"
          />
          <Text style={styles.qrHint}>Scan to add me on SplitSOL</Text>
          <Text style={styles.qrSubhint}>
            This QR shares your display name and wallet address.
          </Text>
        </Card>
      )}

      <Card
        style={styles.contactsCard}
        onPress={() => router.push('/contacts' as any)}
      >
        <View style={styles.contactsCopy}>
          <Text style={styles.contactsTitle}>My Contacts</Text>
          <Text style={styles.contactsSub}>
            {contacts.length} SplitSOL member
            {contacts.length === 1 ? '' : 's'}
          </Text>
        </View>
        <Ionicons
          name="chevron-forward"
          size={20}
          color={COLORS.text.tertiary}
        />
      </Card>

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
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
              Alert.alert('Disconnect Wallet', 'Are you sure?', [
                { text: 'Cancel', style: 'cancel' },
                {
                  text: 'Disconnect',
                  style: 'destructive',
                  onPress: () => {
                    void handleDisconnect();
                  },
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
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  editNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  editNameInput: {
    color: COLORS.text.primary,
    fontSize: FONT.size.xxl,
    fontWeight: FONT.weight.bold,
    borderBottomWidth: 2,
    borderBottomColor: COLORS.bg.accent,
    paddingVertical: SPACING.xs,
    minWidth: 120,
    textAlign: 'center',
  },
  editNameBtn: {
    padding: SPACING.xs,
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
    color: COLORS.text.primary,
    fontSize: FONT.size.md,
    fontWeight: FONT.weight.semibold,
  },
  qrSubhint: {
    color: COLORS.text.tertiary,
    fontSize: FONT.size.sm,
    textAlign: 'center',
    lineHeight: 20,
  },
  contactsCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  contactsCopy: {
    flex: 1,
  },
  contactsTitle: {
    color: COLORS.text.primary,
    fontSize: FONT.size.md,
    fontWeight: FONT.weight.semibold,
  },
  contactsSub: {
    color: COLORS.text.secondary,
    fontSize: FONT.size.sm,
    marginTop: 2,
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
