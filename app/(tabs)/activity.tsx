import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, SectionList, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppStore } from '@/store/useAppStore';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { Button } from '@/components/ui/Button';
import { COLORS, SPACING, TAB_BAR_HEIGHT } from '@/utils/constants';
import { resolveTransactionDetails } from '@/utils/transactions';

interface TransactionHistoryItem {
  id: string;
  type: 'settlement' | 'expense';
  title: string;
  swapSummary: string | null;
  groupName: string;
  counterpartyName: string;
  timestampLabel: string;
  amountUSDC: number;
  isPositive: boolean;
  status: 'confirmed' | 'pending' | 'failed';
  timestamp: string;
}

function groupByDate(items: TransactionHistoryItem[]) {
  const map = new Map<string, TransactionHistoryItem[]>();
  const today = new Date().toLocaleDateString('en-US');
  const yesterday = new Date(Date.now() - 86400000).toLocaleDateString(
    'en-US',
  );

  for (const item of items) {
    const dObj = new Date(item.timestamp);
    const dStr = dObj.toLocaleDateString('en-US');

    let title = dObj.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });

    if (dStr === today) title = 'TODAY';
    if (dStr === yesterday) title = 'YESTERDAY';

    if (!map.has(title)) map.set(title, []);
    map.get(title)!.push(item);
  }
  return Array.from(map.entries()).map(([title, data]) => ({ title, data }));
}

