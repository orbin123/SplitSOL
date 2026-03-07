import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useAppStore } from '@/store/useAppStore';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { Button } from '@/components/ui/Button';
import { formatCurrency } from '@/utils/formatters';
import {
  calculateBalances,
  getTotalExpenses,
  simplifyDebts,
} from '@/utils/calculations';
import {
  COLORS,
  GRADIENTS,
  SPACING,
  FONT,
  RADIUS,
  TAB_BAR_HEIGHT,
} from '@/utils/constants';
import { Group } from '@/store/types';

const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning,';
  if (hour < 17) return 'Good afternoon,';
  return 'Good evening,';
};

const GROUP_BG_COLORS = [
  '#FEE2E2', '#FEF3C7', '#D1FAE5', '#DBEAFE',
  '#EDE9FE', '#FCE7F3', '#FFEDD5', '#CCFBF1',
];

function getGroupIconBg(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return GROUP_BG_COLORS[Math.abs(hash) % GROUP_BG_COLORS.length];
}

const QUICK_ACTIONS: { key: string; icon: string; label: string }[] = [
  { key: 'split', icon: 'add-circle-outline', label: 'Add Split' },
  { key: 'settle', icon: 'swap-horizontal-outline', label: 'Settle' },
  { key: 'scan', icon: 'scan-outline', label: 'Scan' },
  { key: 'invite', icon: 'people-outline', label: 'Invite' },
];

