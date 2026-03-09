import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Linking,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
  Animated,
} from 'react-native';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Line } from 'react-native-svg';
import { ScreenWrapper } from '@/components/layout/ScreenWrapper';
import { Button } from '@/components/ui/Button';
import { useAppStore } from '@/store/useAppStore';
import { connectWallet } from '@/utils/mwa';
import { getWalletConnectionErrorCopy } from '@/utils/errorMessages';
import { COLORS, FONT, SPACING, SHADOWS } from '@/utils/constants';

const SUCCESS_DELAY_MS = 1500;
const CIRCLE_SIZE = Dimensions.get('window').width * 0.65;

export default function ConnectScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const user = useAppStore((s) => s.user);
  const setUser = useAppStore((s) => s.setUser);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [errorTitle, setErrorTitle] = useState('Wallet connection failed');
  const [showInstallAction, setShowInstallAction] = useState(false);
  const [success, setSuccess] = useState(false);

  // Dot animations
  const dot1X = useRef(new Animated.Value(0)).current;
  const dot2X = useRef(new Animated.Value(0)).current;
  const walletFloat = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const makeDot = (anim: Animated.Value, delay: number) =>
      Animated.loop(
        Animated.sequence([
          Animated.timing(anim, { toValue: 0, duration: 0, delay, useNativeDriver: true }),
          Animated.timing(anim, { toValue: 62, duration: 1600, useNativeDriver: true }),
          Animated.timing(anim, { toValue: 0, duration: 0, useNativeDriver: true }),
        ])
      );

    const floatAnim = Animated.loop(
      Animated.sequence([
        Animated.timing(walletFloat, { toValue: -5, duration: 1600, useNativeDriver: true }),
        Animated.timing(walletFloat, { toValue: 5, duration: 1600, useNativeDriver: true }),
        Animated.timing(walletFloat, { toValue: 0, duration: 1600, useNativeDriver: true }),
      ])
    );

    const d1 = makeDot(dot1X, 0);
    const d2 = makeDot(dot2X, 800);
    d1.start();
    d2.start();
    floatAnim.start();

    return () => {
      d1.stop();
      d2.stop();
      floatAnim.stop();
    };
  }, []);

  const handleConnect = useCallback(async () => {
    setLoading(true);
    setError(null);
    setErrorTitle('Wallet connection failed');
    setShowInstallAction(false);
    setSuccess(false);

    try {
      const result = await connectWallet();
      setUser(user.name, result.address, result.authToken);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setSuccess(true);
      setLoading(false);
    } catch (err: any) {
      const copy = getWalletConnectionErrorCopy(err);
      setErrorTitle(copy.title);
      setError(copy.message);
      setShowInstallAction(copy.showInstallAction);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setLoading(false);
    }
  }, [setUser, user.name]);

  useEffect(() => {
    handleConnect();
  }, [handleConnect]);

  useEffect(() => {
    if (!success) return;
    const timer = setTimeout(() => {
      if (user.name.trim()) {
        router.replace('/(tabs)/home');
      } else {
        router.replace('/(onboarding)/username' as any);
      }
    }, SUCCESS_DELAY_MS);
    return () => clearTimeout(timer);
  }, [success, user.name, router]);

  return (
    <ScreenWrapper variant="onboarding" style={styles.container}>
      <View style={styles.fullScreen}>
        {/* Back button */}
        <TouchableOpacity
          onPress={() => router.replace('/(onboarding)/welcome')}
          style={[styles.backButton, { top: insets.top + 16 }]}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={24} color="#7C3AED" />
        </TouchableOpacity>

        {/* Top zone: circular illustration */}
        <View style={styles.topZone}>
          <View style={[styles.circle, { width: CIRCLE_SIZE, height: CIRCLE_SIZE, borderRadius: CIRCLE_SIZE / 2 }]}>
            {/* Phone card */}
            <View style={styles.phoneCard}>
              <Ionicons name="phone-portrait-outline" size={28} color={COLORS.bg.accent} />
              <Text style={styles.phoneLabel}>PHONE</Text>
            </View>

            {/* Dashed line + animated dots */}
            <View style={styles.lineContainer}>
              <Svg width={70} height={4} style={StyleSheet.absoluteFillObject}>
                <Line x1={0} y1={2} x2={70} y2={2} stroke="#7C3AED" strokeDasharray="5,4" strokeOpacity={0.5} strokeWidth={2} />
              </Svg>
              <Animated.View style={[styles.dot, { transform: [{ translateX: dot1X }] }]} />
              <Animated.View style={[styles.dot, { transform: [{ translateX: dot2X }] }]} />
            </View>

            {/* Wallet card with float animation */}
            <Animated.View style={{ transform: [{ translateY: walletFloat }] }}>
              <View style={styles.walletCardWrapper}>
                <View style={styles.walletCard}>
                  <Ionicons name="wallet-outline" size={28} color="#FFFFFF" />
                  <Text style={styles.walletLabel}>WALLET</Text>
                </View>
                <View style={styles.greenBadge}>
                  <View style={styles.badgeLine} />
                  <View style={styles.badgeLine} />
                </View>
              </View>
            </Animated.View>
          </View>
        </View>

        {/* Bottom card */}
        <View style={[styles.bottomCard, { paddingBottom: insets.bottom + 24 }]}>
          {/* Drag handle */}
          <View style={styles.dragHandle} />

          {success ? (
            <View style={styles.iconWrap}>
              <Ionicons name="checkmark-circle" size={48} color={COLORS.bg.success} />
            </View>
          ) : (
            <View style={styles.iconWrap}>
              <Ionicons name="wallet-outline" size={48} color={COLORS.bg.accent} />
            </View>
          )}

          <Text style={styles.title}>
            {success ? 'Connected!' : 'Connect Your Wallet'}
          </Text>
          <Text style={[styles.subtitle, error && styles.errorSubtitle]}>
            {error
              ? error
              : 'SplitSOL uses Solflare to manage your on-chain settlements'}
          </Text>

          <View style={styles.spacer} />

          {loading && !success ? (
            <View style={styles.loadingButton}>
              <ActivityIndicator color={COLORS.bg.accent} size="small" />
              <Text style={styles.loadingText}>Connecting...</Text>
            </View>
          ) : success ? null : (
            <>
              {showInstallAction && (
                <Button
                  title="Install Solflare"
                  onPress={() => void Linking.openURL('https://solflare.onelink.me/WVZY')}
                  variant="secondary"
                  style={styles.fullWidthButton}
                />
              )}
              <Button
                title="Connect Solflare"
                onPress={handleConnect}
                variant="primary"
                style={styles.fullWidthButton}
                icon={<Ionicons name="wallet-outline" size={18} color="#FFFFFF" />}
              />
            </>
          )}

          {!success && (
            <TouchableOpacity style={styles.whyLink} activeOpacity={0.7}>
              <Text style={styles.whyLinkText}>Why do I need a wallet?</Text>
            </TouchableOpacity>
          )}

          {error && (
            <Text style={styles.demoError}>Demo Error State</Text>
          )}
        </View>
      </View>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  fullScreen: {
    flex: 1,
    position: 'relative',
  },
  backButton: {
    position: 'absolute',
    left: 24,
    zIndex: 10,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  topZone: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  circle: {
    backgroundColor: 'rgba(255,255,255,0.18)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  phoneCard: {
    width: 70,
    height: 90,
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    ...SHADOWS.float,
  },
  phoneLabel: {
    fontSize: 9,
    color: '#6B7280',
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  lineContainer: {
    width: 70,
    height: 4,
    position: 'relative',
  },
  dot: {
    position: 'absolute',
    top: -2,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#7C3AED',
  },
  walletCardWrapper: {
    position: 'relative',
  },
  walletCard: {
    width: 70,
    height: 70,
    backgroundColor: '#7C3AED',
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    ...SHADOWS.float,
  },
  walletLabel: {
    fontSize: 9,
    color: 'rgba(255,255,255,0.8)',
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  greenBadge: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#10B981',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 1.5,
  },
  badgeLine: {
    width: 10,
    height: 1.5,
    backgroundColor: '#FFFFFF',
  },
  bottomCard: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingTop: 28,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  dragHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#E5E7EB',
    marginBottom: 24,
  },
  iconWrap: {
    marginBottom: SPACING.lg,
  },
  title: {
    color: COLORS.bg.dark,
    fontSize: 24,
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
  errorSubtitle: {
    color: COLORS.bg.danger,
  },
  spacer: {
    height: 24,
  },
  loadingButton: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: 9999,
    backgroundColor: 'rgba(124, 58, 237, 0.15)',
    opacity: 0.8,
  },
  loadingText: {
    color: COLORS.bg.accent,
    fontSize: 16,
    fontWeight: FONT.weight.semibold,
  },
  fullWidthButton: {
    width: '100%',
    marginBottom: SPACING.sm,
  },
  whyLink: {
    marginTop: SPACING.lg,
    paddingVertical: SPACING.sm,
  },
  whyLinkText: {
    color: COLORS.bg.accent,
    fontSize: 13,
    fontWeight: FONT.weight.medium,
  },
  demoError: {
    color: COLORS.text.tertiary,
    fontSize: 11,
    marginTop: SPACING.sm,
  },
});
