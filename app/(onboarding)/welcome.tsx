import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import Svg, { Line, Path, Defs, Mask, Rect, Circle, G } from 'react-native-svg';
import { ScreenWrapper } from '@/components/layout/ScreenWrapper';
import { Button } from '@/components/ui/Button';
import { SPACING, SHADOWS } from '@/utils/constants';

const AnimatedRect = Animated.createAnimatedComponent(Rect);
const AnimatedCircle = Animated.createAnimatedComponent(Circle);

const makeFloat = (anim: Animated.Value, delay: number) =>
  Animated.loop(
    Animated.sequence([
      Animated.timing(anim, { toValue: -6, duration: 1800, delay, useNativeDriver: true }),
      Animated.timing(anim, { toValue: 6, duration: 1800, useNativeDriver: true }),
      Animated.timing(anim, { toValue: 0, duration: 1800, useNativeDriver: true }),
    ])
  );

const SolanaIcon = ({ width = 24, height = 24 }: { width?: number; height?: number }) => (
  <Svg width={width} height={height} viewBox="0 0 397 311" fill="none">
    <Path d="M64.6 237.9c2.4-2.4 5.7-3.8 9.2-3.8h317.4c5.8 0 8.7 7 4.6 11.1l-62.7 62.7c-2.4 2.4-5.7 3.8-9.2 3.8H6.5c-5.8 0-8.7-7-4.6-11.1l62.7-62.7z" fill="#14F195"/>
    <Path d="M64.6 3.8C67 1.4 70.3 0 73.8 0h317.4c5.8 0 8.7 7 4.6 11.1l-62.7 62.7c-2.4 2.4-5.7 3.8-9.2 3.8H6.5c-5.8 0-8.7-7-4.6-11.1L64.6 3.8z" fill="#9945FF"/>
    <Path d="M333.1 120.1c-2.4-2.4-5.7-3.8-9.2-3.8H6.5c-5.8 0-8.7 7-4.6 11.1l62.7 62.7c2.4 2.4 5.7 3.8 9.2 3.8h317.4c5.8 0 8.7-7 4.6-11.1l-62.7-62.7z" fill="#14F195"/>
  </Svg>
);

