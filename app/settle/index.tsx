import React, { useMemo } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppStore } from '@/store/useAppStore';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { formatCurrency } from '@/utils/formatters';
import { COLORS, FONT, RADIUS, SPACING } from '@/utils/constants';

interface PendingDebtItem {
  groupId: string;
  groupName: string;
  groupEmoji: string;
  creditorId: string;
  creditorName: string;
  amount: number;
  settlementId: string;
}

export default function SettleHubScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const groups = useAppStore((s) => s.groups);
  const getSimplifiedDebts = useAppStore((s) => s.getSimplifiedDebts);

  const pendingDebts = useMemo(() => {
    const items: PendingDebtItem[] = [];

    for (const group of groups) {
      const debts = getSimplifiedDebts(group.id);

      for (const debt of debts) {
        if (!debt.from.isCurrentUser) continue;

        items.push({
          groupId: group.id,
          groupName: group.name,
          groupEmoji: group.emoji,
          creditorId: debt.to.id,
          creditorName: debt.to.name,
          amount: debt.amount,
          settlementId: `${debt.from.id}_${debt.to.id}`,
        });
      }
    }

    return items.sort((a, b) => b.amount - a.amount);
  }, [getSimplifiedDebts, groups]);

  const totalOwed = pendingDebts.reduce((sum, debt) => sum + debt.amount, 0);

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + SPACING.lg },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.hero}>
          <Text style={styles.heroLabel}>TOTAL TO SETTLE</Text>
          <Text style={styles.heroAmount}>{formatCurrency(totalOwed)}</Text>
          <Text style={styles.heroSub}>
            {pendingDebts.length === 0
              ? "You're all settled up."
              : `${pendingDebts.length} pending debt${pendingDebts.length === 1 ? '' : 's'} across your groups`}
          </Text>
        </View>

        {pendingDebts.length === 0 ? (
          <EmptyState
            emoji="✅"
            title="You're all settled up!"
            subtitle="No payments are due across any of your groups."
          />
        ) : (
          <View style={styles.list}>
            {pendingDebts.map((debt) => (
              <Card key={`${debt.groupId}-${debt.creditorId}`} style={styles.debtCard}>
                <View style={styles.debtRow}>
                  <Avatar name={debt.creditorName} size={44} />
                  <View style={styles.debtCopy}>
                    <Text style={styles.debtName}>{debt.creditorName}</Text>
                    <Text style={styles.debtMeta}>
                      {debt.groupEmoji} {debt.groupName}
                    </Text>
                  </View>
                  <View style={styles.debtAction}>
                    <Text style={styles.debtAmount}>{formatCurrency(debt.amount)}</Text>
                    <Button
                      title="Pay"
                      size="sm"
                      onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        router.push(
                          `/group/${debt.groupId}/settle/${debt.settlementId}` as any,
                        );
                      }}
                    />
                  </View>
                </View>
              </Card>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg.primary,
  },
  content: {
    paddingHorizontal: SPACING.xl,
    paddingBottom: SPACING.xxxl,
    gap: SPACING.xl,
  },
  hero: {
    backgroundColor: COLORS.bg.secondary,
    borderRadius: RADIUS.xl,
    padding: SPACING.xxl,
    alignItems: 'center',
    gap: SPACING.sm,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  heroLabel: {
    color: COLORS.text.accent,
    fontSize: FONT.size.xs,
    fontWeight: FONT.weight.semibold,
    letterSpacing: 1,
  },
  heroAmount: {
    color: COLORS.text.primary,
    fontSize: 34,
    fontWeight: FONT.weight.extrabold,
  },
  heroSub: {
    color: COLORS.text.secondary,
    fontSize: FONT.size.sm,
    textAlign: 'center',
  },
  list: {
    gap: SPACING.sm,
  },
  debtCard: {
    paddingVertical: SPACING.md,
  },
  debtRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  },
  debtCopy: {
    flex: 1,
  },
  debtName: {
    color: COLORS.text.primary,
    fontSize: FONT.size.md,
    fontWeight: FONT.weight.semibold,
  },
  debtMeta: {
    color: COLORS.text.secondary,
    fontSize: FONT.size.sm,
    marginTop: 2,
  },
  debtAction: {
    alignItems: 'flex-end',
    gap: SPACING.sm,
  },
  debtAmount: {
    color: COLORS.text.danger,
    fontSize: FONT.size.md,
    fontWeight: FONT.weight.bold,
  },
});