export default function TransactionsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const user = useAppStore((s) => s.user);
  const groups = useAppStore((s) => s.groups);
  const transactions = useAppStore((s) => s.transactions);

  const [filter, setFilter] = useState<'All' | 'Settlements' | 'Expenses'>('All');

  const items = useMemo(() => {
    let combinedItems: TransactionHistoryItem[] = [];

    if (filter === 'All' || filter === 'Settlements') {
      const txItems = transactions.map((transaction) => {
        const resolved = resolveTransactionDetails(transaction, groups, user);
        return {
          id: transaction.id,
          type: 'settlement' as const,
          title: `You settled with ${resolved.counterpartyName}`,
          swapSummary: resolved.swapSummary,
          groupName: resolved.groupName, // UI mock doesn't show emoji here
          counterpartyName: resolved.counterpartyName,
          timestampLabel: new Date(transaction.timestamp).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }).toLowerCase(),
          amountUSDC: transaction.amountUSDC ?? 0,
          isPositive: true,
          status: transaction.status,
          timestamp: transaction.timestamp,
        };
      });
      combinedItems = [...combinedItems, ...txItems];
    }

    if (filter === 'All' || filter === 'Expenses') {
      groups.forEach((group) => {
        const currentMember = group.members.find((m) => m.isCurrentUser);
        if (!currentMember) return;

        group.expenses.forEach((expense) => {
          const isPaidByMe = expense.paidBy === currentMember.id;
          const isSplitWithMe = expense.splitAmong.includes(currentMember.id);

          if (!isPaidByMe && !isSplitWithMe) return;

          const payer = group.members.find((m) => m.id === expense.paidBy);
          const payerName = isPaidByMe ? 'You' : (payer?.name || 'Someone');

          const title = `${payerName} added an expense`;

          let myShare = 0;
          if (isSplitWithMe) {
            myShare = expense.amount / expense.splitAmong.length;
          }

          let amountImpact = 0;
          if (isPaidByMe) {
            amountImpact = expense.amount - myShare;
          } else {
            amountImpact = -myShare;
          }

          if (amountImpact === 0) return;

          let timestampLabel = new Date(expense.createdAt).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }).toLowerCase();

          combinedItems.push({
            id: expense.id,
            type: 'expense' as const,
            title,
            swapSummary: null,
            groupName: group.name,
            counterpartyName: payerName,
            timestampLabel: timestampLabel,
            amountUSDC: Math.abs(amountImpact),
            isPositive: amountImpact > 0,
            status: amountImpact > 0 ? 'confirmed' : 'pending',
            timestamp: expense.createdAt,
          });
        });
      });
    }

    return combinedItems.sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
    );
  }, [groups, transactions, user, filter]);

  const sections = groupByDate(items);

  const calculateTimeAgo = (timestampLabel: string, timestamp: string) => {
    const diff = Date.now() - new Date(timestamp).getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    if (hours > 0 && hours < 24) return `${hours}h ago`;
    if (hours === 0) return `Just now`;

    const dStr = new Date(timestamp).toLocaleDateString('en-US');
    const yesterday = new Date(Date.now() - 86400000).toLocaleDateString('en-US');
    if (dStr === yesterday) return "Yesterday";

    return timestampLabel;
  };

  const renderItem = ({ item }: { item: TransactionHistoryItem }) => {
    const amountStr = item.amountUSDC.toFixed(2);
    let amountColor = '#111827';
    let sign = '';

    if (item.type === 'expense') {
      amountColor = item.isPositive ? '#10B981' : '#EF4444';
      sign = item.isPositive ? '+' : '-';
    }

    const badgeVariant =
      item.status === 'confirmed'
        ? 'success'
        : item.status === 'failed'
          ? 'danger'
          : 'warning';

    const timeAgoStr = calculateTimeAgo(item.timestampLabel, item.timestamp);

    return (
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={() => item.type === 'settlement' ? router.push(`/tx/detail/${item.id}`) : null}
        style={styles.cardTouchable}
      >
        <View style={styles.card}>
          <Avatar name={item.counterpartyName} size={48} />
          <View style={styles.cardInfo}>
            <Text style={styles.cardTitle}>{item.title}</Text>
            <Text style={styles.cardMeta}>
              {item.groupName} • {timeAgoStr}
            </Text>
          </View>
          <View style={styles.cardRight}>
            <Text
              style={[
                styles.cardAmount,
                { color: amountColor },
              ]}
            >
              {sign}{amountStr} USDC
            </Text>
            <Badge
              label={
                item.status === 'confirmed'
                  ? 'Confirmed'
                  : item.status === 'failed'
                    ? 'Failed'
                    : 'Pending'
              }
              variant={badgeVariant}
              size="sm"
            />
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  if (items.length === 0 && filter === 'All') {
    return (
      <LinearGradient
        colors={['#FDCBEE', '#E7D4FC', '#C1E6F5']}
        style={styles.container}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={[styles.headerContainer, { paddingTop: insets.top + SPACING.lg }]}>
          <Text style={styles.headerTitle}>Activity</Text>
        </View>
        <View style={{ flex: 1, paddingHorizontal: SPACING.xl }}>
          <EmptyState
            emoji="🕐"
            title="No activity yet"
            subtitle="Start splitting with friends!"
            action={
              <Button
                title="Add Expense"
                onPress={() => router.push('/split' as any)}
              />
            }
          />
        </View>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient
      colors={['#FDCBEE', '#E7D4FC', '#C1E6F5']}
      style={styles.container}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    >
      <View style={[styles.headerContainer, { paddingTop: insets.top + SPACING.lg }]}>
        <Text style={styles.headerTitle}>Activity</Text>

        <View style={styles.filterWrapper}>
          <View style={styles.filterContainer}>
            {['All', 'Settlements', 'Expenses'].map((f) => {
              const isActive = filter === f;
              return (
                <TouchableOpacity
                  key={f}
                  style={[styles.filterPill, isActive && styles.filterPillActive]}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setFilter(f as any);
                  }}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.filterText,
                      isActive && styles.filterTextActive,
                    ]}
                  >
                    {f}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </View>

      <SectionList
        sections={sections}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        renderSectionHeader={({ section }) => (
          <Text style={styles.sectionHeader}>{section.title}</Text>
        )}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        stickySectionHeadersEnabled={false}
        ListEmptyComponent={
          <View style={{ marginTop: 40 }}>
            <EmptyState
              emoji="📭"
              title={`No ${filter.toLowerCase()} found`}
              subtitle="Try switching filters"
            />
          </View>
        }
      />
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerContainer: {
    paddingHorizontal: SPACING.xl,
    paddingBottom: SPACING.md,
  },
  headerTitle: {
    color: '#111827',
    fontSize: 34,
    fontWeight: '900',
    marginBottom: SPACING.xl,
    letterSpacing: -0.5,
  },
  filterWrapper: {
    backgroundColor: 'rgba(255, 255, 255, 0.45)',
    borderRadius: 9999,
    padding: 6,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.8)',
  },
  filterContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  filterPill: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 9999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterPillActive: {
    backgroundColor: '#7C3AED',
    shadowColor: '#7C3AED',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  filterText: {
    color: '#6B7280',
    fontSize: 15,
    fontWeight: '700',
  },
  filterTextActive: {
    color: '#FFFFFF',
  },
  list: {
    paddingHorizontal: SPACING.xl,
    paddingBottom: TAB_BAR_HEIGHT + SPACING.xxxl + 40,
  },
  sectionHeader: {
    color: '#6B7280',
    fontSize: 13,
    fontWeight: '800',
    textTransform: 'uppercase',
    marginTop: 20,
    marginBottom: 12,
    letterSpacing: 0.8,
  },
  cardTouchable: {
    marginBottom: 16,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.65)',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.9)',
    gap: 16,
  },
  cardInfo: {
    flex: 1,
  },
  cardTitle: {
    color: '#111827',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  cardMeta: {
    color: '#6B7280',
    fontSize: 13,
    marginTop: 4,
    fontWeight: '500',
  },
  cardRight: {
    alignItems: 'flex-end',
    gap: 6,
  },
  cardAmount: {
    fontSize: 15,
    fontWeight: '800',
  },
});
