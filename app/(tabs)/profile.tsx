import React, { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Card } from '@/components/ui/Card';
import { ConnectButton } from '@/components/wallet/ConnectButton';
import { useAppStore } from '@/store/useAppStore';
import { buildContactQrPayload } from '@/utils/contactQr';
import { APP, COLORS, FONT, RADIUS, SOLANA, SPACING, TAB_BAR_HEIGHT } from '@/utils/constants';
import { truncateAddress } from '@/utils/formatters';
import { disconnectWalletSession } from '@/utils/mwa';
import { requestNotificationPermission } from '@/utils/notifications';
import { getSOLBalance } from '@/utils/solana';

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
  const setNotificationsEnabled = useAppStore((s) => s.setNotificationsEnabled);

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
      // Local logout should still proceed if wallet cleanup fails.
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
      Alert.alert(
        'Connection Error',
        'Unable to fetch SOL balance. Check your internet connection.',
      );
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
    Alert.alert('Copied', 'Full wallet address copied to clipboard.');
  };

  const handleToggleNotifications = async (enabled: boolean) => {
    if (enabled) {
      const granted = await requestNotificationPermission();
      if (!granted) {
        Alert.alert(
          'Notifications Disabled',
          'Permission was not granted, so notifications will stay off.',
        );
        setNotificationsEnabled(false);
        return;
      }
    }

    setNotificationsEnabled(enabled);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
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
        { paddingTop: insets.top + SPACING.xl },
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
      <Card style={styles.profileCard}>
        <Text style={styles.sectionEyebrow}>Profile</Text>

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
            <TouchableOpacity onPress={saveName} style={styles.inlineIconButton}>
              <Ionicons name="checkmark-circle" size={28} color={COLORS.bg.accent} />
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity
            style={styles.row}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setDraftName(user.name);
              setEditingName(true);
            }}
            activeOpacity={0.75}
          >
            <View style={styles.rowCopy}>
              <Text style={styles.fieldLabel}>Username</Text>
              <Text style={styles.primaryValue}>{user.name || 'SplitSOL User'}</Text>
            </View>
            <Ionicons name="pencil-outline" size={18} color={COLORS.text.tertiary} />
          </TouchableOpacity>
        )}

        <View style={styles.divider} />

        <TouchableOpacity
          style={styles.row}
          onPress={() => {
            void copyAddress();
          }}
          activeOpacity={0.75}
          disabled={!walletAddress}
        >
          <View style={styles.rowCopy}>
            <Text style={styles.fieldLabel}>Connected Wallet</Text>
            <Text style={styles.secondaryValue}>
              {walletAddress ? truncateAddress(walletAddress, 8) : 'Not connected'}
            </Text>
          </View>
          {walletAddress && (
            <Ionicons name="copy-outline" size={18} color={COLORS.text.tertiary} />
          )}
        </TouchableOpacity>

        <View style={styles.divider} />

        <View style={styles.row}>
          <View style={styles.rowCopy}>
            <Text style={styles.fieldLabel}>Current SOL Balance</Text>
            <Text style={styles.primaryValue}>
              {walletAddress && balance !== null ? `${balance.toFixed(3)} SOL` : '--'}
            </Text>
          </View>
          <Text style={styles.networkPill}>
            {SOLANA.CLUSTER === 'devnet' ? 'Devnet' : 'Mainnet'}
          </Text>
        </View>
      </Card>

      {walletAddress && QRCode && contactQrValue && (
        <Card style={styles.qrCard}>
          <Text style={styles.sectionTitle}>Your QR Code</Text>
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

      {!walletAddress && (
        <Card style={styles.connectCard}>
          <Text style={styles.connectPrompt}>
            Connect your wallet to settle on-chain and share your QR identity.
          </Text>
          <ConnectButton />
        </Card>
      )}

      <Card style={styles.actionCard} onPress={() => router.push('/contacts' as any)}>
        <View style={styles.rowCopy}>
          <Text style={styles.sectionTitle}>My Contacts</Text>
          <Text style={styles.sectionSub}>
            {contacts.length} contact{contacts.length === 1 ? '' : 's'}
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color={COLORS.text.tertiary} />
      </Card>

      <Card style={styles.toggleCard}>
        <View style={styles.rowCopy}>
          <Text style={styles.sectionTitle}>Notification Settings</Text>
          <Text style={styles.sectionSub}>
            {user.notificationsEnabled ? 'Enabled' : 'Disabled'}
          </Text>
        </View>
        <Switch
          value={user.notificationsEnabled}
          onValueChange={(value) => {
            void handleToggleNotifications(value);
          }}
          trackColor={{ false: COLORS.border.default, true: COLORS.bg.accentSoft }}
          thumbColor={
            user.notificationsEnabled ? COLORS.bg.accent : COLORS.text.tertiary
          }
        />
      </Card>

      {walletAddress && (
        <Card
          style={styles.disconnectCard}
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
          <View style={styles.rowCopy}>
            <Text style={styles.disconnectTitle}>Disconnect Wallet</Text>
            <Text style={styles.sectionSub}>
              Clears local auth and returns you to onboarding.
            </Text>
          </View>
          <Ionicons name="log-out-outline" size={22} color={COLORS.text.danger} />
        </Card>
      )}

      <Card style={styles.actionCard} onPress={() => router.push('/about' as any)}>
        <View style={styles.rowCopy}>
          <Text style={styles.sectionTitle}>About {APP.NAME}</Text>
          <Text style={styles.sectionSub}>
            Learn how wallet auth and crypto group payments work.
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color={COLORS.text.tertiary} />
      </Card>
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
  profileCard: {
    gap: SPACING.md,
  },
  sectionEyebrow: {
    color: COLORS.text.tertiary,
    fontSize: FONT.size.xs,
    fontWeight: FONT.weight.semibold,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  sectionTitle: {
    color: COLORS.text.primary,
    fontSize: FONT.size.md,
    fontWeight: FONT.weight.semibold,
  },
  sectionSub: {
    color: COLORS.text.secondary,
    fontSize: FONT.size.sm,
    marginTop: SPACING.xs,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: SPACING.md,
  },
  rowCopy: {
    flex: 1,
  },
  fieldLabel: {
    color: COLORS.text.tertiary,
    fontSize: FONT.size.xs,
    fontWeight: FONT.weight.semibold,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  primaryValue: {
    color: COLORS.text.primary,
    fontSize: FONT.size.lg,
    fontWeight: FONT.weight.bold,
    marginTop: SPACING.xs,
  },
  secondaryValue: {
    color: COLORS.text.secondary,
    fontSize: FONT.size.md,
    marginTop: SPACING.xs,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.border.default,
  },
  editNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  editNameInput: {
    flex: 1,
    color: COLORS.text.primary,
    fontSize: FONT.size.lg,
    fontWeight: FONT.weight.bold,
    borderBottomWidth: 2,
    borderBottomColor: COLORS.bg.accent,
    paddingVertical: SPACING.xs,
  },
  inlineIconButton: {
    padding: SPACING.xs,
  },
  networkPill: {
    color: COLORS.text.accent,
    fontSize: FONT.size.sm,
    fontWeight: FONT.weight.semibold,
    backgroundColor: COLORS.bg.accentSoft,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.full,
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
  actionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: SPACING.md,
  },
  toggleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: SPACING.md,
  },
  disconnectCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: SPACING.md,
  },
  disconnectTitle: {
    color: COLORS.text.danger,
    fontSize: FONT.size.md,
    fontWeight: FONT.weight.semibold,
  },
});
