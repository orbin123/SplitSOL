import React, { useState } from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';
import { useAppStore } from '@/store/useAppStore';
import { connectWallet } from '@/utils/mwa';
import { truncateAddress } from '@/utils/formatters';
import { Button } from '@/components/ui/Button';
import { COLORS, SPACING, FONT, RADIUS } from '@/utils/constants';
import * as Haptics from 'expo-haptics';

export const ConnectButton: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const walletAddress = useAppStore((s) => s.walletAddress);
  const setWallet = useAppStore((s) => s.setWallet);
  const disconnectWallet = useAppStore((s) => s.disconnectWallet);

  const handleConnect = async () => {
    setLoading(true);
    try {
      const result = await connectWallet();
      setWallet(result.address, result.authToken);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error: any) {
      const msg = error?.message ?? '';
      if (msg.includes('User rejected') || msg.includes('rejected')) {
        Alert.alert('Cancelled', 'Wallet connection was cancelled.');
      } else if (msg.includes('not installed') || msg.includes('No wallet')) {
        Alert.alert('No Wallet Found', 'Make sure Phantom or another MWA-compatible wallet is installed.');
      } else {
        Alert.alert('Connection Failed', 'Make sure Phantom is installed and try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  if (walletAddress) {
    return (
      <View style={styles.connected}>
        <View style={styles.dot} />
        <Text style={styles.address}>
          {truncateAddress(walletAddress, 6)}
        </Text>
        <Button
          title="Disconnect"
          onPress={disconnectWallet}
          variant="ghost"
          size="sm"
        />
      </View>
    );
  }

  return (
    <Button
      title="Connect Wallet"
      onPress={handleConnect}
      loading={loading}
      variant="primary"
    />
  );
};

const styles = StyleSheet.create({
  connected: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.bg.tertiary,
    borderRadius: RADIUS.full,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.lg,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.bg.success,
    marginRight: SPACING.sm,
  },
  address: {
    color: COLORS.text.primary,
    fontSize: FONT.size.sm,
    fontWeight: FONT.weight.medium,
    flex: 1,
  },
});
