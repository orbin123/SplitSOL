import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useAppStore } from '@/store/useAppStore';
import { Avatar } from '@/components/ui/Avatar';
import { Card } from '@/components/ui/Card';
import { formatCurrency } from '@/utils/formatters';
import { getTotalExpenses } from '@/utils/calculations';
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
  { key: 'expense', icon: 'add-circle-outline', label: 'Expense' },
  { key: 'settle', icon: 'swap-horizontal-outline', label: 'Settle' },
  { key: 'scan', icon: 'scan-outline', label: 'Scan' },
  { key: 'invite', icon: 'people-outline', label: 'Invite' },
];

export default function Home() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const user = useAppStore((s) => s.user);
  const groups = useAppStore((s) => s.groups);
  const getBalances = useAppStore((s) => s.getBalances);

  const overallBalance = useMemo(() => {
    let total = 0;
    for (const group of groups) {
      const balances = getBalances(group.id);
      const myBalance = balances.find((b) => {
        const member = group.members.find((m) => m.id === b.memberId);
        return member?.isCurrentUser;
      });
      if (myBalance) total += myBalance.amount;
    }
    return total;
  }, [groups, getBalances]);

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
      case 'expense':
        if (groups.length > 0) router.push(`/group/${groups[0].id}/add-expense`);
        else router.push('/group/create');
        break;
      case 'settle':
        if (groups.length > 0) router.push(`/group/${groups[0].id}`);
        break;
      case 'scan':
        router.push('/(tabs)/wallet');
        break;
      case 'invite':
        if (groups.length > 0) router.push(`/group/${groups[0].id}/add-member`);
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
        <TouchableOpacity onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          router.push('/(tabs)/profile');
        }}>
          <Avatar name={user.name || 'Me'} size={44} />
        </TouchableOpacity>
      </View>

      {/* Overall Balance Card */}
      <LinearGradient
        colors={GRADIENTS.purple}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.balanceCard}
      >
        <Text style={styles.balanceLabel}>OVERALL BALANCE</Text>
        <Text style={styles.balanceAmount}>
          {formatCurrency(Math.abs(overallBalance))}
        </Text>
        <Text style={styles.balanceSub}>
          {overallBalance >= 0
            ? `You are owed overall across ${groups.length} group${groups.length !== 1 ? 's' : ''}`
            : `You owe overall across ${groups.length} group${groups.length !== 1 ? 's' : ''}`}
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
          <Text style={styles.emptyEmoji}>👥</Text>
          <Text style={styles.emptyTitle}>No groups yet</Text>
          <Text style={styles.emptySub}>
            Create your first group to start splitting expenses.
          </Text>
          <TouchableOpacity
            style={styles.createBtn}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              router.push('/group/create');
            }}
            activeOpacity={0.8}
          >
            <Text style={styles.createBtnText}>Create Group</Text>
          </TouchableOpacity>
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
  balanceAmount: {
    color: COLORS.text.primary,
    fontSize: 36,
    fontWeight: FONT.weight.extrabold,
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
    alignItems: 'center',
    paddingVertical: SPACING.xxxl,
    gap: SPACING.md,
  },
  emptyEmoji: { fontSize: 48 },
  emptyTitle: {
    color: COLORS.text.primary,
    fontSize: FONT.size.lg,
    fontWeight: FONT.weight.bold,
  },
  emptySub: {
    color: COLORS.text.secondary,
    fontSize: FONT.size.sm,
    textAlign: 'center',
  },
  createBtn: {
    backgroundColor: COLORS.bg.accent,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.xxl,
    borderRadius: RADIUS.md,
    marginTop: SPACING.md,
  },
  createBtnText: {
    color: COLORS.text.white,
    fontWeight: FONT.weight.semibold,
    fontSize: FONT.size.md,
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
