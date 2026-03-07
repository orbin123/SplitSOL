import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, StyleSheet, Linking } from 'react-native';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import Ionicons from '@expo/vector-icons/Ionicons';
import { SplitSolLogo } from '@/components/branding/SplitSolLogo';
import { Button } from '@/components/ui/Button';
import { useAppStore } from '@/store/useAppStore';
import { connectWallet } from '@/utils/mwa';
import { getWalletConnectionErrorCopy } from '@/utils/errorMessages';
import { COLORS, FONT, RADIUS, SOLANA, SPACING } from '@/utils/constants';

export default function ConnectScreen() {
  const router = useRouter();
  const user = useAppStore((s) => s.user);
  const setUser = useAppStore((s) => s.setUser);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [errorTitle, setErrorTitle] = useState('Wallet connection failed');
  const [showInstallAction, setShowInstallAction] = useState(false);

  const handleConnect = useCallback(async () => {
    setLoading(true);
    setError(null);
    setErrorTitle('Wallet connection failed');
    setShowInstallAction(false);

    try {
      const result = await connectWallet();
      setUser(user.name, result.address, result.authToken);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      if (user.name.trim()) {
        router.replace('/(tabs)/home');
      } else {
        router.replace('/(onboarding)/username' as any);
      }
    } catch (err: any) {
      const copy = getWalletConnectionErrorCopy(err);
      setErrorTitle(copy.title);
      setError(copy.message);
      setShowInstallAction(copy.showInstallAction);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setLoading(false);
    }
  }, [router, setUser, user.name]);

  useEffect(() => {
    handleConnect();
  }, [handleConnect]);

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <SplitSolLogo size={92} />

        <View style={styles.copyBlock}>
          <Text style={styles.title}>Connecting to Phantom</Text>
          <Text style={styles.subtitle}>
            We are requesting wallet authorization on {SOLANA.CLUSTER}.
          </Text>
        </View>

        <View style={styles.statusCard}>
          {loading ? (
            <>
              <View style={styles.spinnerWrap}>
                <Ionicons
                  name="wallet-outline"
                  size={28}
                  color={COLORS.text.white}
                />
              </View>
              <Text style={styles.statusTitle}>Approve in Phantom</Text>
              <Text style={styles.statusSub}>
                Switch to Phantom, review the request, and approve to continue.
              </Text>
            </>
          ) : (
            <>
              <View style={[styles.spinnerWrap, styles.errorWrap]}>
                <Ionicons
                  name="alert-circle-outline"
                  size={28}
                  color={COLORS.text.white}
                />
              </View>
              <Text style={styles.statusTitle}>{errorTitle}</Text>
              <Text style={styles.statusSub}>{error ?? 'Please try again.'}</Text>
              {showInstallAction && (
                <Button
                  title="Install Phantom"
                  onPress={() => {
                    void Linking.openURL('https://phantom.app/download');
                  }}
                  variant="secondary"
                  size="lg"
                  style={styles.actionButton}
                />
              )}
              <Button
                title="Retry Connection"
                onPress={handleConnect}
                size="lg"
                style={styles.actionButton}
              />
              <Button
                title="Back"
                onPress={() => router.replace('/(onboarding)/welcome')}
                variant="ghost"
                size="sm"
              />
            </>
          )}
        </View>

        {!loading && error && (
          <Text style={styles.footnote}>
            If Phantom opened and you tapped reject, the retry button will ask
            again immediately.
          </Text>
        )}
      </View>
    </View>
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
    maxWidth: 300,
  },
  statusCard: {
    backgroundColor: COLORS.bg.secondary,
    borderRadius: RADIUS.xl,
    padding: SPACING.xxl,
    alignItems: 'center',
    gap: SPACING.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.05,
    shadowRadius: 18,
    elevation: 4,
  },
  spinnerWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: COLORS.bg.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorWrap: {
    backgroundColor: COLORS.bg.danger,
  },
  statusTitle: {
    color: COLORS.text.primary,
    fontSize: FONT.size.xl,
    fontWeight: FONT.weight.bold,
    textAlign: 'center',
  },
  statusSub: {
    color: COLORS.text.secondary,
    fontSize: FONT.size.md,
    textAlign: 'center',
    lineHeight: 22,
  },
  actionButton: {
    width: '100%',
    marginTop: SPACING.sm,
  },
  footnote: {
    color: COLORS.text.tertiary,
    fontSize: FONT.size.sm,
    textAlign: 'center',
    lineHeight: 20,
  },
});
