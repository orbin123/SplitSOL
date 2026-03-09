import React, { useState } from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useAppStore } from '@/store/useAppStore';
import { disconnectWalletSession } from '@/utils/mwa';
import { truncateAddress } from '@/utils/formatters';
import { Button } from '@/components/ui/Button';
import { COLORS, SPACING, FONT } from '@/utils/constants';
import * as Haptics from 'expo-haptics';

export const ConnectButton: React.FC = () => {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const user = useAppStore((s) => s.user);
  const setUser = useAppStore((s) => s.setUser);

  const handleConnect = async () => {
    router.push('/(onboarding)/connect' as any);
  };

  const handleDisconnect = async () => {
    setLoading(true);
    try {
      if (user.walletAuthToken) {
        await disconnectWalletSession(user.walletAuthToken);
      }
    } catch {
      // Clear local auth even if wallet-side deauthorization fails.
    } finally {
      setUser(user.name, null, null);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setLoading(false);
      router.replace('/(onboarding)/welcome');
    }
  };

  if (user.walletAddress) {
    return (
      <View style={styles.connected}>
        <View style={styles.dot} />
        <Text style={styles.address}>
          {truncateAddress(user.walletAddress, 6)}
        </Text>
        <Button
          title="Disconnect"
          onPress={() =>
            Alert.alert('Disconnect Wallet', 'Are you sure you want to disconnect?', [
              { text: 'Cancel', style: 'cancel' },
              {
                text: 'Disconnect',
                style: 'destructive',
                onPress: () => {
                  void handleDisconnect();
                },
              },
            ])
          }
          variant="ghost"
          size="sm"
          loading={loading}
        />
      </View>
    );
  }

  return (
    <Button
      title="Connect Solflare Wallet"
      onPress={handleConnect}
      variant="primary"
      icon={<Ionicons name="wallet-outline" size={20} color={COLORS.text.white} />}
    />
  );
};

const styles = StyleSheet.create({
  connected: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderRadius: 9999,
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
