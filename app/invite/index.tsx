import React from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppStore } from '@/store/useAppStore';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { buildContactQrPayload } from '@/utils/contactQr';
import { truncateAddress } from '@/utils/formatters';
import { COLORS, FONT, RADIUS, SPACING } from '@/utils/constants';

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
      ? buildContactQrPayload(user.name, user.walletAddress)
      : null;

  const copyAddress = async () => {
    if (!user.walletAddress) return;

    await Clipboard.setStringAsync(user.walletAddress);
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    Alert.alert('Copied', 'Wallet address copied to clipboard.');
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
        { paddingTop: insets.top + SPACING.lg },
      ]}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.header}>
        <Text style={styles.title}>Invite with Your QR</Text>
        <Text style={styles.subtitle}>
          Let another SplitSOL member scan this to add you instantly.
        </Text>
      </View>

      <Card style={styles.qrCard}>
        <QRCode
          value={qrValue}
          size={220}
          color={COLORS.text.primary}
          backgroundColor="transparent"
        />
        <Text style={styles.name}>{user.name}</Text>
        <TouchableOpacity
          style={styles.addressPill}
          activeOpacity={0.75}
          onPress={() => {
            void copyAddress();
          }}
        >
          <Ionicons
            name="copy-outline"
            size={16}
            color={COLORS.text.accent}
          />
          <Text style={styles.addressText}>
            {truncateAddress(user.walletAddress, 8)}
          </Text>
        </TouchableOpacity>
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
    paddingHorizontal: SPACING.xl,
    paddingBottom: SPACING.xxxl,
    gap: SPACING.xl,
  },
  header: {
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  title: {
    color: COLORS.text.primary,
    fontSize: FONT.size.xxl,
    fontWeight: FONT.weight.bold,
  },
  subtitle: {
    color: COLORS.text.secondary,
    fontSize: FONT.size.md,
    textAlign: 'center',
    marginTop: SPACING.sm,
    lineHeight: 22,
  },
  qrCard: {
    alignItems: 'center',
    gap: SPACING.lg,
    paddingVertical: SPACING.xxxl,
  },
  name: {
    color: COLORS.text.primary,
    fontSize: FONT.size.xl,
    fontWeight: FONT.weight.semibold,
  },
  addressPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    backgroundColor: COLORS.bg.accentSoft,
    borderRadius: RADIUS.full,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
  },
  addressText: {
    color: COLORS.text.accent,
    fontSize: FONT.size.sm,
    fontWeight: FONT.weight.semibold,
  },
});
