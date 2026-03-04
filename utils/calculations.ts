import { Expense, Member, Balance, SimplifiedDebt } from '@/store/types';

/**
 * Calculate net balances for all members in a group.
 * Positive = others owe this person.
 * Negative = this person owes others.
 */
export const calculateBalances = (
  expenses: Expense[],
  members: Member[],
): Balance[] => {
  const balanceMap: Record<string, number> = {};

  // Initialize all members to 0
  members.forEach((m) => {
    balanceMap[m.id] = 0;
  });

  // Process each expense
  expenses.forEach((expense) => {
    const splitCount = expense.splitAmong.length;
    if (splitCount === 0) return;

    const sharePerPerson = expense.amount / splitCount;

    // Payer gets credit for the full amount
    if (balanceMap[expense.paidBy] !== undefined) {
      balanceMap[expense.paidBy] += expense.amount;
    }

    // Each person in the split owes their share
    expense.splitAmong.forEach((memberId) => {
      if (balanceMap[memberId] !== undefined) {
        balanceMap[memberId] -= sharePerPerson;
      }
    });
  });

  // Convert to array with member names
  return members.map((m) => ({
    memberId: m.id,
    memberName: m.name,
    amount: Math.round((balanceMap[m.id] || 0) * 100) / 100,
  }));
};

/**
 * Simplify debts to minimize the number of transactions.
 * Uses a greedy algorithm to match largest debtor with largest creditor.
 */
export const simplifyDebts = (
  balances: Balance[],
  members: Member[],
): SimplifiedDebt[] => {
  const debts: SimplifiedDebt[] = [];

  // Separate into creditors and debtors
  const creditors: { member: Member; amount: number }[] = [];
  const debtors: { member: Member; amount: number }[] = [];

  balances.forEach((b) => {
    const member = members.find((m) => m.id === b.memberId);
    if (!member) return;

    if (b.amount > 0.01) {
      creditors.push({ member, amount: b.amount });
    } else if (b.amount < -0.01) {
      debtors.push({ member, amount: Math.abs(b.amount) });
    }
  });

  // Sort descending by amount
  creditors.sort((a, b) => b.amount - a.amount);
  debtors.sort((a, b) => b.amount - a.amount);

  // Greedy matching
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

/**
 * Get total expenses for a group
 */
export const getTotalExpenses = (expenses: Expense[]): number => {
  return expenses.reduce((sum, exp) => sum + exp.amount, 0);
};

/**
 * Get expense count by category
 */
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