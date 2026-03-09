import React from 'react';
import {
  Alert,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppStore } from '@/store/useAppStore';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { buildMemberQrPayload } from '@/utils/memberQr';
import { truncateAddress } from '@/utils/formatters';
import { COLORS, FONT, SPACING } from '@/utils/constants';

let QRCode: any = null;
try {
  const mod = require('react-native-qrcode-svg');
  QRCode = mod.default || mod;
} catch {}

export default function InviteScreen() {
  const insets = useSafeAreaInsets();
  const user = useAppStore((s) => s.user);

  const qrValue =
    user.name && user.walletAddress
      ? buildMemberQrPayload(user.name, user.walletAddress)
      : null;

  const copyAddress = async () => {
    if (!user.walletAddress) return;

    await Clipboard.setStringAsync(user.walletAddress);
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    Alert.alert('Copied', 'Wallet address copied to clipboard.');
  };

  const shareQr = async () => {
    if (!user.walletAddress || !user.name || !qrValue) return;
    try {
      await Share.share({
        message: `SplitSOL: Add me! ${user.name} - ${user.walletAddress}`,
        title: 'Share your QR',
      });
    } catch {
      await copyAddress();
    }
  };

  if (!user.walletAddress || !user.name || !QRCode || !qrValue) {
    return (
      <View style={styles.container}>
        <EmptyState
          emoji="🔗"
          title="Invite unavailable"
          subtitle="Connect your wallet and set your display name to show your SplitSOL QR code."
        />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[
        styles.content,
        { paddingTop: insets.top + SPACING.lg + 56 },
      ]}
      showsVerticalScrollIndicator={false}
    >
      <Card style={styles.qrCard}>
        <View style={styles.qrWrap}>
          <QRCode
            value={qrValue}
            size={200}
            color={COLORS.text.primary}
            backgroundColor={COLORS.bg.secondary}
          />
        </View>
        <Text style={styles.name}>{user.name}</Text>
        <Text style={styles.address}>
          {truncateAddress(user.walletAddress, 8)}
        </Text>
        <Button
          title="Copy Address"
          variant="secondary"
          size="sm"
          onPress={() => void copyAddress()}
          icon={<Ionicons name="copy-outline" size={16} color={COLORS.bg.accent} />}
        />
      </Card>

      <View style={styles.shareSection}>
        <Text style={styles.shareLabel}>
          Share your QR so others can add you
        </Text>
        <Button
          title="Share"
          onPress={() => void shareQr()}
          icon={<Ionicons name="share-outline" size={18} color={COLORS.text.white} />}
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  content: {
    paddingHorizontal: SPACING.xl,
    paddingBottom: SPACING.xxxl,
    gap: SPACING.xxl,
    alignItems: 'center',
  },
  qrCard: {
    alignItems: 'center',
    paddingVertical: SPACING.xxl,
    paddingHorizontal: SPACING.xxl,
    width: '100%',
  },
  qrWrap: {
    backgroundColor: COLORS.bg.secondary,
    padding: SPACING.lg,
    borderRadius: 12,
  },
  name: {
    color: COLORS.text.primary,
    fontSize: FONT.size.xl,
    fontWeight: FONT.weight.bold,
    marginTop: SPACING.lg,
  },
  address: {
    color: COLORS.text.secondary,
    fontSize: FONT.size.sm,
    marginTop: SPACING.xs,
  },
  shareSection: {
    width: '100%',
    gap: SPACING.md,
  },
  shareLabel: {
    color: COLORS.text.secondary,
    fontSize: FONT.size.sm,
    textAlign: 'center',
  },
});
