import React from 'react';
import { View } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { useAppStore } from '@/store/useAppStore';
import { COLORS } from '@/utils/constants';

export const WalletBadge: React.FC = () => {
  const walletAddress = useAppStore((s) => s.user.walletAddress);

  if (!walletAddress) return null;

  return (
    <View>
      <QRCode
        value={walletAddress}
        size={200}
        backgroundColor={COLORS.bg.primary}
        color={COLORS.text.primary}
      />
    </View>
  );
};
