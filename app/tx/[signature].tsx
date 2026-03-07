import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as Linking from 'expo-linking';
import { Button } from '@/components/ui/Button';
import { useAppStore } from '@/store/useAppStore';
import { getExplorerUrl } from '@/utils/solana';
import { COLORS, SPACING, FONT, RADIUS } from '@/utils/constants';
import { resolveTransactionDetails } from '@/utils/transactions';

export default function TransactionSuccess() {
  const { signature, groupId } = useLocalSearchParams<{
    signature: string;
    groupId?: string;
  }>();
  const router = useRouter();
  const user = useAppStore((s) => s.user);
  const groups = useAppStore((s) => s.groups);
  const transactions = useAppStore((s) => s.transactions);

  const transaction = transactions.find((item) => item.signature === signature);
  const resolved = transaction
    ? resolveTransactionDetails(transaction, groups, user)
    : null;

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

        <Animated.View
          style={{
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          }}
        >
          <Text style={styles.title}>Settlement Confirmed</Text>
          <Text style={styles.subtitle}>{resolved?.title ?? 'Payment sent successfully.'}</Text>
          {transaction?.swap && (
            <Text style={styles.swapSummary}>
              Converted {transaction.swap.inputAmount.toFixed(2)} {transaction.swap.inputToken} {'->'} {transaction.swap.outputUSDC.toFixed(2)} USDC
            </Text>
          )}
          {resolved && (
            <Text style={styles.groupLine}>
              {resolved.groupEmoji} {resolved.groupName}
            </Text>
          )}
        </Animated.View>

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
          {transaction && (
            <Button
              title="View Transaction Details"
              onPress={() => router.push(`/tx/detail/${transaction.id}`)}
              variant="secondary"
              size="lg"
              style={styles.actionButton}
            />
          )}
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

  checkCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
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
  swapSummary: {
    color: COLORS.text.secondary,
    fontSize: FONT.size.sm,
    textAlign: 'center',
    marginTop: SPACING.md,
  },
  groupLine: {
    color: COLORS.text.accent,
    fontSize: FONT.size.sm,
    fontWeight: FONT.weight.semibold,
    textAlign: 'center',
    marginTop: SPACING.md,
  },
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
