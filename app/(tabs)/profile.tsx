import React, { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  Modal,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Switch,
} from 'react-native';
import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Card } from '@/components/ui/Card';
import { ConnectButton } from '@/components/wallet/ConnectButton';
import { useAppStore } from '@/store/useAppStore';
import { buildMemberQrPayload } from '@/utils/memberQr';
import { APP, COLORS, FONT, RADIUS, SOLANA, SPACING, TAB_BAR_HEIGHT } from '@/utils/constants';
import { truncateAddress } from '@/utils/formatters';
import { isValidWalletAddress } from '@/utils/memberQr';
import { disconnectWalletSession } from '@/utils/mwa';
import { getSOLBalance } from '@/utils/solana';

let QRCode: any = null;
try {
  const mod = require('react-native-qrcode-svg');
  QRCode = mod.default || mod;
} catch { }

export default function Profile() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const user = useAppStore((s) => s.user);
  const setUser = useAppStore((s) => s.setUser);
  const setNotificationsEnabled = useAppStore((s) => s.setNotificationsEnabled);

  const [balance, setBalance] = useState<number | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [editingName, setEditingName] = useState(false);
  const [draftName, setDraftName] = useState(user.name);
  const [showQrModal, setShowQrModal] = useState(false);
  const [showNotificationModal, setShowNotificationModal] = useState(false);
  const [showDisconnectModal, setShowDisconnectModal] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);

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
    if (!walletAddress || !isValidWalletAddress(walletAddress)) {
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

  const memberQrValue =
    user.name && walletAddress
      ? buildMemberQrPayload(user.name, walletAddress)
      : null;

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
        <Text style={styles.headerTitle}>Profile</Text>

        {/* Profile Hero */}
        <View style={styles.heroCard}>
          <View style={styles.heroContent}>
            <View style={styles.avatarWrapper}>
              <Text style={styles.avatarText}>
                {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
              </Text>
            </View>

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
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setDraftName(user.name);
                  setEditingName(true);
                }}
                activeOpacity={0.75}
              >
                <Text style={styles.heroName}>{user.name || 'SplitSOL User'}</Text>
              </TouchableOpacity>
            )}

            <Text style={styles.heroAddress}>
              {walletAddress ? truncateAddress(walletAddress, 8) : 'Not connected'}
            </Text>

            {walletAddress && memberQrValue && QRCode && (
              <TouchableOpacity
                style={styles.qrIconBtn}
                onPress={() => setShowQrModal(true)}
                activeOpacity={0.7}
              >
                <Ionicons name="qr-code-outline" size={20} color="#374151" />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {!walletAddress && (
          <View style={styles.glassCard}>
            <Text style={styles.connectPrompt}>
              Connect your wallet to settle on-chain and share your QR identity.
            </Text>
            <ConnectButton />
          </View>
        )}

        {/* Settings List */}
        <View style={styles.glassCard}>
          <TouchableOpacity
            style={styles.settingsRow}
            onPress={() => router.push('/members' as any)}
            activeOpacity={0.7}
          >
            <Ionicons name="people-outline" size={24} color="#374151" />
            <Text style={styles.settingsLabel}>My Members</Text>
            <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
          </TouchableOpacity>
          <View style={styles.divider} />

          <TouchableOpacity
            style={styles.settingsRow}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setShowNotificationModal(true);
            }}
            activeOpacity={0.7}
          >
            <Ionicons name="notifications-outline" size={24} color="#374151" />
            <Text style={styles.settingsLabel}>Notifications</Text>
            <Text style={{ color: '#6B7280', fontSize: 16, marginRight: 8 }}>
              {user.notificationsEnabled ? 'On' : 'Off'}
            </Text>
            <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
          </TouchableOpacity>
          <View style={styles.divider} />

          <View style={styles.settingsRow}>
            <Ionicons name="globe-outline" size={24} color="#374151" />
            <Text style={styles.settingsLabel}>Network</Text>
            <View style={styles.devnetPill}>
              <Text style={styles.devnetPillText}>
                {SOLANA.CLUSTER === 'devnet' ? 'Devnet' : 'Mainnet'}
              </Text>
            </View>
          </View>
          <View style={styles.divider} />

          <TouchableOpacity
            style={styles.settingsRow}
            onPress={() => router.push('/about' as any)}
            activeOpacity={0.7}
          >
            <Ionicons name="information-circle-outline" size={24} color="#374151" />
            <Text style={styles.settingsLabel}>About SplitSOL</Text>
            <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
          </TouchableOpacity>
        </View>

        {/* Danger Section */}
        {walletAddress && (
          <View style={[styles.glassCard, styles.dangerCard]}>
            <TouchableOpacity
              style={styles.settingsRow}
              onPress={() => {
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
                setShowDisconnectModal(true);
              }}
              activeOpacity={0.7}
            >
              <Ionicons name="power" size={24} color="#EF4444" />
              <Text style={styles.dangerText}>Disconnect Wallet</Text>
            </TouchableOpacity>
            <View style={styles.divider} />
            <TouchableOpacity
              style={styles.settingsRow}
              onPress={() => {
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
                setShowResetModal(true);
              }}
              activeOpacity={0.7}
            >
              <Ionicons name="trash-outline" size={24} color="#EF4444" />
              <Text style={styles.dangerText}>Reset App Data</Text>
            </TouchableOpacity>
          </View>
        )}

        {walletAddress && memberQrValue && QRCode && (
          <Modal
            visible={showQrModal}
            transparent
            animationType="fade"
            onRequestClose={() => setShowQrModal(false)}
          >
            <TouchableOpacity
              style={styles.modalOverlay}
              activeOpacity={1}
              onPress={() => setShowQrModal(false)}
            >
              <View style={styles.modalContent}>
                <Card style={styles.qrModalCard}>
                  <Text style={styles.qrModalTitle}>Your QR Code</Text>
                  <QRCode
                    value={memberQrValue}
                    size={184}
                    color={COLORS.text.primary}
                    backgroundColor="transparent"
                  />
                  <Text style={styles.qrModalHint}>Scan to add me on SplitSOL</Text>
                  <TouchableOpacity
                    onPress={() => setShowQrModal(false)}
                    style={styles.qrModalClose}
                  >
                    <Text style={styles.qrModalCloseText}>Close</Text>
                  </TouchableOpacity>
                </Card>
              </View>
            </TouchableOpacity>
          </Modal>
        )}

        {/* Notification Settings Modal */}
        <Modal
          visible={showNotificationModal}
          transparent
          animationType="fade"
          onRequestClose={() => setShowNotificationModal(false)}
        >
          <TouchableOpacity
            style={styles.modalOverlay}
            activeOpacity={1}
            onPress={() => setShowNotificationModal(false)}
          >
            <View style={styles.modalContent}>
              <Card style={styles.notificationModalCard}>
                <View style={styles.notificationModalHeader}>
                  <Text style={styles.notificationModalTitle}>Notifications</Text>
                  <TouchableOpacity onPress={() => setShowNotificationModal(false)} style={styles.notificationModalCloseBtn}>
                    <Ionicons name="close" size={24} color={COLORS.text.tertiary} />
                  </TouchableOpacity>
                </View>

                <Text style={styles.notificationModalDesc}>
                  Receive real-time alerts for new expenses, settlements, and group activities.
                </Text>

                <View style={styles.notificationModalToggleRow}>
                  <Text style={styles.notificationModalToggleLabel}>Push Notifications</Text>
                  <Switch
                    value={user.notificationsEnabled}
                    onValueChange={(val) => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      setNotificationsEnabled(val);
                    }}
                    trackColor={{ false: '#9CA3AF', true: COLORS.bg.accent }}
                    thumbColor="#FFFFFF"
                    ios_backgroundColor="#9CA3AF"
                    style={{ transform: [{ scale: 1.15 }] }}
                  />
                </View>
              </Card>
            </View>
          </TouchableOpacity>
        </Modal>

        {/* Disconnect Warning Modal */}
        <Modal
          visible={showDisconnectModal}
          transparent
          animationType="fade"
          onRequestClose={() => setShowDisconnectModal(false)}
        >
          <TouchableOpacity
            style={styles.modalOverlay}
            activeOpacity={1}
            onPress={() => setShowDisconnectModal(false)}
          >
            <View style={styles.modalContent}>
              <Card style={styles.notificationModalCard}>
                <View style={styles.notificationModalHeader}>
                  <Text style={[styles.notificationModalTitle, { color: COLORS.bg.danger }]}>Disconnect Wallet</Text>
                  <TouchableOpacity onPress={() => setShowDisconnectModal(false)} style={styles.notificationModalCloseBtn}>
                    <Ionicons name="close" size={24} color={COLORS.text.tertiary} />
                  </TouchableOpacity>
                </View>

                <Text style={styles.notificationModalDesc}>
                  Are you sure you want to disconnect your wallet?
                </Text>

                <View style={styles.modalActionRow}>
                  <TouchableOpacity
                    style={[styles.modalActionBtn, styles.modalCancelBtn]}
                    onPress={() => setShowDisconnectModal(false)}
                  >
                    <Text style={styles.modalCancelBtnText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.modalActionBtn, styles.modalDestructiveBtn]}
                    onPress={() => {
                      setShowDisconnectModal(false);
                      void handleDisconnect();
                    }}
                  >
                    <Text style={styles.modalDestructiveBtnText}>Disconnect</Text>
                  </TouchableOpacity>
                </View>
              </Card>
            </View>
          </TouchableOpacity>
        </Modal>

        {/* Reset App Data Modal */}
        <Modal
          visible={showResetModal}
          transparent
          animationType="fade"
          onRequestClose={() => setShowResetModal(false)}
        >
          <TouchableOpacity
            style={styles.modalOverlay}
            activeOpacity={1}
            onPress={() => setShowResetModal(false)}
          >
            <View style={styles.modalContent}>
              <Card style={styles.notificationModalCard}>
                <View style={styles.notificationModalHeader}>
                  <Text style={[styles.notificationModalTitle, { color: COLORS.bg.danger }]}>Reset App Data</Text>
                  <TouchableOpacity onPress={() => setShowResetModal(false)} style={styles.notificationModalCloseBtn}>
                    <Ionicons name="close" size={24} color={COLORS.text.tertiary} />
                  </TouchableOpacity>
                </View>

                <Text style={styles.notificationModalDesc}>
                  This will clear all local data. Are you sure?
                </Text>

                <View style={styles.modalActionRow}>
                  <TouchableOpacity
                    style={[styles.modalActionBtn, styles.modalCancelBtn]}
                    onPress={() => setShowResetModal(false)}
                  >
                    <Text style={styles.modalCancelBtnText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.modalActionBtn, styles.modalDestructiveBtn]}
                    onPress={() => {
                      setShowResetModal(false);
                      setUser('', null, null);
                      router.replace('/(onboarding)/welcome');
                    }}
                  >
                    <Text style={styles.modalDestructiveBtnText}>Reset</Text>
                  </TouchableOpacity>
                </View>
              </Card>
            </View>
          </TouchableOpacity>
        </Modal>

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
    paddingBottom: TAB_BAR_HEIGHT + SPACING.xxxl + 20,
  },
  headerTitle: {
    color: '#111827',
    fontSize: 30,
    fontWeight: '800',
    letterSpacing: -0.5,
    marginBottom: SPACING.xxxl,
  },
  heroCard: {
    marginBottom: SPACING.xl,
    backgroundColor: 'rgba(255, 255, 255, 0.45)',
    borderRadius: 32,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.8)',
    alignItems: 'center',
    paddingVertical: 36,
  },
  heroContent: {
    alignItems: 'center',
  },
  avatarWrapper: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#EBE0FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  avatarText: {
    color: '#7C3AED',
    fontSize: 40,
    fontWeight: '800',
  },
  heroName: {
    color: '#111827',
    fontSize: 24,
    fontWeight: '800',
    marginBottom: 8,
  },
  heroAddress: {
    color: '#6B7280',
    fontSize: 14,
    fontFamily: 'Courier',
    letterSpacing: 1,
    marginBottom: 16,
  },
  qrIconBtn: {
    backgroundColor: '#F3F4F6',
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  editNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: SPACING.sm,
  },
  editNameInput: {
    flex: 1,
    color: '#111827',
    fontSize: 24,
    fontWeight: '800',
    borderBottomWidth: 2,
    borderBottomColor: '#7C3AED',
    paddingVertical: SPACING.xs,
    minWidth: 120,
    textAlign: 'center',
  },
  inlineIconButton: {
    padding: SPACING.xs,
  },
  glassCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.45)',
    borderRadius: 32,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.8)',
    overflow: 'hidden',
    marginBottom: SPACING.lg,
  },
  connectPrompt: {
    color: '#6B7280',
    fontSize: FONT.size.md,
    textAlign: 'center',
    margin: SPACING.xl,
  },
  settingsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    gap: 16,
  },
  settingsLabel: {
    flex: 1,
    color: '#111827',
    fontSize: 16,
    fontWeight: '700',
  },
  devnetPill: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  devnetPillText: {
    color: '#F59E0B',
    fontSize: 13,
    fontWeight: '700',
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.04)',
    marginLeft: 60,
  },
  dangerCard: {
    backgroundColor: 'rgba(239, 68, 68, 0.05)',
  },
  dangerText: {
    color: '#EF4444',
    fontSize: 16,
    fontWeight: '700',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xl,
  },
  modalContent: {
    width: '100%',
    maxWidth: 320,
  },
  qrModalCard: {
    alignItems: 'center',
    paddingVertical: SPACING.xxl,
    gap: SPACING.md,
  },
  qrModalTitle: {
    color: COLORS.bg.dark,
    fontSize: FONT.size.lg,
    fontWeight: FONT.weight.bold,
  },
  qrModalHint: {
    color: COLORS.text.secondary,
    fontSize: FONT.size.sm,
  },
  qrModalClose: {
    marginTop: SPACING.md,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.xl,
  },
  qrModalCloseText: {
    color: COLORS.bg.accent,
    fontSize: FONT.size.md,
    fontWeight: FONT.weight.semibold,
  },
  notificationModalCard: {
    padding: SPACING.xl,
  },
  notificationModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  notificationModalTitle: {
    color: COLORS.bg.dark,
    fontSize: FONT.size.xl,
    fontWeight: FONT.weight.bold,
  },
  notificationModalCloseBtn: {
    padding: SPACING.xs,
  },
  notificationModalDesc: {
    color: COLORS.text.secondary,
    fontSize: FONT.size.md,
    lineHeight: 22,
    marginBottom: SPACING.xl,
  },
  notificationModalToggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.bg.tertiary,
    padding: SPACING.lg,
    borderRadius: RADIUS.lg,
  },
  notificationModalToggleLabel: {
    color: COLORS.text.primary,
    fontSize: FONT.size.md,
    fontWeight: FONT.weight.semibold,
  },
  modalActionRow: {
    flexDirection: 'row',
    gap: SPACING.md,
    marginTop: SPACING.md,
  },
  modalActionBtn: {
    flex: 1,
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCancelBtn: {
    backgroundColor: COLORS.bg.tertiary,
  },
  modalCancelBtnText: {
    color: COLORS.text.primary,
    fontSize: FONT.size.md,
    fontWeight: FONT.weight.semibold,
  },
  modalDestructiveBtn: {
    backgroundColor: COLORS.bg.danger,
  },
  modalDestructiveBtnText: {
    color: COLORS.text.white,
    fontSize: FONT.size.md,
    fontWeight: FONT.weight.bold,
  },
});

