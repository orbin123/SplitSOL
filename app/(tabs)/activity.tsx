import React, { useMemo, useState } from 'react';
import {
  SectionList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useAppStore } from '@/store/useAppStore';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { Button } from '@/components/ui/Button';
import { COLORS, SPACING, TAB_BAR_HEIGHT } from '@/utils/constants';

interface ActivityItem {
  id: string;
  type: 'settlement' | 'expense';
  direction: 'sent' | 'received' | 'neutral';
  title: string;
  metaSuffix: string | null; // e.g. "via SOL equivalent"
  groupName: string;
  groupEmoji: string;
  counterpartyName: string;
  amountUSDC: number;
  isPositive: boolean; // for expense coloring
  status: 'confirmed' | 'pending' | 'failed';
  paymentMethod: string | null;
  timestamp: string;
}

function paymentMethodLabel(method: string | null | undefined): string | null {
  if (!method || method === 'USDC') return null;
  if (method === 'SOL_EQUIVALENT') return 'SOL equiv.';
  if (method === 'JUPITER_SWAP') return 'Jupiter';
  return method;
}

function groupByDate(items: ActivityItem[]) {
  const map = new Map<string, ActivityItem[]>();
  const todayStr = new Date().toLocaleDateString('en-US');
  const yesterdayStr = new Date(Date.now() - 86_400_000).toLocaleDateString('en-US');

  for (const item of items) {
    const d = new Date(item.timestamp);
    const dStr = d.toLocaleDateString('en-US');
    let header = d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
    if (dStr === todayStr) header = 'TODAY';
    else if (dStr === yesterdayStr) header = 'YESTERDAY';

    if (!map.has(header)) map.set(header, []);
    map.get(header)!.push(item);
  }
  return Array.from(map.entries()).map(([title, data]) => ({ title, data }));
}

function timeAgoLabel(timestamp: string): string {
  const diff = Date.now() - new Date(timestamp).getTime();
  const mins = Math.floor(diff / 60_000);
  const hours = Math.floor(diff / 3_600_000);
  if (mins < 1) return 'Just now';
  if (hours < 1) return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  const todayStr = new Date().toLocaleDateString('en-US');
  const dStr = new Date(timestamp).toLocaleDateString('en-US');
  const yesterdayStr = new Date(Date.now() - 86_400_000).toLocaleDateString('en-US');
  if (dStr === yesterdayStr) return 'Yesterday';
  return new Date(timestamp).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  });
}

