import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useAppStore } from '@/store/useAppStore';
import { truncateAddress } from '@/utils/formatters';
import { COLORS, FONT, SPACING } from '@/utils/constants';

export const WalletBadge: React.FC = () => {
  const walletAddress = useAppStore((s) => s.user.walletAddress);

  if (!walletAddress) return null;

  return (
    <View style={styles.pill}>
      <View style={styles.dot} />
      <Text style={styles.connected}>Connected</Text>
      <Text style={styles.address} numberOfLines={1}>
        {truncateAddress(walletAddress, 6)}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderRadius: 9999,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.bg.success,
    marginRight: SPACING.sm,
  },
  connected: {
    color: COLORS.text.success,
    fontSize: FONT.size.sm,
    fontWeight: FONT.weight.semibold,
    marginRight: SPACING.sm,
  },
  address: {
    color: COLORS.text.primary,
    fontSize: FONT.size.sm,
    fontWeight: FONT.weight.medium,
  },
});