export default function Welcome() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const anim0 = useRef(new Animated.Value(0)).current;
  const anim1 = useRef(new Animated.Value(0)).current;
  const anim2 = useRef(new Animated.Value(0)).current;
  const anim3 = useRef(new Animated.Value(0)).current;
  const anim4 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const a0 = makeFloat(anim0, 0);
    const a1 = makeFloat(anim1, 300);
    const a2 = makeFloat(anim2, 600);
    const a3 = makeFloat(anim3, 900);
    const a4 = makeFloat(anim4, 1200);
    a0.start();
    a1.start();
    a2.start();
    a3.start();
    a4.start();
    return () => {
      a0.stop();
      a1.stop();
      a2.stop();
      a3.stop();
      a4.stop();
    };
  }, []);

  return (
    <ScreenWrapper variant="onboarding" style={styles.container}>
      <StatusBar style="light" />
      <View style={[styles.content, { paddingTop: insets.top + 48 }]}>
        {/* Top: Logo */}
        <View style={styles.hero}>
          <View style={styles.logoRow}>
            <Image
              source={require('@/assets/icon.png')}
              style={styles.logoIcon}
              resizeMode="contain"
            />
            <Text style={styles.logoText}>SplitSOL</Text>
          </View>
        </View>

        {/* Middle: Illustration + Tagline */}
        <View style={styles.taglineBlock}>
          {/* Illustration */}
          <View style={styles.illustrationContainer}>
            {/* Dashed lines with Masking */}
            <Svg width={320} height={260} style={StyleSheet.absoluteFillObject}>
              <Defs>
                <Mask id="mask">
                  {/* White background: show everything */}
                  <Rect x="0" y="0" width="320" height="260" fill="white" />
                  
                  {/* Black shapes: hide/vanish - synced with card positions and floating */}
                  {/* Center card: left: 110, top: 80, width: 100, height: 100 */}
                  <AnimatedRect x="110" y={Animated.add(80, anim0)} width="100" height="100" rx="24" fill="black" />
                  
                  {/* Top left card: left: 12, top: 30, width: approx 86, height: approx 40 */}
                  <AnimatedRect x="12" y={Animated.add(30, anim1)} width="86" height="40" rx="20" fill="black" />
                  
                  {/* Top right card: left: 210, top: 30, width: approx 86, height: approx 40 */}
                  <AnimatedRect x="210" y={Animated.add(30, anim2)} width="86" height="40" rx="20" fill="black" />
                  
                  {/* Bottom right card: left: 210, top: 190, width: approx 86, height: approx 40 */}
                  <AnimatedRect x="210" y={Animated.add(190, anim3)} width="86" height="40" rx="20" fill="black" />
                  
                  {/* Wallet circle: left: 25, top: 185, width: 44, height: 44 (center: 47, 207) */}
                  <AnimatedCircle cx="47" cy={Animated.add(207, anim4)} r="22" fill="black" />
                </Mask>
              </Defs>

              {/* Group masked to hide parts under cards */}
              <G mask="url(#mask)">
                {/* Center to Top Left */}
                <Line x1="160" y1="130" x2="55" y2="50" stroke="#FFFFFF" strokeDasharray="5,5" strokeOpacity={0.6} strokeWidth={1.5} />
                {/* Center to Top Right */}
                <Line x1="160" y1="130" x2="253" y2="50" stroke="#FFFFFF" strokeDasharray="5,5" strokeOpacity={0.6} strokeWidth={1.5} />
                {/* Center to Bottom Right */}
                <Line x1="160" y1="130" x2="253" y2="210" stroke="#FFFFFF" strokeDasharray="5,5" strokeOpacity={0.6} strokeWidth={1.5} />
                {/* Center to Bottom Left (Solana icon) */}
                <Line x1="160" y1="130" x2="47" y2="207" stroke="#FFFFFF" strokeDasharray="5,5" strokeOpacity={0.6} strokeWidth={1.5} />
              </G>
            </Svg>

            {/* Center card */}
            <Animated.View style={[styles.centerCard, { transform: [{ translateY: anim0 }] }]}>
              <Text style={styles.centerCardEmoji}>🍕</Text>
              <Text style={styles.centerCardLabel}>DINNER</Text>
              <Text style={styles.centerCardAmount}>$120</Text>
            </Animated.View>

            {/* Top left card */}
            <Animated.View style={[styles.personCard, styles.topLeftCard, { transform: [{ translateY: anim1 }] }]}>
              <View style={[styles.avatar, { backgroundColor: '#EF4444' }]}>
                <Text style={styles.avatarText}>AL</Text>
              </View>
              <Text style={styles.personAmount}>$40</Text>
            </Animated.View>

            {/* Top right card */}
            <Animated.View style={[styles.personCard, styles.topRightCard, { transform: [{ translateY: anim2 }] }]}>
              <View style={[styles.avatar, { backgroundColor: '#3B82F6' }]}>
                <Text style={styles.avatarText}>JD</Text>
              </View>
              <Text style={styles.personAmount}>$40</Text>
            </Animated.View>

            {/* Bottom right card */}
            <Animated.View style={[styles.personCard, styles.bottomRightCard, { transform: [{ translateY: anim3 }] }]}>
              <View style={[styles.avatar, { backgroundColor: '#10B981' }]}>
                <Text style={styles.avatarText}>ME</Text>
              </View>
              <Text style={styles.personAmount}>$40</Text>
            </Animated.View>

            {/* Wallet circle */}
            <Animated.View style={[styles.walletCircle, { transform: [{ translateY: anim4 }] }]}>
              <SolanaIcon width={22} height={22} />
            </Animated.View>
          </View>

          {/* Text block */}
          <View style={styles.textBlock}>
            <Text style={styles.title}>Split expenses.{'\n'}Settle on-chain.</Text>
            <Text style={styles.subtitle}>
              Group expense tracking powered by Solana
            </Text>
          </View>
        </View>

        {/* Bottom: CTA */}
        <View style={[styles.bottomBlock, { paddingBottom: insets.bottom + 32 }]}>
          <View style={styles.buttonWrap}>
            <Button
              title="Connect Wallet"
              onPress={() => router.push('/(onboarding)/connect' as any)}
              variant="primary"
              size="lg"
              style={styles.button}
            />
          </View>
          <Text style={styles.poweredBy}>Powered by Solana</Text>
        </View>
      </View>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: SPACING.xxl,
    justifyContent: 'space-between',
  },
  hero: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  logoIcon: {
    width: 44,
    height: 44,
  },
  logoText: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  taglineBlock: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    gap: 40,
    paddingHorizontal: SPACING.xl,
  },
  illustrationContainer: {
    width: 320,
    height: 260,
    position: 'relative',
  },
  centerCard: {
    position: 'absolute',
    left: 110,
    top: 80,
    width: 100,
    height: 100,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  centerCardEmoji: {
    fontSize: 22,
    marginBottom: 2,
  },
  centerCardLabel: {
    fontSize: 9,
    color: 'rgba(255, 255, 255, 0.6)',
    fontWeight: '700',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  centerCardAmount: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '800',
  },
  personCard: {
    position: 'absolute',
    paddingLeft: 6,
    paddingRight: 16,
    paddingVertical: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 32,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.4)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
    gap: 8,
  },
  topLeftCard: {
    left: 12,
    top: 30,
  },
  topRightCard: {
    left: 210,
    top: 30,
  },
  bottomRightCard: {
    left: 210,
    top: 190,
  },
  avatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
  },
  personAmount: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  walletCircle: {
    position: 'absolute',
    left: 25,
    top: 185,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.4)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  textBlock: {
    alignItems: 'center',
  },
  title: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: '800',
    textAlign: 'center',
    lineHeight: 36,
    marginBottom: 16,
    letterSpacing: -0.5,
  },
  subtitle: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
    maxWidth: 280,
  },
  bottomBlock: {
    alignItems: 'center',
    gap: 28,
  },
  buttonWrap: {
    width: '100%',
    paddingHorizontal: 32,
  },
  button: {
    width: '100%',
    // Removed borderRadius so it falls back to RADIUS.full from the Button component
  },
  poweredBy: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 12,
    fontWeight: '500',
  },
});
