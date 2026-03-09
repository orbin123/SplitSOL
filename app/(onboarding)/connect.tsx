import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Linking,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ScreenWrapper } from '@/components/layout/ScreenWrapper';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { useAppStore } from '@/store/useAppStore';
import { connectWallet } from '@/utils/mwa';
import { getWalletConnectionErrorCopy } from '@/utils/errorMessages';
import { COLORS, FONT, SPACING } from '@/utils/constants';

const MAX_NAME_LENGTH = 20;

type Stage = 'form' | 'connecting' | 'success' | 'error';

export default function ConnectScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const user = useAppStore((s) => s.user);
  const setUser = useAppStore((s) => s.setUser);

  const [name, setName] = useState(user.name);
  const [stage, setStage] = useState<Stage>('form');
  const [errorMsg, setErrorMsg] = useState('');
  const [showInstallAction, setShowInstallAction] = useState(false);

  const trimmedName = name.trim();

  const nameError = useMemo(() => {
    if (!name.length) return '';
    if (!trimmedName) return 'Name cannot be empty.';
    if (trimmedName.length > MAX_NAME_LENGTH) return `Max ${MAX_NAME_LENGTH} characters.`;
    return '';
  }, [name, trimmedName]);

  const canConnect = trimmedName.length > 0 && !nameError;

  const handleConnect = async () => {
    if (!canConnect) return;
    setStage('connecting');
    setErrorMsg('');
    setShowInstallAction(false);
    try {
      const result = await connectWallet();
      setUser(trimmedName, result.address, result.authToken);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setStage('success');
    } catch (err: any) {
      const copy = getWalletConnectionErrorCopy(err);
      setErrorMsg(copy.message);
      setShowInstallAction(copy.showInstallAction);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setStage('error');
    }
  };

  return (
    <ScreenWrapper variant="onboarding" style={styles.container}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={[styles.inner, { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 32 }]}>

          {/* Back button — hidden on success */}
          {stage !== 'success' && (
            <TouchableOpacity
              onPress={() => router.replace('/(onboarding)/welcome')}
              style={styles.backButton}
              activeOpacity={0.7}
            >
              <Ionicons name="arrow-back" size={24} color="rgba(255,255,255,0.9)" />
            </TouchableOpacity>
          )}

          <View style={styles.body}>
            {stage === 'success' ? (
              /* ── Success card ── */
              <View style={styles.card}>
                <View style={styles.successIconWrap}>
                  <Ionicons name="checkmark-circle" size={72} color="#10B981" />
                </View>
                <Text style={styles.successTitle}>You're all set, {trimmedName}!</Text>
                <Text style={styles.successSub}>
                  Wallet connected and ready to split.
                </Text>
                <Button
                  title="Go to Home"
                  onPress={() => router.replace('/(tabs)/home')}
                  variant="primary"
                  size="lg"
                  style={styles.fullWidth}
                  icon={<Ionicons name="arrow-forward" size={18} color="#FFFFFF" />}
                />
              </View>
            ) : (
              /* ── Form card ── */
              <View style={styles.card}>
                <Text style={styles.formTitle}>Welcome to SplitSOL</Text>
                <Text style={styles.formSub}>
                  Choose a display name, then connect your Solflare wallet.
                </Text>

                <Input
                  placeholder="Your display name"
                  value={name}
                  onChangeText={setName}
                  autoCapitalize="words"
                  autoCorrect={false}
                  maxLength={MAX_NAME_LENGTH}
                  returnKeyType="done"
                  onSubmitEditing={canConnect && stage !== 'connecting' ? handleConnect : undefined}
                  error={nameError || undefined}
                  editable={stage !== 'connecting'}
                  containerStyle={styles.inputContainer}
                />
                <Text style={styles.counter}>{name.length}/{MAX_NAME_LENGTH}</Text>

                {stage === 'error' && !!errorMsg && (
                  <View style={styles.errorBox}>
                    <Ionicons name="alert-circle-outline" size={16} color="#EF4444" />
                    <Text style={styles.errorText}>{errorMsg}</Text>
                  </View>
                )}

                <View style={styles.buttonGroup}>
                  {stage === 'connecting' ? (
                    <View style={styles.connectingRow}>
                      <ActivityIndicator color={COLORS.bg.accent} size="small" />
                      <Text style={styles.connectingText}>Connecting to Solflare…</Text>
                    </View>
                  ) : (
                    <>
                      {showInstallAction && (
                        <Button
                          title="Install Solflare"
                          onPress={() => void Linking.openURL('https://solflare.onelink.me/WVZY')}
                          variant="secondary"
                          style={styles.fullWidth}
                        />
                      )}
                      <Button
                        title={stage === 'error' ? 'Try Again' : 'Connect Solflare Wallet'}
                        onPress={handleConnect}
                        variant="primary"
                        size="lg"
                        disabled={!canConnect}
                        style={styles.fullWidth}
                        icon={<Ionicons name="wallet-outline" size={18} color="#FFFFFF" />}
                      />
                    </>
                  )}
                </View>
              </View>
            )}
          </View>
        </View>
      </KeyboardAvoidingView>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  flex: {
    flex: 1,
  },
  inner: {
    flex: 1,
    paddingHorizontal: SPACING.xxl,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.lg,
  },
  body: {
    flex: 1,
    justifyContent: 'center',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 28,
    padding: SPACING.xxl,
    alignItems: 'center',
    gap: SPACING.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 24,
    elevation: 8,
  },

  // Form
  formTitle: {
    color: '#111827',
    fontSize: 22,
    fontWeight: FONT.weight.bold,
    textAlign: 'center',
    marginBottom: SPACING.xs,
  },
  formSub: {
    color: COLORS.text.secondary,
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: SPACING.md,
  },
  inputContainer: {
    width: '100%',
  },
  counter: {
    color: COLORS.text.tertiary,
    fontSize: 12,
    alignSelf: 'flex-end',
    marginTop: -SPACING.sm,
    marginBottom: SPACING.sm,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: SPACING.sm,
    backgroundColor: 'rgba(239,68,68,0.08)',
    borderRadius: 12,
    padding: SPACING.md,
    width: '100%',
  },
  errorText: {
    color: '#EF4444',
    fontSize: 13,
    lineHeight: 19,
    flex: 1,
  },
  buttonGroup: {
    width: '100%',
    gap: SPACING.sm,
    marginTop: SPACING.sm,
  },
  connectingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.md,
    paddingVertical: 16,
    borderRadius: 9999,
    backgroundColor: 'rgba(124,58,237,0.1)',
  },
  connectingText: {
    color: COLORS.bg.accent,
    fontSize: 15,
    fontWeight: FONT.weight.semibold,
  },
  fullWidth: {
    width: '100%',
  },

  // Success
  successIconWrap: {
    marginBottom: SPACING.sm,
  },
  successTitle: {
    color: '#111827',
    fontSize: 22,
    fontWeight: FONT.weight.bold,
    textAlign: 'center',
  },
  successSub: {
    color: COLORS.text.secondary,
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: SPACING.lg,
  },
});
