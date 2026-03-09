import React from 'react';
import { StyleSheet, Text, View, ViewStyle } from 'react-native';
import { FONT, SPACING } from '@/utils/constants';

type BadgeVariant = 'accent' | 'success' | 'warning' | 'danger' | 'neutral' | 'devnet';
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
    borderRadius: 9999,
  },
  text: {
    fontWeight: '600',
  },
});

const variantStyles = StyleSheet.create({
  accent: {
    backgroundColor: '#EDE9FE',
  },
  success: {
    backgroundColor: '#D1FAE5',
  },
  warning: {
    backgroundColor: '#FEF3C7',
  },
  danger: {
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
  },
  neutral: {
    backgroundColor: '#F0EEFF',
  },
  devnet: {
    backgroundColor: '#EDE9FE',
  },
});

const textVariantStyles = StyleSheet.create({
  accent: {
    color: '#7C3AED',
  },
  success: {
    color: '#059669',
  },
  warning: {
    color: '#D97706',
  },
  danger: {
    color: '#EF4444',
  },
  neutral: {
    color: '#6B7280',
  },
  devnet: {
    color: '#7C3AED',
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
    fontSize: 11,
  },
  md: {
    fontSize: 12,
  },
});
