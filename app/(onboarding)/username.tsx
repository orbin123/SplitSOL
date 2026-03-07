import React, { useMemo, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Redirect, useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { SplitSolLogo } from '@/components/branding/SplitSolLogo';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useAppStore } from '@/store/useAppStore';
import { COLORS, FONT, RADIUS, SPACING } from '@/utils/constants';

const MAX_NAME_LENGTH = 20;

export default function UsernameScreen() {
  const router = useRouter();
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

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.content}>
        <SplitSolLogo size={80} />

        <View style={styles.copyBlock}>
          <Text style={styles.title}>Choose your display name</Text>
          <Text style={styles.subtitle}>
            This is how you will appear in groups, settlements, and your
            members.
          </Text>
        </View>

        <View style={styles.formCard}>
          <Input
            label="Display name"
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
          />

          <Text style={styles.counter}>
            {trimmedName.length}/{MAX_NAME_LENGTH}
          </Text>

          <Button
            title="Continue to SplitSOL"
            onPress={handleSubmit}
            disabled={!trimmedName || !!error}
            size="lg"
            style={styles.primaryButton}
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
    paddingVertical: SPACING.xxxl,
    gap: SPACING.xl,
  },
  copyBlock: {
    alignItems: 'center',
    gap: SPACING.sm,
  },
  title: {
    color: COLORS.text.primary,
    fontSize: FONT.size.hero,
    fontWeight: FONT.weight.extrabold,
    textAlign: 'center',
  },
  subtitle: {
    color: COLORS.text.secondary,
    fontSize: FONT.size.md,
    textAlign: 'center',
    lineHeight: 22,
    maxWidth: 310,
  },
  formCard: {
    backgroundColor: COLORS.bg.secondary,
    borderRadius: RADIUS.xl,
    padding: SPACING.xl,
    gap: SPACING.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.05,
    shadowRadius: 18,
    elevation: 4,
  },
  counter: {
    color: COLORS.text.tertiary,
    fontSize: FONT.size.xs,
    textAlign: 'right',
  },
  primaryButton: {
    width: '100%',
    marginTop: SPACING.sm,
  },
});
