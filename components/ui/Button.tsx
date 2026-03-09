import React from 'react';
import {
  Pressable,
  Text,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { COLORS, SPACING, FONT, RADIUS, SHADOWS } from '@/utils/constants';

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

  const content = (
    <>
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
    </>
  );

  if (variant === 'primary') {
    return (
      <Pressable
        onPress={handlePress}
        disabled={isDisabled}
        style={({ pressed }) => [
          { borderRadius: RADIUS.full, overflow: 'hidden' },
          isDisabled && styles.disabled,
          pressed && styles.pressed,
          style,
        ]}
      >
        <LinearGradient
          colors={[COLORS.bg.accent, COLORS.bg.accentLight]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={[
            {
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: RADIUS.full,
              width: '100%',
            },
            sizeStyles[size],
          ]}
        >
          {content}
        </LinearGradient>
      </Pressable>
    );
  }

  return (
    <Pressable
      style={({ pressed }) => [
        styles.base,
        variantStyles[variant],
        sizeStyles[size],
        isDisabled && styles.disabled,
        pressed && styles.pressed,
        style,
      ]}
      onPress={handlePress}
      disabled={isDisabled}
    >
      {content}
    </Pressable>
  );
};

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: RADIUS.full,
  },
  primaryWrapper: {
    overflow: 'hidden',
    borderRadius: RADIUS.full,
  },
  gradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    borderRadius: RADIUS.full,
  },
  disabled: { opacity: 0.5 },
  pressed: { opacity: 0.9 },
  text: { fontWeight: FONT.weight.bold },
});

const variantStyles = StyleSheet.create({
  primary: {},
  secondary: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderWidth: 1,
    borderColor: COLORS.bg.accent,
  },
  danger: {
    backgroundColor: COLORS.bg.danger,
    borderRadius: RADIUS.full,
  },
  ghost: { backgroundColor: 'transparent' },
  dark: {
    backgroundColor: COLORS.bg.dark,
    borderRadius: RADIUS.full,
  },
});

const sizeStyles = StyleSheet.create({
  sm: { paddingVertical: 10, paddingHorizontal: 20 },
  md: { paddingVertical: 14, paddingHorizontal: 28 },
  lg: { paddingVertical: 16, paddingHorizontal: 32 },
});

const textVariantStyles = StyleSheet.create({
  primary: { color: COLORS.text.white },
  secondary: { color: COLORS.bg.accent },
  danger: { color: COLORS.text.white },
  ghost: { color: COLORS.text.accent },
  dark: { color: COLORS.text.white },
});

const textSizeStyles = StyleSheet.create({
  sm: { fontSize: FONT.size.sm },
  md: { fontSize: FONT.size.md },
  lg: { fontSize: FONT.size.lg },
});
