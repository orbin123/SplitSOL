import React from 'react';
import { StyleSheet, Text, View, ViewStyle } from 'react-native';
import { COLORS, FONT, RADIUS, SPACING } from '@/utils/constants';

type BadgeVariant = 'accent' | 'success' | 'warning' | 'danger' | 'neutral';
type BadgeSize = 'sm' | 'md';

interface BadgeProps {
  label: string;
  variant?: BadgeVariant;
  size?: BadgeSize;
  style?: ViewStyle;
}

export function Badge({
  label,
  variant = 'accent',
  size = 'md',
  style,
}: BadgeProps) {
  return (
    <View style={[styles.base, variantStyles[variant], sizeStyles[size], style]}>
      <Text style={[styles.text, textVariantStyles[variant], textSizeStyles[size]]}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    alignSelf: 'flex-start',
    borderRadius: RADIUS.full,
  },
  text: {
    fontWeight: FONT.weight.semibold,
  },
});

const variantStyles = StyleSheet.create({
  accent: {
    backgroundColor: COLORS.bg.accentSoft,
  },
  success: {
    backgroundColor: 'rgba(16, 185, 129, 0.14)',
  },
  warning: {
    backgroundColor: 'rgba(245, 158, 11, 0.14)',
  },
  danger: {
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
  },
  neutral: {
    backgroundColor: COLORS.bg.tertiary,
  },
});

const textVariantStyles = StyleSheet.create({
  accent: {
    color: COLORS.text.accent,
  },
  success: {
    color: COLORS.text.success,
  },
  warning: {
    color: COLORS.bg.dark,
  },
  danger: {
    color: COLORS.text.danger,
  },
  neutral: {
    color: COLORS.text.secondary,
  },
});

const sizeStyles = StyleSheet.create({
  sm: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
  },
  md: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs + 1,
  },
});

const textSizeStyles = StyleSheet.create({
  sm: {
    fontSize: FONT.size.xs,
  },
  md: {
    fontSize: FONT.size.sm,
  },
});
