import React from 'react';
import { StyleSheet, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { GRADIENTS } from '@/utils/constants';

interface ScreenWrapperProps {
  children: React.ReactNode;
  /** 'main' for tab screens, 'onboarding' for welcome/connect/splash */
  variant?: 'main' | 'onboarding';
  style?: ViewStyle;
}

export function ScreenWrapper({
  children,
  variant = 'main',
  style,
}: ScreenWrapperProps) {
  const colors =
    variant === 'onboarding' ? GRADIENTS.onboarding : GRADIENTS.screen;

  return (
    <LinearGradient
      colors={colors}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[styles.gradient, style]}
    >
      {children}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: {
    flex: 1,
  },
});
