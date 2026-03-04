import React, { useState } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useAppStore } from '@/store/useAppStore';
import { Avatar } from '@/components/ui/Avatar';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { formatCurrency, timeAgo } from '@/utils/formatters';
import { getTotalExpenses } from '@/utils/calculations';
import { COLORS, GRADIENTS, SPACING, FONT, RADIUS } from '@/utils/constants';
import { Expense, SimplifiedDebt } from '@/store/types';

type Tab = 'expenses' | 'balances';

const CATEGORY_EMOJI: Record<string, string> = {
  food: '🍽',
  transport: '🚕',
  stay: '🏨',
  shopping: '🛍',
  entertainment: '🎬',
  other: '📝',
};

const EXPENSE_BG = [
  '#FEE2E2', '#FEF3C7', '#D1FAE5', '#DBEAFE',
  '#EDE9FE', '#FCE7F3', '#FFEDD5', '#CCFBF1',
];

function getExpenseBg(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return EXPENSE_BG[Math.abs(hash) % EXPENSE_BG.length];
}

export default function GroupDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const group = useAppStore((s) => s.getGroup(id));
  const getSimplifiedDebts = useAppStore((s) => s.getSimplifiedDebts);
  const [activeTab, setActiveTab] = useState<Tab>('expenses');

  if (!group) {
    return (
      <View style={styles.container}>
        <Text style={styles.notFound}>Group not found</Text>
      </View>
    );
  }

  const debts = getSimplifiedDebts(id);
  const totalExpenses = getTotalExpenses(group.expenses);

  const renderExpenseItem = ({ item }: { item: Expense }) => {
    const payer = group.members.find((m) => m.id === item.paidBy);
    const emoji = CATEGORY_EMOJI[item.category || 'other'] || '📝';

    return (
      <Card style={styles.expenseCard}>
        <View style={styles.expenseRow}>
          <View
            style={[
              styles.expenseIconWrap,
              { backgroundColor: getExpenseBg(item.description) },
            ]}
          >
            <Text style={styles.expenseEmoji}>{emoji}</Text>
          </View>
          <View style={styles.expenseInfo}>
            <Text style={styles.expenseDesc}>{item.description}</Text>
            <Text style={styles.expenseMeta}>
              Paid by {payer?.name ?? 'Unknown'} · {timeAgo(item.createdAt)}
            </Text>
          </View>
          <Text style={styles.expenseAmount}>
            {formatCurrency(item.amount)}
          </Text>
        </View>
      </Card>
    );
  };

  const renderDebtItem = (debt: SimplifiedDebt, index: number) => (
    <Card key={index} style={styles.debtCard}>
      <View style={styles.debtRow}>
        <Avatar name={debt.from.name} size={36} />
        <View style={styles.debtInfo}>
          <Text style={styles.debtText}>
            <Text style={styles.debtName}>{debt.from.name}</Text>
            {' owes '}
            <Text style={styles.debtName}>{debt.to.name}</Text>
          </Text>
          <Text style={styles.debtAmount}>
            {formatCurrency(debt.amount)}
          </Text>
        </View>
        <Button
          title="Settle"
          variant="primary"
          size="sm"
          onPress={() =>
            router.push(
              `/group/${id}/settle/${debt.from.id}_${debt.to.id}`,
            )
          }
        />
      </View>
    </Card>
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Custom Header */}
      <View style={styles.headerBar}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backBtn}
          activeOpacity={0.7}
        >
          <Ionicons
            name="chevron-back"
            size={24}
            color={COLORS.text.primary}
          />
        </TouchableOpacity>
        <Text style={styles.headerEmoji}>{group.emoji}</Text>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {group.name}
        </Text>
        <View style={{ flex: 1 }} />
        <TouchableOpacity activeOpacity={0.7}>
          <Text style={styles.editBtn}>Edit</Text>
        </TouchableOpacity>
      </View>

      {/* Members Row */}
      <View style={styles.membersRow}>
        {group.members.slice(0, 6).map((member) => (
          <View key={member.id} style={styles.memberAvatar}>
            <Avatar name={member.name} size={36} />
          </View>
        ))}
        <TouchableOpacity
          style={styles.addMemberBtn}
          onPress={() => router.push(`/group/${id}/add-member`)}
          activeOpacity={0.7}
        >
          <Ionicons name="add" size={18} color={COLORS.text.secondary} />
        </TouchableOpacity>
        <Text style={styles.memberCount}>
          {group.members.length} members
        </Text>
      </View>

      {/* Total Expenses Gradient Card */}
      <View style={styles.summaryWrap}>
        <LinearGradient
          colors={GRADIENTS.purple}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.summaryCard}
        >
          <Text style={styles.summaryLabel}>TOTAL EXPENSES</Text>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryAmount}>
              {formatCurrency(totalExpenses)}
            </Text>
            <View style={styles.expenseCountBadge}>
              <Text style={styles.expenseCountText}>
                {group.expenses.length} expense
                {group.expenses.length !== 1 ? 's' : ''}
              </Text>
            </View>
          </View>
        </LinearGradient>
      </View>

      {/* Tab Switcher */}
      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'expenses' && styles.tabActive]}
          onPress={() => setActiveTab('expenses')}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === 'expenses' && styles.tabTextActive,
            ]}
          >
            Expenses
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'balances' && styles.tabActive]}
          onPress={() => setActiveTab('balances')}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === 'balances' && styles.tabTextActive,
            ]}
          >
            Balances
          </Text>
        </TouchableOpacity>
      </View>

      {/* Tab Content */}
      {activeTab === 'expenses' ? (
        group.expenses.length === 0 ? (
          <EmptyState
            emoji="🧾"
            title="No expenses yet"
            subtitle="Add your first expense to start tracking."
          />
        ) : (
          <FlatList
            data={group.expenses}
            keyExtractor={(item) => item.id}
            renderItem={renderExpenseItem}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
          />
        )
      ) : debts.length === 0 ? (
        <EmptyState
          emoji="✅"
          title="All settled up!"
          subtitle="No outstanding balances in this group."
        />
      ) : (
        <ScrollView
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        >
          {debts.map(renderDebtItem)}
        </ScrollView>
      )}

      {/* Add Expense Button */}
      {activeTab === 'expenses' && (
        <TouchableOpacity
          style={styles.fab}
          onPress={() => router.push(`/group/${id}/add-expense`)}
          activeOpacity={0.8}
        >
          <Ionicons name="add" size={28} color={COLORS.text.white} />
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg.primary,
  },
  notFound: {
    color: COLORS.text.secondary,
    fontSize: FONT.size.md,
    textAlign: 'center',
    marginTop: 100,
  },

  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    gap: SPACING.sm,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerEmoji: {
    fontSize: 24,
  },
  headerTitle: {
    color: COLORS.text.primary,
    fontSize: FONT.size.xl,
    fontWeight: FONT.weight.bold,
    maxWidth: 180,
  },
  editBtn: {
    color: COLORS.text.accent,
    fontSize: FONT.size.md,
    fontWeight: FONT.weight.semibold,
  },

  membersRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.xl,
    marginBottom: SPACING.lg,
  },
  memberAvatar: {
    marginRight: -4,
  },
  addMemberBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.bg.tertiary,
    borderWidth: 1.5,
    borderColor: COLORS.border.default,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: SPACING.sm,
  },
  memberCount: {
    color: COLORS.text.secondary,
    fontSize: FONT.size.sm,
    marginLeft: SPACING.md,
  },

  summaryWrap: {
    paddingHorizontal: SPACING.xl,
    marginBottom: SPACING.lg,
  },
  summaryCard: {
    borderRadius: RADIUS.xl,
    padding: SPACING.xxl,
    gap: SPACING.sm,
  },
  summaryLabel: {
    color: COLORS.text.accent,
    fontSize: FONT.size.xs,
    fontWeight: FONT.weight.semibold,
    letterSpacing: 1,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  },
  summaryAmount: {
    color: COLORS.text.primary,
    fontSize: 28,
    fontWeight: FONT.weight.extrabold,
  },
  expenseCountBadge: {
    backgroundColor: COLORS.bg.accentSoft,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: RADIUS.full,
  },
  expenseCountText: {
    color: COLORS.text.accent,
    fontSize: FONT.size.xs,
    fontWeight: FONT.weight.semibold,
  },

  tabs: {
    flexDirection: 'row',
    marginHorizontal: SPACING.xl,
    backgroundColor: COLORS.bg.tertiary,
    borderRadius: RADIUS.md,
    padding: 4,
    marginBottom: SPACING.md,
  },
  tab: {
    flex: 1,
    paddingVertical: SPACING.sm + 2,
    alignItems: 'center',
    borderRadius: RADIUS.sm,
  },
  tabActive: {
    backgroundColor: COLORS.bg.secondary,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  tabText: {
    color: COLORS.text.secondary,
    fontSize: FONT.size.sm,
    fontWeight: FONT.weight.semibold,
  },
  tabTextActive: {
    color: COLORS.text.primary,
  },

  listContent: {
    padding: SPACING.xl,
    paddingTop: SPACING.sm,
    gap: SPACING.sm,
    paddingBottom: 80,
  },

  expenseCard: {
    padding: SPACING.md,
  },
  expenseRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  expenseIconWrap: {
    width: 44,
    height: 44,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md,
  },
  expenseEmoji: {
    fontSize: 20,
  },
  expenseInfo: {
    flex: 1,
    marginRight: SPACING.md,
  },
  expenseDesc: {
    color: COLORS.text.primary,
    fontSize: FONT.size.md,
    fontWeight: FONT.weight.medium,
  },
  expenseMeta: {
    color: COLORS.text.secondary,
    fontSize: FONT.size.sm,
    marginTop: 2,
  },
  expenseAmount: {
    color: COLORS.text.primary,
    fontSize: FONT.size.md,
    fontWeight: FONT.weight.bold,
  },

  debtCard: {
    padding: SPACING.md,
  },
  debtRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  },
  debtInfo: {
    flex: 1,
  },
  debtText: {
    color: COLORS.text.secondary,
    fontSize: FONT.size.sm,
  },
  debtName: {
    color: COLORS.text.primary,
    fontWeight: FONT.weight.semibold,
  },
  debtAmount: {
    color: COLORS.text.danger,
    fontSize: FONT.size.md,
    fontWeight: FONT.weight.bold,
    marginTop: 2,
  },

  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
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
  },
});
