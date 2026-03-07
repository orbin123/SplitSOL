import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { COLORS, FONT, RADIUS, SPACING } from '@/utils/constants';

interface SplitSolLogoProps {
  size?: number;
  showWordmark?: boolean;
  style?: ViewStyle;
}

export const SplitSolLogo: React.FC<SplitSolLogoProps> = ({
  size = 88,
  showWordmark = false,
  style,
}) => {
  const coinSize = Math.max(24, Math.round(size * 0.52));

  return (
    <View style={[styles.wrap, style]}>
      <View style={[styles.mark, { width: size, height: size, borderRadius: size / 3 }]}>
        <View
          style={[
            styles.coinBack,
            {
              width: coinSize,
              height: coinSize,
              borderRadius: coinSize / 2,
              left: Math.round(size * 0.18),
            },
          ]}
        />
        <View
          style={[
            styles.coinFront,
            {
              width: coinSize,
              height: coinSize,
              borderRadius: coinSize / 2,
              right: Math.round(size * 0.16),
            },
          ]}
        >
          <Text style={[styles.coinText, { fontSize: Math.round(size * 0.34) }]}>S</Text>
        </View>
      </View>
      {showWordmark && <Text style={styles.wordmark}>SplitSOL</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
  },
  mark: {
    backgroundColor: COLORS.bg.dark,
    justifyContent: 'center',
    overflow: 'hidden',
  },
  coinBack: {
    position: 'absolute',
    backgroundColor: COLORS.bg.accentSoft,
    opacity: 0.9,
  },
  coinFront: {
    position: 'absolute',
    backgroundColor: COLORS.bg.accentLight,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.28)',
  },
  coinText: {
    color: COLORS.text.white,
    fontWeight: FONT.weight.extrabold,
  },
  wordmark: {
    marginTop: SPACING.lg,
    color: COLORS.text.primary,
    fontSize: FONT.size.xxl,
    fontWeight: FONT.weight.extrabold,
    letterSpacing: 0.3,
  },
});
