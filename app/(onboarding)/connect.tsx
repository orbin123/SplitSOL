import React, { useState } from 'react';
import {
  ActivityIndicator,
  Linking,
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
import { Button } from '@/components/ui/Button';
import { useAppStore } from '@/store/useAppStore';
import { connectWallet } from '@/utils/mwa';
import { getWalletConnectionErrorCopy } from '@/utils/errorMessages';
import { COLORS, FONT, SPACING } from '@/utils/constants';

type Stage = 'idle' | 'connecting' | 'error';

export default function ConnectScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const userName = useAppStore((s) => s.user.name);
  const setUser = useAppStore((s) => s.setUser);

  const [stage, setStage] = useState<Stage>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const [showInstallAction, setShowInstallAction] = useState(false);

  const handleConnect = async () => {
    setStage('connecting');
    setErrorMsg('');
    setShowInstallAction(false);
    try {
      const result = await connectWallet();
      // Preserve any existing name; username screen will set it
      setUser(userName, result.address, result.authToken);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.replace('/(onboarding)/username');
    } catch (err: unknown) {
      const copy = getWalletConnectionErrorCopy(err);
      setErrorMsg(copy.message);
      setShowInstallAction(copy.showInstallAction);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setStage('error');
    }
  };

  return (
    <ScreenWrapper variant="onboarding" style={styles.container}>
      <View
        style={[
          styles.inner,
          { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 32 },
        ]}
      >
        {/* Back */}
        <TouchableOpacity
          onPress={() => router.replace('/(onboarding)/welcome')}
          style={styles.backButton}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={24} color="rgba(255,255,255,0.9)" />
        </TouchableOpacity>

        <View style={styles.body}>
          <View style={styles.card}>
            {/* Icon */}
            <View style={styles.iconWrap}>
              <Ionicons name="wallet-outline" size={44} color={COLORS.bg.accent} />
            </View>

            <Text style={styles.title}>Connect Your Wallet</Text>
            <Text style={styles.subtitle}>
              Connect your Solflare wallet on Solana devnet to get started.
            </Text>

            {/* Error */}
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
                  <Text style={styles.connectingText}>Opening Solflare…</Text>
                </View>
              ) : (
                <>
                  {showInstallAction && (
                    <Button
                      title="Install Solflare"
                      onPress={() =>
                        void Linking.openURL('https://solflare.onelink.me/WVZY')
                      }
                      variant="secondary"
                      style={styles.fullWidth}
                    />
                  )}
                  <Button
                    title={stage === 'error' ? 'Try Again' : 'Connect Solflare Wallet'}
                    onPress={handleConnect}
                    variant="primary"
                    size="lg"
                    style={styles.fullWidth}
                    icon={<Ionicons name="wallet-outline" size={18} color="#FFFFFF" />}
                  />
                </>
              )}
            </View>
          </View>
        </View>
      </View>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  container: {
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
  iconWrap: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.bg.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.sm,
  },
  title: {
    color: '#111827',
    fontSize: 22,
    fontWeight: FONT.weight.bold,
    textAlign: 'center',
  },
  subtitle: {
    color: COLORS.text.secondary,
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 22,
    maxWidth: 280,
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
});
