import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { COLORS, SPACING, FONT, RADIUS } from '@/utils/constants';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  disabled?: boolean;
  icon?: React.ReactNode;
  style?: ViewStyle;
}

export const Button: React.FC<ButtonProps> = ({
  title, onPress, variant = 'primary', size = 'md',
  loading = false, disabled = false, icon, style,
}) => {
  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress();
  };

  const isDisabled = disabled || loading;

  return (
    <TouchableOpacity
      style={[
        styles.base,
        styles[variant],
        styles[`size_${size}`],
        isDisabled && styles.disabled,
        style,
      ]}
      onPress={handlePress}
      disabled={isDisabled}
      activeOpacity={0.8}
    >
      {loading ? (
        <ActivityIndicator color={COLORS.text.primary} size="small" />
      ) : (
        <>
          {icon}
          <Text style={[
            styles.text,
            styles[`text_${variant}`],
            styles[`text_${size}`],
            icon ? { marginLeft: SPACING.sm } : {},
          ]}>
            {title}
          </Text>
        </>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: RADIUS.md,
  },
  primary: { backgroundColor: COLORS.bg.accent },
  secondary: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: COLORS.border.default,
  },
  danger: { backgroundColor: COLORS.bg.danger },
  ghost: { backgroundColor: 'transparent' },
  disabled: { opacity: 0.5 },
  size_sm: { paddingVertical: SPACING.sm, paddingHorizontal: SPACING.lg },
  size_md: { paddingVertical: SPACING.md, paddingHorizontal: SPACING.xl },
  size_lg: { paddingVertical: SPACING.lg, paddingHorizontal: SPACING.xxl },
  text: { fontWeight: FONT.weight.semibold },
  text_primary: { color: COLORS.text.primary },
  text_secondary: { color: COLORS.text.secondary },
  text_danger: { color: COLORS.text.primary },
  text_ghost: { color: COLORS.text.accent },
  text_sm: { fontSize: FONT.size.sm },
  text_md: { fontSize: FONT.size.md },
  text_lg: { fontSize: FONT.size.lg },
});
