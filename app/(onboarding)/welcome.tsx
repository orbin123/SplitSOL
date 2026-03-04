import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAppStore } from '@/store/useAppStore';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { COLORS, SPACING, FONT } from '@/utils/constants';

export default function Welcome() {
  const router = useRouter();
  const completeOnboarding = useAppStore((s) => s.completeOnboarding);
  const [name, setName] = useState('');

  const handleGetStarted = () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    completeOnboarding(trimmed);
    router.replace('/(tabs)/home');
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.content}>
        <View style={styles.hero}>
          <Text style={styles.emoji}>💸</Text>
          <Text style={styles.title}>SplitSOL</Text>
          <Text style={styles.subtitle}>
            Split expenses with friends.{'\n'}Settle on Solana.
          </Text>
        </View>

        <View style={styles.form}>
          <Input
            label="What should we call you?"
            placeholder="Enter your name"
            value={name}
            onChangeText={setName}
            autoFocus
            returnKeyType="done"
            onSubmitEditing={handleGetStarted}
            maxLength={30}
          />

          <Button
            title="Get Started"
            onPress={handleGetStarted}
            disabled={!name.trim()}
            size="lg"
            style={styles.button}
          />
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg.primary,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: SPACING.xxl,
  },
  hero: {
    alignItems: 'center',
    marginBottom: 48,
  },
  emoji: {
    fontSize: 64,
    marginBottom: SPACING.lg,
  },
  title: {
    color: COLORS.text.primary,
    fontSize: FONT.size.hero,
    fontWeight: FONT.weight.extrabold,
    marginBottom: SPACING.sm,
  },
  subtitle: {
    color: COLORS.text.secondary,
    fontSize: FONT.size.lg,
    textAlign: 'center',
    lineHeight: 26,
  },
  form: {
    gap: SPACING.xl,
  },
  button: {
    marginTop: SPACING.sm,
  },
});
