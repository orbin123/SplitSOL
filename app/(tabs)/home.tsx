import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useAppStore } from '@/store/useAppStore';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { Button } from '@/components/ui/Button';
import {
  calculateBalances,
  simplifyDebts,
} from '@/utils/calculations';
import {
  COLORS,
  SPACING,
  TAB_BAR_HEIGHT,
  SHADOWS,
} from '@/utils/constants';
import { Group } from '@/types';
import { seedMockData, clearMockData } from '@/utils/seedMockData';

const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning,';
  if (hour < 17) return 'Good afternoon,';
  return 'Good evening,';
};

const GROUP_BG_COLORS = [
  'rgba(254, 226, 226, 0.6)', 'rgba(254, 243, 199, 0.6)', 'rgba(209, 250, 229, 0.6)', 'rgba(219, 234, 254, 0.6)',
  'rgba(237, 233, 254, 0.6)', 'rgba(252, 231, 243, 0.6)', 'rgba(255, 237, 213, 0.6)', 'rgba(204, 251, 241, 0.6)',
];

function getGroupIconBg(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return GROUP_BG_COLORS[Math.abs(hash) % GROUP_BG_COLORS.length];
}

const QUICK_ACTIONS: { key: string; icon: string; label: string }[] = [
  { key: 'split', icon: 'add', label: 'Add Split' },
  { key: 'settle', icon: 'swap-horizontal', label: 'Settle' },
  { key: 'scan', icon: 'qr-code', label: 'Scan' },
  { key: 'invite', icon: 'people', label: 'Invite' },
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
      total: Math.round((owedToYou - youOwe) * 100) / 100,
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
        router.push('/group/create');
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
    <LinearGradient
      colors={['#FDCBEE', '#E7D4FC', '#C1E6F5']}
      style={styles.container}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    >
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + SPACING.lg },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* ── 🌱 DEV SEED BANNER — delete when done designing ─────── */}
        <View style={styles.devBanner}>
          <Text style={styles.devLabel}>🌱 Design Mode</Text>
          <TouchableOpacity
            style={styles.devBtn}
            onPress={() => seedMockData()}
            activeOpacity={0.7}
          >
            <Text style={styles.devBtnText}>Seed Data</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.devBtn, styles.devBtnDanger]}
            onPress={() => clearMockData()}
            activeOpacity={0.7}
          >
            <Text style={styles.devBtnText}>Clear</Text>
          </TouchableOpacity>
        </View>
        {/* ─────────────────────────────────────────────────────────── */}
        <View style={styles.header}>
          <Text style={styles.greetingHeader}>
            {getGreeting()} {user.name || 'Friend'}
          </Text>
          <TouchableOpacity
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              router.push('/(tabs)/profile');
            }}
            activeOpacity={0.7}
          >
            <View style={styles.avatarWrapper}>
              <Text style={styles.avatarText}>
                {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
              </Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Hero Balance Card */}
        <View style={styles.heroCard}>
          <View style={styles.heroCardContent}>
            <Text style={styles.heroLabel}>Your overall balance</Text>
            <Text style={styles.heroAmount}>
              {summaryTotals.total >= 0 ? '' : '-'}
              {Math.abs(summaryTotals.total).toFixed(2)}{' '}
              <Text style={styles.heroAmountCurrency}>USDC</Text>
            </Text>
            <View style={styles.heroSubRow}>
              <View style={styles.heroSubColGreen}>
                <Text style={styles.heroSubLabel}>You're owed</Text>
                <Text
                  style={styles.heroSubGreen}
                  numberOfLines={2}
                  adjustsFontSizeToFit
                >
                  {summaryTotals.owedToYou.toFixed(2)}{'\n'}USDC
                </Text>
              </View>
              <View style={styles.heroSubColRed}>
                <Text style={styles.heroSubLabel}>You owe</Text>
                <Text
                  style={styles.heroSubRed}
                  numberOfLines={2}
                  adjustsFontSizeToFit
                >
                  {summaryTotals.youOwe.toFixed(2)} USDC
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.quickActionsContainer}>
          {QUICK_ACTIONS.map((action) => (
            <TouchableOpacity
              key={action.key}
              style={styles.quickActionItem}
              onPress={() => handleQuickAction(action.key)}
              activeOpacity={0.7}
            >
              <View style={styles.quickActionBtn}>
                <Ionicons
                  name={action.icon as any}
                  size={26}
                  color={COLORS.bg.accent}
                />
              </View>
              <Text style={styles.quickActionText}>{action.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Groups Section */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Your Groups</Text>
            <TouchableOpacity
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                router.push('/(tabs)/groups');
              }}
            >
              <Text style={styles.seeAll}>See All</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.groupList}>
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
                const isSettled = bal === 0 && group.expenses.length > 0;

                return (
                  <TouchableOpacity
                    key={group.id}
                    onPress={() => router.push(`/group/${group.id}`)}
                    activeOpacity={0.7}
                  >
                    <View style={styles.groupCard}>
                      <View
                        style={[
                          styles.groupEmojiBox,
                          { backgroundColor: getGroupIconBg(group.name) },
                        ]}
                      >
                        <Text style={styles.groupEmoji}>{group.emoji}</Text>
                      </View>
                      <View style={styles.groupInfo}>
                        <Text style={styles.groupName}>{group.name}</Text>
                        <Text style={styles.groupMeta}>
                          {group.members.length} member
                          {group.members.length !== 1 ? 's' : ''}
                        </Text>
                      </View>
                      <View style={styles.groupBalContainer}>
                        {isSettled ? (
                          <>
                            <Text style={styles.groupBalNeutral}>All Settled</Text>
                            <Text style={styles.groupBalSub}>0.00</Text>
                          </>
                        ) : (
                          <>
                            <Text
                              style={[
                                styles.groupBalAmount,
                                { color: bal > 0 ? '#10B981' : '#EF4444' },
                              ]}
                            >
                              {bal > 0 ? '+' : ''}
                              {bal.toFixed(2)}
                            </Text>
                            <Text style={styles.groupBalSub}>USDC</Text>
                          </>
                        )}
                      </View>
                    </View>
                  </TouchableOpacity>
                );
              })
            )}
          </View>
        </View>

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
            <Ionicons name="add" size={32} color={COLORS.text.white} />
          </TouchableOpacity>
        )}
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingHorizontal: SPACING.xl,
    paddingBottom: TAB_BAR_HEIGHT + SPACING.xxxl + 72,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.xxxl,
    paddingHorizontal: 8,
  },
  greetingHeader: {
    color: COLORS.bg.dark,
    fontSize: 26,
    fontWeight: '800',
    flex: 1,
    letterSpacing: -0.5,
  },
  avatarWrapper: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#EBE0FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#7C3AED',
    fontSize: 20,
    fontWeight: 'bold',
  },
  heroCard: {
    marginBottom: SPACING.xxxl,
    backgroundColor: 'rgba(255, 255, 255, 0.45)',
    borderRadius: 32,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.8)',
  },
  heroCardContent: {
    padding: 28,
  },
  heroLabel: {
    color: '#6B7280',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  heroAmount: {
    fontSize: 44,
    fontWeight: '900',
    letterSpacing: -1,
    color: '#111827',
    marginBottom: 24,
  },
  heroAmountCurrency: {
    fontSize: 22,
    fontWeight: '800',
    color: '#9CA3AF',
  },
  heroSubRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 16,
  },
  heroSubColGreen: {
    flex: 1,
    backgroundColor: 'rgba(16, 185, 129, 0.12)', // Subtle green tinted glass
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.25)',
    padding: 16,
    borderRadius: 20,
  },
  heroSubColRed: {
    flex: 1,
    backgroundColor: 'rgba(239, 68, 68, 0.12)', // Subtle red tinted glass
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.25)',
    padding: 16,
    borderRadius: 20,
  },
  heroSubLabel: {
    color: '#6B7280',
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 8,
  },
  heroSubGreen: {
    color: '#10B981',
    fontSize: 20,
    fontWeight: '800',
    lineHeight: 24,
  },
  heroSubRed: {
    color: '#EF4444',
    fontSize: 20,
    fontWeight: '800',
    lineHeight: 24,
  },
  quickActionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 48,
    paddingHorizontal: 8,
  },
  quickActionItem: {
    alignItems: 'center',
    gap: 12,
  },
  quickActionBtn: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(255, 255, 255, 0.55)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.8)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickActionText: {
    color: '#111827',
    fontSize: 14,
    fontWeight: '700',
  },
  sectionContainer: {
    flex: 1,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingHorizontal: 8,
  },
  sectionTitle: {
    color: '#111827',
    fontSize: 22,
    fontWeight: '800',
  },
  seeAll: {
    color: '#7C3AED',
    fontSize: 16,
    fontWeight: '700',
  },
  groupList: {
    flexDirection: 'column',
    gap: 16,
  },
  groupCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.55)',
    borderRadius: 28,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.8)',
  },
  groupEmojiBox: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  groupEmoji: {
    fontSize: 24,
  },
  groupInfo: {
    flex: 1,
  },
  groupName: {
    color: '#111827',
    fontSize: 18,
    fontWeight: '800',
  },
  groupMeta: {
    color: '#6B7280',
    fontSize: 14,
    fontWeight: '500',
    marginTop: 4,
  },
  groupBalContainer: {
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  groupBalAmount: {
    fontSize: 18,
    fontWeight: '900',
  },
  groupBalNeutral: {
    fontSize: 16,
    fontWeight: '800',
    color: '#9CA3AF',
  },
  groupBalSub: {
    color: '#9CA3AF',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 2,
    textTransform: 'uppercase',
  },
  emptyCard: {
    minHeight: 200,
    borderRadius: 28,
  },
  fab: {
    position: 'absolute',
    bottom: TAB_BAR_HEIGHT + SPACING.xxxl,
    right: SPACING.xl,
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#7C3AED',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#7C3AED',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 15,
    elevation: 8,
    zIndex: 20,
  },
  devBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.55)',
    borderRadius: 16,
    paddingVertical: 8,
    paddingHorizontal: 14,
    marginBottom: 16,
    gap: 8,
  },
  devLabel: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
    flex: 1,
  },
  devBtn: {
    backgroundColor: '#10B981',
    borderRadius: 10,
    paddingVertical: 5,
    paddingHorizontal: 12,
  },
  devBtnDanger: {
    backgroundColor: '#EF4444',
  },
  devBtnText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
});
