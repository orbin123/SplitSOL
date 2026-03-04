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
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'dark';
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
  const usesLightText = variant === 'primary' || variant === 'danger' || variant === 'dark';

  return (
    <TouchableOpacity
      style={[
        styles.base,
        variantStyles[variant],
        sizeStyles[size],
        isDisabled && styles.disabled,
        style,
      ]}
      onPress={handlePress}
      disabled={isDisabled}
      activeOpacity={0.8}
    >
      {loading ? (
        <ActivityIndicator
          color={usesLightText ? COLORS.text.white : COLORS.text.primary}
          size="small"
        />
      ) : (
        <>
          {icon}
          <Text
            style={[
              styles.text,
              textVariantStyles[variant],
              textSizeStyles[size],
              icon ? { marginLeft: SPACING.sm } : {},
            ]}
          >
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
  disabled: { opacity: 0.5 },
  text: { fontWeight: FONT.weight.semibold },
});

const variantStyles = StyleSheet.create({
  primary: { backgroundColor: COLORS.bg.accent },
  secondary: {
    backgroundColor: COLORS.bg.secondary,
    borderWidth: 1.5,
    borderColor: COLORS.border.default,
  },
  danger: { backgroundColor: COLORS.bg.danger },
  ghost: { backgroundColor: 'transparent' },
  dark: { backgroundColor: COLORS.bg.dark, borderRadius: RADIUS.lg },
});

const sizeStyles = StyleSheet.create({
  sm: { paddingVertical: SPACING.sm, paddingHorizontal: SPACING.lg },
  md: { paddingVertical: SPACING.md, paddingHorizontal: SPACING.xl },
  lg: { paddingVertical: SPACING.lg + 2, paddingHorizontal: SPACING.xxl },
});

const textVariantStyles = StyleSheet.create({
  primary: { color: COLORS.text.white },
  secondary: { color: COLORS.text.primary },
  danger: { color: COLORS.text.white },
  ghost: { color: COLORS.text.accent },
  dark: { color: COLORS.text.white },
});

const textSizeStyles = StyleSheet.create({
  sm: { fontSize: FONT.size.sm },
  md: { fontSize: FONT.size.md },
  lg: { fontSize: FONT.size.lg },
});
