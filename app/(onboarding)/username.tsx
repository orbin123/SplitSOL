import React, { useMemo, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
} from 'react-native';
import { Redirect, useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ScreenWrapper } from '@/components/layout/ScreenWrapper';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { useAppStore } from '@/store/useAppStore';
import { COLORS, FONT, SPACING } from '@/utils/constants';

const MAX_NAME_LENGTH = 20;

export default function UsernameScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const user = useAppStore((s) => s.user);
  const setUser = useAppStore((s) => s.setUser);
  const [name, setName] = useState(user.name);

  const trimmedName = name.trim();
  const error = useMemo(() => {
    if (!name.length) return '';
    if (!trimmedName) return 'Display name cannot be empty.';
    if (trimmedName.length > MAX_NAME_LENGTH) {
      return `Display name must be ${MAX_NAME_LENGTH} characters or less.`;
    }
    return '';
  }, [name, trimmedName]);

  if (!user.walletAddress || !user.walletAuthToken) {
    return <Redirect href="/(onboarding)/welcome" />;
  }

  const handleSubmit = async () => {
    if (!trimmedName || trimmedName.length > MAX_NAME_LENGTH) {
      return;
    }

    setUser(trimmedName, user.walletAddress, user.walletAuthToken);
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    router.replace('/(tabs)/home');
  };

  const handleBack = () => {
    router.replace('/(onboarding)/connect');
  };

  const isButtonDisabled = !trimmedName || !!error;

  return (
    <ScreenWrapper variant="onboarding" style={styles.container}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
          <TouchableOpacity
            onPress={handleBack}
            style={styles.backButton}
            activeOpacity={0.7}
          >
            <Ionicons name="arrow-back" size={24} color="#1A1A2E" />
          </TouchableOpacity>
        </View>

        <View style={styles.content}>
          <Card style={styles.card}>
            <Text style={styles.title}>What should we call you?</Text>
            <Text style={styles.subtitle}>
              This name will be visible to your group members
            </Text>

            <View style={styles.spacer} />

            <Input
              placeholder="Enter your name"
              value={name}
              onChangeText={setName}
              autoFocus
              autoCapitalize="words"
              autoCorrect={false}
              maxLength={MAX_NAME_LENGTH}
              returnKeyType="done"
              onSubmitEditing={handleSubmit}
              error={error || undefined}
              containerStyle={styles.inputContainer}
            />
            <Text style={styles.counter}>
              {name.length}/{MAX_NAME_LENGTH}
            </Text>

            <View style={styles.spacerLarge} />

            <Button
              title="Continue"
              onPress={handleSubmit}
              variant="primary"
              disabled={isButtonDisabled}
              style={styles.button}
            />
          </Card>
        </View>
      </KeyboardAvoidingView>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: SPACING.xl,
    paddingBottom: SPACING.md,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
    paddingHorizontal: SPACING.xxl,
    justifyContent: 'center',
    paddingBottom: 100,
  },
  card: {
    alignItems: 'center',
    paddingVertical: SPACING.xxl,
    paddingHorizontal: SPACING.xxl,
  },
  title: {
    color: COLORS.bg.dark,
    fontSize: 22,
    fontWeight: FONT.weight.bold,
    textAlign: 'center',
    marginBottom: SPACING.sm,
  },
  subtitle: {
    color: COLORS.text.secondary,
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 22,
    maxWidth: 280,
  },
  spacer: {
    height: 20,
  },
  spacerLarge: {
    height: 24,
  },
  inputContainer: {
    width: '100%',
    marginBottom: SPACING.sm,
  },
  counter: {
    color: COLORS.text.secondary,
    fontSize: 12,
    alignSelf: 'flex-end',
    marginBottom: SPACING.lg,
  },
  button: {
    width: '100%',
  },
});
