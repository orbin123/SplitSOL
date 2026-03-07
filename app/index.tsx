import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { Redirect } from 'expo-router';
import { useAppStore } from '@/store/useAppStore';
import { reauthorizeWallet } from '@/utils/mwa';
import { COLORS, FONT, SPACING } from '@/utils/constants';

export default function Index() {
  const user = useAppStore((s) => s.user);
  const setUser = useAppStore((s) => s.setUser);
  const [isCheckingAuth, setIsCheckingAuth] = useState(
    !!user.walletAddress || !!user.walletAuthToken,
  );
  const hasStartedCheck = useRef(false);

  useEffect(() => {
    if (hasStartedCheck.current) {
      return;
    }

    hasStartedCheck.current = true;

    const verifyWalletSession = async () => {
      if (!user.walletAddress || !user.walletAuthToken) {
        if (user.walletAddress || user.walletAuthToken) {
          setUser(user.name, null, null);
        }
        setIsCheckingAuth(false);
        return;
      }

      try {
        const result = await reauthorizeWallet(user.walletAuthToken);
        setUser(user.name, result.address, result.authToken);
      } catch {
        setUser(user.name, null, null);
      } finally {
        setIsCheckingAuth(false);
      }
    };

    verifyWalletSession();
  }, [
    setUser,
    user.name,
    user.walletAddress,
    user.walletAuthToken,
  ]);

  if (isCheckingAuth) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color={COLORS.bg.accent} />
        <Text style={styles.text}>Checking wallet session...</Text>
      </View>
    );
  }

  if (!user.walletAddress) return <Redirect href="/(onboarding)/welcome" />;
  if (!user.name) return <Redirect href={'/(onboarding)/username' as any} />;
  return <Redirect href="/(tabs)/home" />;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.bg.primary,
    gap: SPACING.md,
  },
  text: {
    color: COLORS.text.secondary,
    fontSize: FONT.size.md,
  },
});