export default function ActivityScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const groups = useAppStore((s) => s.groups);
  const user = useAppStore((s) => s.user);

  const [filter, setFilter] = useState<'All' | 'Settlements' | 'Expenses'>('All');

  const items = useMemo<ActivityItem[]>(() => {
    const combined: ActivityItem[] = [];

    groups.forEach((group) => {
      const currentMember = group.members.find((m) => m.isCurrentUser);

      // ── Settlements from this group ──────────────────────────────────────
      if (filter === 'All' || filter === 'Settlements') {
        group.settlements.forEach((s) => {
          if (s.status === 'failed') return;

          const isSent = s.from === currentMember?.id;
          const isReceived = s.to === currentMember?.id;
          if (!isSent && !isReceived) return;

          const counterpartyId = isSent ? s.to : s.from;
          const counterparty = group.members.find((m) => m.id === counterpartyId);
          const counterpartyName = counterparty?.name ?? 'Unknown';

          const methodLabel = paymentMethodLabel(s.paymentMethod);

          combined.push({
            id: s.id,
            type: 'settlement',
            direction: isSent ? 'sent' : 'received',
            title: isSent
              ? `You paid ${counterpartyName}`
              : `${counterpartyName} paid you`,
            metaSuffix: methodLabel ? `via ${methodLabel}` : null,
            groupName: group.name,
            groupEmoji: group.emoji,
            counterpartyName,
            amountUSDC: s.amount,
            isPositive: isReceived,
            status: s.status === 'confirmed' ? 'confirmed' : 'pending',
            paymentMethod: s.paymentMethod ?? null,
            timestamp: s.settledAt,
          });
        });
      }

      // ── Expenses from this group ─────────────────────────────────────────
      if (filter === 'All' || filter === 'Expenses') {
        if (!currentMember) return;

        group.expenses.forEach((expense) => {
          const isPaidByMe = expense.paidBy === currentMember.id;
          const isSplitWithMe = expense.splitAmong.includes(currentMember.id);
          if (!isPaidByMe && !isSplitWithMe) return;

          const payer = group.members.find((m) => m.id === expense.paidBy);
          const payerName = isPaidByMe ? 'You' : (payer?.name ?? 'Someone');
          const myShare = isSplitWithMe
            ? expense.amount / expense.splitAmong.length
            : 0;
          const impact = isPaidByMe ? expense.amount - myShare : -myShare;
          if (Math.abs(impact) < 0.01) return;

          combined.push({
            id: expense.id,
            type: 'expense',
            direction: 'neutral',
            title: isPaidByMe
              ? `You added "${expense.description}"`
              : `${payerName} added "${expense.description}"`,
            metaSuffix: null,
            groupName: group.name,
            groupEmoji: group.emoji,
            counterpartyName: payerName,
            amountUSDC: Math.abs(impact),
            isPositive: impact > 0,
            status: 'confirmed',
            paymentMethod: null,
            timestamp: expense.createdAt,
          });
        });
      }
    });

    return combined.sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
    );
  }, [groups, user, filter]);

  const sections = useMemo(() => groupByDate(items), [items]);

  const renderItem = ({ item }: { item: ActivityItem }) => {
    const timeStr = timeAgoLabel(item.timestamp);
    const methodLabel = paymentMethodLabel(item.paymentMethod);
    const isSettlement = item.type === 'settlement';

    // Amount color: green for received/lent, red for owed, neutral for settlements
    const amountColor = isSettlement
      ? '#111827'
      : item.isPositive
        ? COLORS.bg.success
        : COLORS.bg.danger;

    const badgeVariant =
      item.status === 'confirmed'
        ? 'success'
        : item.status === 'failed'
          ? 'danger'
          : 'warning';

    const metaText = [
      `${item.groupEmoji} ${item.groupName}`,
      timeStr,
      item.metaSuffix,
    ]
      .filter(Boolean)
      .join(' · ');

    return (
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={() => {
          if (isSettlement) {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            router.push(`/tx/detail/${item.id}` as any);
          }
        }}
        style={styles.cardTouchable}
      >
        <View style={styles.card}>
          {/* Direction icon for settlements, avatar for expenses */}
          {isSettlement ? (
            <View
              style={[
                styles.directionIconWrap,
                {
                  backgroundColor:
                    item.direction === 'sent'
                      ? 'rgba(124, 58, 237, 0.1)'
                      : 'rgba(16, 185, 129, 0.1)',
                },
              ]}
            >
              <Ionicons
                name={item.direction === 'sent' ? 'arrow-up-outline' : 'arrow-down-outline'}
                size={22}
                color={item.direction === 'sent' ? '#7C3AED' : '#10B981'}
              />
            </View>
          ) : (
            <Avatar name={item.counterpartyName} size={48} />
          )}

          <View style={styles.cardInfo}>
            <Text style={styles.cardTitle} numberOfLines={1}>
              {item.title}
            </Text>
            <Text style={styles.cardMeta} numberOfLines={1}>
              {metaText}
            </Text>
          </View>

          <View style={styles.cardRight}>
            <Text style={[styles.cardAmount, { color: amountColor }]}>
              {isSettlement
                ? `${item.amountUSDC.toFixed(2)} USDC`
                : `${item.isPositive ? '+' : '-'}${item.amountUSDC.toFixed(2)} USDC`}
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
            {methodLabel && (
              <View style={styles.methodPill}>
                <Text style={styles.methodPillText}>{methodLabel}</Text>
              </View>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const isEmpty = items.length === 0 && filter === 'All';

  if (isEmpty) {
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
            subtitle="Settle up or add an expense to see activity here."
            action={
              <Button
                title="New Group"
                onPress={() => router.push('/group/create' as any)}
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
            {(['All', 'Settlements', 'Expenses'] as const).map((f) => {
              const isActive = filter === f;
              return (
                <TouchableOpacity
                  key={f}
                  style={[styles.filterPill, isActive && styles.filterPillActive]}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setFilter(f);
                  }}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.filterText, isActive && styles.filterTextActive]}>
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
  container: { flex: 1 },
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
  filterText: { color: '#6B7280', fontSize: 15, fontWeight: '700' },
  filterTextActive: { color: '#FFFFFF' },
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
  cardTouchable: { marginBottom: 12 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.65)',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.9)',
    gap: 14,
  },
  directionIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardInfo: { flex: 1 },
  cardTitle: {
    color: '#111827',
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  cardMeta: {
    color: '#6B7280',
    fontSize: 12,
    marginTop: 3,
    fontWeight: '500',
  },
  cardRight: { alignItems: 'flex-end', gap: 5 },
  cardAmount: { fontSize: 15, fontWeight: '800' },
  methodPill: {
    backgroundColor: 'rgba(124, 58, 237, 0.08)',
    borderRadius: 8,
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  methodPillText: {
    color: '#7C3AED',
    fontSize: 11,
    fontWeight: '700',
  },
});
