import React, { useMemo } from 'react';
import { View, Text, StyleSheet, SectionList } from 'react-native';
import { useRouter } from 'expo-router';
import { useAppStore } from '@/store/useAppStore';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { COLORS, SPACING, FONT, RADIUS, TAB_BAR_HEIGHT } from '@/utils/constants';
import { resolveTransactionDetails } from '@/utils/transactions';
import { Transaction } from '@/types';

interface TransactionHistoryItem {
  transaction: Transaction;
  title: string;
  swapSummary: string | null;
  groupName: string;
  timestampLabel: string;
}

function groupByDate(items: TransactionHistoryItem[]) {
  const map = new Map<string, TransactionHistoryItem[]>();
  for (const item of items) {
    const d = new Date(item.transaction.timestamp).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
    if (!map.has(d)) map.set(d, []);
    map.get(d)!.push(item);
  }
  return Array.from(map.entries()).map(([title, data]) => ({ title, data }));
}

export default function TransactionsScreen() {
  const router = useRouter();
  const user = useAppStore((s) => s.user);
  const groups = useAppStore((s) => s.groups);
  const transactions = useAppStore((s) => s.transactions);

  const items = useMemo(
    () =>
      [...transactions]
        .sort(
          (a, b) =>
            new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
        )
        .map((transaction) => {
          const resolved = resolveTransactionDetails(transaction, groups, user);

          return {
            transaction,
            title: resolved.title,
            swapSummary: resolved.swapSummary,
            groupName: `${resolved.groupEmoji} ${resolved.groupName}`,
            timestampLabel: new Date(transaction.timestamp).toLocaleTimeString(
              'en-US',
              {
                hour: 'numeric',
                minute: '2-digit',
              },
            ),
          };
        }),
    [groups, transactions, user],
  );
  const sections = groupByDate(items);

  if (items.length === 0) {
    return (
      <View style={styles.container}>
        <EmptyState
          emoji="🧾"
          title="No transactions yet"
          subtitle="Settlements will appear here once you start paying people."
        />
      </View>
    );
  }

  const renderItem = ({ item }: { item: TransactionHistoryItem }) => {
    const statusStyle =
      item.transaction.status === 'confirmed'
        ? styles.statusConfirmed
        : item.transaction.status === 'failed'
          ? styles.statusFailed
          : styles.statusPending;
    const statusTextStyle =
      item.transaction.status === 'confirmed'
        ? styles.statusTextConfirmed
        : item.transaction.status === 'failed'
          ? styles.statusTextFailed
          : styles.statusTextPending;

    return (
      <Card
        style={styles.card}
        onPress={() => router.push(`/tx/detail/${item.transaction.id}`)}
      >
        <View style={styles.cardRow}>
          <View style={styles.cardInfo}>
            <Text style={styles.cardTitle}>{item.title}</Text>
            {item.swapSummary && (
              <Text style={styles.cardSwap}>{item.swapSummary}</Text>
            )}
            <Text style={styles.cardMeta}>{item.groupName}</Text>
          </View>
          <View style={styles.cardRight}>
            <Text style={styles.cardTime}>{item.timestampLabel}</Text>
            <View
              style={[
                styles.statusBadge,
                statusStyle,
              ]}
            >
              <Text
                style={[
                  styles.statusText,
                  statusTextStyle,
                ]}
              >
                {item.transaction.status}
              </Text>
            </View>
          </View>
        </View>
      </Card>
    );
  };

  return (
    <View style={styles.container}>
      <SectionList
        sections={sections}
        keyExtractor={(item) => item.transaction.id}
        renderItem={renderItem}
        renderSectionHeader={({ section }) => (
          <Text style={styles.sectionHeader}>{section.title}</Text>
        )}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        stickySectionHeadersEnabled={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg.primary,
  },
  list: {
    padding: SPACING.lg,
    paddingBottom: TAB_BAR_HEIGHT + SPACING.lg,
    gap: SPACING.sm,
  },
  sectionHeader: {
    color: COLORS.text.tertiary,
    fontSize: FONT.size.xs,
    fontWeight: FONT.weight.semibold,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginTop: SPACING.lg,
    marginBottom: SPACING.sm,
  },

  card: {
    gap: SPACING.sm,
  },
  cardRow: { flexDirection: 'row', gap: SPACING.md },
  cardInfo: {
    flex: 1,
  },
  cardTitle: {
    color: COLORS.text.primary,
    fontSize: FONT.size.md,
    fontWeight: FONT.weight.medium,
  },
  cardMeta: {
    color: COLORS.text.secondary,
    fontSize: FONT.size.sm,
    marginTop: SPACING.xs,
  },
  cardSwap: {
    color: COLORS.text.tertiary,
    fontSize: FONT.size.sm,
    marginTop: 2,
  },
  cardRight: {
    alignItems: 'flex-end',
    gap: SPACING.xs,
  },
  cardTime: {
    color: COLORS.text.tertiary,
    fontSize: FONT.size.sm,
    fontWeight: FONT.weight.medium,
  },
  statusBadge: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
    borderRadius: RADIUS.sm,
  },
  statusConfirmed: {
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
  },
  statusPending: {
    backgroundColor: 'rgba(245, 158, 11, 0.12)',
  },
  statusFailed: {
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
  },
  statusText: {
    fontSize: FONT.size.xs,
    fontWeight: FONT.weight.semibold,
    textTransform: 'capitalize',
  },
  statusTextConfirmed: {
    color: COLORS.text.success,
  },
  statusTextPending: {
    color: COLORS.bg.warning,
  },
  statusTextFailed: {
    color: COLORS.text.danger,
  },
});