export default function Home() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const user = useAppStore((s) => s.user);
  const groups = useAppStore((s) => s.groups);
  const unreadNotifications = useAppStore(
    (s) => s.notifications.filter((notification) => !notification.read).length,
  );
  const getBalances = useAppStore((s) => s.getBalances);

  const summaryTotals = useMemo(() => {
    let owedToYou = 0;
    let youOwe = 0;

    for (const group of groups) {
      const currentMember = group.members.find((member) => member.isCurrentUser);
      if (!currentMember) continue;

      const balances = calculateBalances(
        group.expenses,
        group.members,
        group.settlements,
      );
      const simplifiedDebts = simplifyDebts(balances, group.members);

      simplifiedDebts.forEach((debt) => {
        if (debt.to.id === currentMember.id) {
          owedToYou += debt.amount;
        }

        if (debt.from.id === currentMember.id) {
          youOwe += debt.amount;
        }
      });
    }

    return {
      owedToYou: Math.round(owedToYou * 100) / 100,
      youOwe: Math.round(youOwe * 100) / 100,
    };
  }, [groups]);

  const getGroupBalance = (group: Group) => {
    const balances = getBalances(group.id);
    const myBalance = balances.find((b) => {
      const member = group.members.find((m) => m.id === b.memberId);
      return member?.isCurrentUser;
    });
    return myBalance?.amount ?? 0;
  };

  const handleQuickAction = (key: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    switch (key) {
      case 'split':
        if (groups.length === 0) {
          router.push('/group/create');
        } else if (groups.length === 1) {
          router.push(`/group/${groups[0].id}/add-split` as any);
        } else {
          router.push('/split' as any);
        }
        break;
      case 'settle':
        router.push('/settle' as any);
        break;
      case 'scan':
        router.push('/members/scan' as any);
        break;
      case 'invite':
        router.push('/invite' as any);
        break;
    }
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[
        styles.content,
        { paddingTop: insets.top + SPACING.lg },
      ]}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>{getGreeting()}</Text>
          <Text style={styles.userName}>
            {user.name || 'Friend'} 👋
          </Text>
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.bellButton}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              router.push('/notifications' as any);
            }}
            activeOpacity={0.7}
          >
            <Ionicons
              name="notifications-outline"
              size={22}
              color={COLORS.text.primary}
            />
            {unreadNotifications > 0 && (
              <Badge
                label={unreadNotifications > 9 ? '9+' : String(unreadNotifications)}
                size="sm"
                style={styles.badge}
              />
            )}
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              router.push('/(tabs)/profile');
            }}
            activeOpacity={0.7}
          >
            <Avatar name={user.name || 'Me'} size={44} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Overall Balance Card */}
      <LinearGradient
        colors={GRADIENTS.purple}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.balanceCard}
      >
        <Text style={styles.balanceLabel}>OVERALL BALANCE</Text>
        <View style={styles.balanceSummaryRow}>
          <View style={styles.balanceSummaryColumn}>
            <Text style={styles.balanceSummaryLabel}>You&apos;re owed</Text>
            <Text
              style={[styles.balanceSummaryAmount, styles.balanceSummaryPositive]}
            >
              {formatCurrency(summaryTotals.owedToYou)}
            </Text>
          </View>
          <View style={styles.balanceSummaryColumn}>
            <Text style={styles.balanceSummaryLabel}>You owe</Text>
            <Text
              style={[styles.balanceSummaryAmount, styles.balanceSummaryNegative]}
            >
              {formatCurrency(summaryTotals.youOwe)}
            </Text>
          </View>
        </View>
        <Text style={styles.balanceSub}>
          Across {groups.length} group{groups.length !== 1 ? 's' : ''}
        </Text>

        {/* Quick Actions */}
        <View style={styles.quickActions}>
          {QUICK_ACTIONS.map((action) => (
            <TouchableOpacity
              key={action.key}
              style={styles.quickAction}
              onPress={() => handleQuickAction(action.key)}
              activeOpacity={0.7}
            >
              <View style={styles.quickActionIcon}>
                <Ionicons
                  name={action.icon as any}
                  size={22}
                  color={COLORS.bg.accent}
                />
              </View>
              <Text style={styles.quickActionLabel}>{action.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </LinearGradient>

      {/* Groups Section */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Your Groups</Text>
        {groups.length > 3 && (
          <TouchableOpacity onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            router.push('/(tabs)/groups');
          }}>
            <Text style={styles.seeAll}>See All</Text>
          </TouchableOpacity>
        )}
      </View>

      {groups.length === 0 ? (
        <Card style={styles.emptyCard}>
          <EmptyState
            emoji="👥"
            title="No groups yet"
            subtitle="Create your first group to start splitting expenses."
            action={
              <Button
                title="Create Group"
                onPress={() => router.push('/group/create')}
              />
            }
          />
        </Card>
      ) : (
        groups.map((group) => {
          const bal = getGroupBalance(group);
          const total = getTotalExpenses(group.expenses);
          const isSettled = bal === 0 && group.expenses.length > 0;

          return (
            <Card
              key={group.id}
              onPress={() => router.push(`/group/${group.id}`)}
              style={styles.groupCard}
            >
              <View style={styles.groupRow}>
                <View
                  style={[
                    styles.groupIconWrap,
                    { backgroundColor: getGroupIconBg(group.name) },
                  ]}
                >
                  <Text style={styles.groupEmoji}>{group.emoji}</Text>
                </View>
                <View style={styles.groupInfo}>
                  <Text style={styles.groupName}>{group.name}</Text>
                  <Text style={styles.groupMeta}>
                    {group.members.length} member
                    {group.members.length !== 1 ? 's' : ''} ·{' '}
                    {formatCurrency(total)}
                  </Text>
                </View>
                <View style={styles.groupBalance}>
                  {isSettled ? (
                    <>
                      <Text style={styles.settledText}>Settled ✓</Text>
                      <Text style={styles.settledSub}>all clear</Text>
                    </>
                  ) : (
                    <>
                      <Text
                        style={[
                          styles.balText,
                          {
                            color:
                              bal >= 0
                                ? COLORS.text.success
                                : COLORS.text.danger,
                          },
                        ]}
                      >
                        {bal >= 0 ? '+' : '-'}
                        {formatCurrency(Math.abs(bal))}
                      </Text>
                      <Text style={styles.balSub}>
                        {bal >= 0 ? 'you get back' : 'you owe'}
                      </Text>
                    </>
                  )}
                </View>
              </View>
            </Card>
          );
        })
      )}

      {/* FAB — Create Group */}
      {groups.length > 0 && (
        <TouchableOpacity
          style={styles.fab}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            router.push('/group/create');
          }}
          activeOpacity={0.8}
        >
          <Ionicons name="add" size={28} color={COLORS.text.white} />
        </TouchableOpacity>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg.primary,
  },
  content: {
    paddingHorizontal: SPACING.xl,
    paddingBottom: TAB_BAR_HEIGHT + SPACING.lg,
    gap: SPACING.lg,
  },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  },
  bellButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.bg.secondary,
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: 4,
    right: 2,
    minWidth: 22,
    alignItems: 'center',
  },
  greeting: {
    color: COLORS.text.secondary,
    fontSize: FONT.size.md,
  },
  userName: {
    color: COLORS.text.primary,
    fontSize: FONT.size.xxl,
    fontWeight: FONT.weight.bold,
    marginTop: 2,
  },

  balanceCard: {
    borderRadius: RADIUS.xl,
    padding: SPACING.xxl,
    gap: SPACING.xs,
  },
  balanceLabel: {
    color: COLORS.text.accent,
    fontSize: FONT.size.xs,
    fontWeight: FONT.weight.semibold,
    letterSpacing: 1,
  },
  balanceSummaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: SPACING.lg,
    marginTop: SPACING.sm,
  },
  balanceSummaryColumn: {
    flex: 1,
    gap: SPACING.xs,
  },
  balanceSummaryLabel: {
    color: COLORS.text.primary,
    fontSize: FONT.size.sm,
    fontWeight: FONT.weight.semibold,
  },
  balanceSummaryAmount: {
    fontSize: 28,
    fontWeight: FONT.weight.extrabold,
  },
  balanceSummaryPositive: {
    color: COLORS.text.success,
  },
  balanceSummaryNegative: {
    color: COLORS.text.danger,
  },
  balanceSub: {
    color: COLORS.text.secondary,
    fontSize: FONT.size.sm,
    marginBottom: SPACING.lg,
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  quickAction: {
    alignItems: 'center',
    gap: SPACING.xs,
  },
  quickActionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.bg.secondary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  quickActionLabel: {
    color: COLORS.text.secondary,
    fontSize: FONT.size.xs,
    fontWeight: FONT.weight.medium,
  },

  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: SPACING.sm,
  },
  sectionTitle: {
    color: COLORS.text.primary,
    fontSize: FONT.size.lg,
    fontWeight: FONT.weight.bold,
  },
  seeAll: {
    color: COLORS.text.accent,
    fontSize: FONT.size.sm,
    fontWeight: FONT.weight.semibold,
  },

  groupCard: {
    paddingVertical: SPACING.lg,
    paddingHorizontal: SPACING.lg,
  },
  groupRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  groupIconWrap: {
    width: 48,
    height: 48,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md,
  },
  groupEmoji: {
    fontSize: 24,
  },
  groupInfo: {
    flex: 1,
  },
  groupName: {
    color: COLORS.text.primary,
    fontSize: FONT.size.md,
    fontWeight: FONT.weight.semibold,
  },
  groupMeta: {
    color: COLORS.text.secondary,
    fontSize: FONT.size.sm,
    marginTop: 2,
  },
  groupBalance: {
    alignItems: 'flex-end',
  },
  balText: {
    fontSize: FONT.size.md,
    fontWeight: FONT.weight.bold,
  },
  balSub: {
    color: COLORS.text.tertiary,
    fontSize: FONT.size.xs,
    marginTop: 1,
  },
  settledText: {
    color: COLORS.text.tertiary,
    fontSize: FONT.size.sm,
    fontWeight: FONT.weight.medium,
  },
  settledSub: {
    color: COLORS.text.tertiary,
    fontSize: FONT.size.xs,
    marginTop: 1,
  },

  emptyCard: {
    minHeight: 260,
  },

  fab: {
    alignSelf: 'flex-end',
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.bg.accent,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: COLORS.bg.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
    marginTop: SPACING.sm,
  },
});
