import { Expense, GroupMember, Balance, SimplifiedDebt, Settlement } from '@/types';

/**
 * Calculate net balances for all members in a group.
 * Accounts for both expenses and confirmed settlements.
 * Positive = others owe this person.
 * Negative = this person owes others.
 */
export const calculateBalances = (
  expenses: Expense[],
  members: GroupMember[],
  settlements?: Settlement[],
): Balance[] => {
  const balanceMap: Record<string, number> = {};

  members.forEach((m) => {
    balanceMap[m.id] = 0;
  });

  expenses.forEach((expense) => {
    const splitCount = expense.splitAmong.length;
    if (splitCount === 0) return;

    const sharePerPerson = expense.amount / splitCount;

    if (balanceMap[expense.paidBy] !== undefined) {
      balanceMap[expense.paidBy] += expense.amount;
    }

    expense.splitAmong.forEach((memberId) => {
      if (balanceMap[memberId] !== undefined) {
        balanceMap[memberId] -= sharePerPerson;
      }
    });
  });

  if (settlements) {
    settlements.forEach((s) => {
      if (s.status !== 'confirmed') return;
      if (balanceMap[s.from] !== undefined) {
        balanceMap[s.from] += s.amount;
      }
      if (balanceMap[s.to] !== undefined) {
        balanceMap[s.to] -= s.amount;
      }
    });
  }

  return members.map((m) => ({
    memberId: m.id,
    memberName: m.name,
    amount: Math.round((balanceMap[m.id] || 0) * 100) / 100,
  }));
};

/**
 * Simplify debts to minimize the number of transactions.
 */
export const simplifyDebts = (
  balances: Balance[],
  members: GroupMember[],
): SimplifiedDebt[] => {
  const debts: SimplifiedDebt[] = [];

  const creditors: { member: GroupMember; amount: number }[] = [];
  const debtors: { member: GroupMember; amount: number }[] = [];

  balances.forEach((b) => {
    const member = members.find((m) => m.id === b.memberId);
    if (!member) return;

    if (b.amount > 0.01) {
      creditors.push({ member, amount: b.amount });
    } else if (b.amount < -0.01) {
      debtors.push({ member, amount: Math.abs(b.amount) });
    }
  });

  creditors.sort((a, b) => b.amount - a.amount);
  debtors.sort((a, b) => b.amount - a.amount);

  let i = 0;
  let j = 0;

  while (i < debtors.length && j < creditors.length) {
    const settleAmount = Math.min(debtors[i].amount, creditors[j].amount);

    if (settleAmount > 0.01) {
      debts.push({
        from: debtors[i].member,
        to: creditors[j].member,
        amount: Math.round(settleAmount * 100) / 100,
      });
    }

    debtors[i].amount -= settleAmount;
    creditors[j].amount -= settleAmount;

    if (debtors[i].amount < 0.01) i++;
    if (creditors[j].amount < 0.01) j++;
  }

  return debts;
};

export const getTotalExpenses = (expenses: Expense[]): number => {
  return expenses.reduce((sum, exp) => sum + exp.amount, 0);
};

export const getExpensesByCategory = (
  expenses: Expense[],
): Record<string, number> => {
  return expenses.reduce(
    (acc, exp) => {
      const cat = exp.category || 'other';
      acc[cat] = (acc[cat] || 0) + exp.amount;
      return acc;
    },
    {} as Record<string, number>,
  );
};
