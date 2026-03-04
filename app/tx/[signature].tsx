import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as Linking from 'expo-linking';
import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';
import { Button } from '@/components/ui/Button';
import { truncateAddress } from '@/utils/formatters';
import { getExplorerUrl } from '@/utils/solana';
import { COLORS, SPACING, FONT, RADIUS } from '@/utils/constants';

export default function TransactionSuccess() {
  const { signature, groupId } = useLocalSearchParams<{
    signature: string;
    groupId?: string;
  }>();
  const router = useRouter();

  const scaleAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      friction: 4,
      tension: 40,
      useNativeDriver: true,
    }).start();

    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      delay: 300,
      useNativeDriver: true,
    }).start();

    Animated.timing(slideAnim, {
      toValue: 0,
      duration: 500,
      delay: 300,
      useNativeDriver: true,
    }).start();
  }, [scaleAnim, fadeAnim, slideAnim]);

  const openExplorer = () => {
    Linking.openURL(getExplorerUrl(signature));
  };

  const copySignature = async () => {
    await Clipboard.setStringAsync(signature);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    Alert.alert('Copied!', 'Transaction signature copied to clipboard.');
  };

  const goBackToGroup = () => {
    if (groupId) {
      router.replace(`/group/${groupId}`);
    } else {
      router.replace('/');
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        {/* Animated Checkmark */}
        <Animated.View
          style={[
            styles.checkCircle,
            { transform: [{ scale: scaleAnim }] },
          ]}
        >
          <View style={styles.checkCircleInner}>
            <Text style={styles.checkMark}>✓</Text>
          </View>
        </Animated.View>

        {/* Title & Subtitle */}
        <Animated.View
          style={{
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          }}
        >
          <Text style={styles.title}>Settlement Confirmed</Text>
          <Text style={styles.subtitle}>
            Your transaction has been confirmed on the Solana network.
          </Text>
        </Animated.View>

        {/* Signature */}
        <Animated.View
          style={[styles.signatureCard, { opacity: fadeAnim }]}
        >
          <Text style={styles.signatureLabel}>Transaction Signature</Text>
          <TouchableOpacity onPress={copySignature} activeOpacity={0.6}>
            <Text style={styles.signatureText}>
              {truncateAddress(signature, 12)}
            </Text>
            <Text style={styles.tapHint}>Tap to copy</Text>
          </TouchableOpacity>
        </Animated.View>

        {/* Actions */}
        <Animated.View
          style={[styles.actions, { opacity: fadeAnim }]}
        >
          <Button
            title="View on Solana Explorer"
            onPress={openExplorer}
            variant="secondary"
            size="lg"
            style={styles.actionButton}
          />
          <Button
            title="Back to Group"
            onPress={goBackToGroup}
            variant="primary"
            size="lg"
            style={styles.actionButton}
          />
        </Animated.View>
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
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SPACING.xxl,
  },

  // Checkmark
  checkCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.xxl,
  },
  checkCircleInner: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: COLORS.bg.success,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkMark: {
    color: '#FFFFFF',
    fontSize: 36,
    fontWeight: '800',
  },

  // Title
  title: {
    color: COLORS.text.primary,
    fontSize: FONT.size.xxl,
    fontWeight: FONT.weight.bold,
    textAlign: 'center',
    marginBottom: SPACING.sm,
  },
  subtitle: {
    color: COLORS.text.secondary,
    fontSize: FONT.size.md,
    textAlign: 'center',
    lineHeight: 22,
  },

  // Signature Card
  signatureCard: {
    backgroundColor: COLORS.bg.secondary,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border.default,
    padding: SPACING.xl,
    marginTop: SPACING.xxxl,
    alignItems: 'center',
    width: '100%',
  },
  signatureLabel: {
    color: COLORS.text.tertiary,
    fontSize: FONT.size.xs,
    fontWeight: FONT.weight.semibold,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: SPACING.sm,
  },
  signatureText: {
    color: COLORS.text.accent,
    fontSize: FONT.size.md,
    fontWeight: FONT.weight.semibold,
    fontFamily: 'monospace',
    textAlign: 'center',
  },
  tapHint: {
    color: COLORS.text.tertiary,
    fontSize: FONT.size.xs,
    marginTop: SPACING.xs,
    textAlign: 'center',
  },

  // Actions
  actions: {
    width: '100%',
    marginTop: SPACING.xxxl,
    gap: SPACING.md,
  },
  actionButton: {
    width: '100%',
    paddingVertical: SPACING.lg,
    borderRadius: RADIUS.lg,
  },
});
