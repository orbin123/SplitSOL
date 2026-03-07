import React from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { COLORS, FONT, RADIUS, SPACING } from '@/utils/constants';

interface LoadingOverlayProps {
  visible: boolean;
  title: string;
  subtitle?: string;
}

export function LoadingOverlay({
  visible,
  title,
  subtitle,
}: LoadingOverlayProps) {
  if (!visible) return null;

  return (
    <View style={styles.overlay}>
      <View style={styles.card}>
        <ActivityIndicator size="large" color={COLORS.bg.accentLight} />
        <Text style={styles.title}>{title}</Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 20,
  },
  card: {
    width: 280,
    alignItems: 'center',
    padding: SPACING.xxxl,
    borderRadius: RADIUS.xl,
    backgroundColor: COLORS.bg.secondary,
    borderWidth: 1,
    borderColor: COLORS.border.default,
  },
  title: {
    marginTop: SPACING.xl,
    color: COLORS.text.primary,
    fontSize: FONT.size.lg,
    fontWeight: FONT.weight.bold,
    textAlign: 'center',
  },
  subtitle: {
    marginTop: SPACING.sm,
    color: COLORS.text.secondary,
    fontSize: FONT.size.sm,
    textAlign: 'center',
    lineHeight: 20,
  },
});
