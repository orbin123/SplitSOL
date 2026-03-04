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
import { useAppStore } from '@/store/useAppStore';
import { Avatar } from '@/components/ui/Avatar';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { formatCurrency, timeAgo } from '@/utils/formatters';
import { COLORS, SPACING, FONT, RADIUS } from '@/utils/constants';
import { Expense, SimplifiedDebt } from '@/store/types';

type Tab = 'expenses' | 'balances';

export default function GroupDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const group = useAppStore((s) => s.getGroup(id));
  const getBalances = useAppStore((s) => s.getBalances);
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

  const renderExpenseItem = ({ item }: { item: Expense }) => {
    const payer = group.members.find((m) => m.id === item.paidBy);
    return (
      <Card style={styles.expenseCard}>
        <View style={styles.expenseRow}>
          <View style={styles.expenseInfo}>
            <Text style={styles.expenseDesc}>{item.description}</Text>
            <Text style={styles.expenseMeta}>
              {payer?.name ?? 'Unknown'} paid · {timeAgo(item.createdAt)}
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
        <Avatar name={debt.from.name} size={32} />
        <View style={styles.debtInfo}>
          <Text style={styles.debtText}>
            <Text style={styles.debtName}>{debt.from.name}</Text>
            {' owes '}
            <Text style={styles.debtName}>{debt.to.name}</Text>
          </Text>
          <Text style={styles.debtAmount}>{formatCurrency(debt.amount)}</Text>
        </View>
        <Button
          title="Settle"
          variant="secondary"
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
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerEmoji}>{group.emoji}</Text>
        <Text style={styles.headerName}>{group.name}</Text>

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
            <Text style={styles.addMemberText}>+</Text>
          </TouchableOpacity>
        </View>
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

      {/* Floating Action Button — Add Expense */}
      {activeTab === 'expenses' && (
        <TouchableOpacity
          style={styles.fab}
          onPress={() => router.push(`/group/${id}/add-expense`)}
          activeOpacity={0.8}
        >
          <Text style={styles.fabText}>+</Text>
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

  // Header
  header: {
    alignItems: 'center',
    paddingTop: SPACING.lg,
    paddingBottom: SPACING.xxl,
    paddingHorizontal: SPACING.xxl,
  },
  headerEmoji: {
    fontSize: 48,
    marginBottom: SPACING.sm,
  },
  headerName: {
    color: COLORS.text.primary,
    fontSize: FONT.size.xxl,
    fontWeight: FONT.weight.bold,
    marginBottom: SPACING.lg,
  },
  membersRow: {
    flexDirection: 'row',
    alignItems: 'center',
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
  addMemberText: {
    color: COLORS.text.secondary,
    fontSize: 18,
    fontWeight: FONT.weight.bold,
    lineHeight: 20,
  },

  // Tabs
  tabs: {
    flexDirection: 'row',
    marginHorizontal: SPACING.lg,
    backgroundColor: COLORS.bg.secondary,
    borderRadius: RADIUS.md,
    padding: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: SPACING.sm + 2,
    alignItems: 'center',
    borderRadius: RADIUS.sm,
  },
  tabActive: {
    backgroundColor: COLORS.bg.accent,
  },
  tabText: {
    color: COLORS.text.secondary,
    fontSize: FONT.size.sm,
    fontWeight: FONT.weight.semibold,
  },
  tabTextActive: {
    color: COLORS.text.primary,
  },

  // Lists
  listContent: {
    padding: SPACING.lg,
    gap: SPACING.sm,
  },

  // Expense Card
  expenseCard: {
    padding: SPACING.md,
  },
  expenseRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
    color: COLORS.text.accent,
    fontSize: FONT.size.md,
    fontWeight: FONT.weight.bold,
  },

  // Debt Card
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

  // FAB
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
  fabText: {
    color: COLORS.text.primary,
    fontSize: 28,
    fontWeight: FONT.weight.bold,
    lineHeight: 30,
  },
});
