import React from 'react';
import { View, Text, StyleSheet, ViewStyle, Image } from 'react-native';
import { COLORS, FONT, SPACING } from '@/utils/constants';

interface SplitSolLogoProps {
  size?: number;
  showWordmark?: boolean;
  style?: ViewStyle;
}

export const SplitSolLogo: React.FC<SplitSolLogoProps> = ({
  size = 100,
  showWordmark = false,
  style,
}) => {
  return (
    <View style={[styles.wrap, style]}>
      <Image
        source={require('@/assets/icon.png')}
        style={{ width: size, height: size, borderRadius: size / 3 }}
        resizeMode="cover"
      />
      {showWordmark && <Text style={styles.wordmark}>SplitSOL</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
  },
  wordmark: {
    marginTop: SPACING.lg,
    color: COLORS.text.primary,
    fontSize: FONT.size.xxl,
    fontWeight: FONT.weight.extrabold,
    letterSpacing: 0.3,
  },
});

