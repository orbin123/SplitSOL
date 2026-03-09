import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS, SPACING, FONT } from '@/utils/constants';

interface EmptyStateProps {
  emoji: string;
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  emoji, title, subtitle, action,
}) => (
  <View style={styles.container}>
    <View style={styles.emojiWrap}>
      <Text style={styles.emoji}>{emoji}</Text>
    </View>
    <Text style={styles.title}>{title}</Text>
    {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
    {action && <View style={styles.action}>{action}</View>}
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SPACING.xxxl,
  },
  emojiWrap: {
    width: 64,
    height: 64,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.lg,
  },
  emoji: {
    fontSize: 48,
  },
  title: {
    color: COLORS.text.primary,
    fontSize: 18,
    fontWeight: FONT.weight.bold,
    textAlign: 'center',
    marginBottom: SPACING.md,
  },
  subtitle: {
    color: COLORS.text.secondary,
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 22,
    maxWidth: 260,
    marginBottom: SPACING.xl,
  },
  action: {
    marginTop: SPACING.lg,
  },
});
