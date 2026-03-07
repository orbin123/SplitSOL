import { Group, Transaction, UserProfile } from '@/types';
import { formatCurrency, truncateAddress } from './formatters';

export interface ResolvedTransactionDetails {
  transaction: Transaction;
  groupName: string;
  groupEmoji: string;
  payerName: string;
  receiverName: string;
  counterpartyName: string;
  title: string;
  swapSummary: string | null;
}

const getMemberNameForWallet = (
  group: Group | undefined,
  walletAddress: string,
  user: UserProfile,
): string => {
  if (user.walletAddress === walletAddress) {
    return user.name || 'You';
  }

  const groupMember = group?.members.find(
    (member) => member.walletAddress === walletAddress,
  );
  if (groupMember) return groupMember.name;

  return truncateAddress(walletAddress, 5);
};

export const resolveTransactionDetails = (
  transaction: Transaction,
  groups: Group[],
  user: UserProfile,
): ResolvedTransactionDetails => {
  const group = groups.find((item) => item.id === transaction.groupId);
  const payerName = getMemberNameForWallet(group, transaction.payerWallet, user);
  const receiverName = getMemberNameForWallet(
    group,
    transaction.receiverWallet,
    user,
  );
  const isPaidByCurrentUser =
    Boolean(user.walletAddress) && transaction.payerWallet === user.walletAddress;
  const isReceivedByCurrentUser =
    Boolean(user.walletAddress) &&
    transaction.receiverWallet === user.walletAddress;

  let title = `${payerName} paid ${formatCurrency(transaction.amountUSDC)} to ${receiverName}`;
  let counterpartyName = receiverName;

  if (isPaidByCurrentUser) {
    title = `Paid ${formatCurrency(transaction.amountUSDC)} to ${receiverName}`;
    counterpartyName = receiverName;
  } else if (isReceivedByCurrentUser) {
    title = `Received ${formatCurrency(transaction.amountUSDC)} from ${payerName}`;
    counterpartyName = payerName;
  }

  const swapSummary = transaction.swap
    ? `using ${transaction.swap.inputAmount.toFixed(2)} ${transaction.swap.inputToken}`
    : null;

  return {
    transaction,
    groupName: group?.name ?? 'Unknown group',
    groupEmoji: group?.emoji ?? '🧾',
    payerName,
    receiverName,
    counterpartyName,
    title,
    swapSummary,
  };
};
