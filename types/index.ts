export interface UserProfile {
  name: string;
  walletAddress: string | null;
  walletAuthToken: string | null;
  notificationsEnabled: boolean;
  createdAt: string;
}

export interface Member {
  id: string;
  name: string;
  walletAddress: string;
  isFavorite: boolean;
  addedAt: string;
  lastTransactionAt: string | null;
}

export interface GroupMember {
  id: string;
  name: string;
  walletAddress: string | null;
  memberId: string | null;
  isCurrentUser: boolean;
}

export type ExpenseCategory =
  | 'food'
  | 'transport'
  | 'stay'
  | 'shopping'
  | 'entertainment'
  | 'other';

export interface Expense {
  id: string;
  description: string;
  amount: number;
  paidBy: string;
  splitAmong: string[];
  splitType: 'equal';
  createdAt: string;
  category?: ExpenseCategory;
}

export interface Settlement {
  id: string;
  groupId: string;
  from: string;
  to: string;
  amount: number;
  amountUSDC?: number;
  status: 'pending' | 'processing' | 'confirmed' | 'failed';
  txSignature?: string;
  paymentMethod?: string;
  confirmedAt?: string;
  memo?: string;
  settledAt: string;
  explorerUrl?: string;
  fromWallet?: string;
  toWallet?: string;
}

export interface Group {
  id: string;
  name: string;
  emoji: string;
  members: GroupMember[];
  expenses: Expense[];
  settlements: Settlement[];
  createdAt: string;
  inviteCode?: string;
}

export interface TransactionSwap {
  inputToken: string;
  inputAmount: number;
  outputUSDC: number;
  route: string;
  slippage: number;
  fee: number;
}

export interface TransactionChain {
  networkFee: number;
  confirmationStatus: string;
  blockTime: number | null;
}

export interface Transaction {
  id: string;
  groupId: string;
  payerWallet: string;
  receiverWallet: string;
  amountUSDC: number;
  status: 'pending' | 'confirmed' | 'failed';
  signature: string | null;
  timestamp: string;
  memo?: string;
  swap: TransactionSwap | null;
  chain: TransactionChain | null;
}

export interface Notification {
  id: string;
  type: 'invite' | 'settlement' | 'reminder';
  relatedGroupId: string | null;
  relatedPaymentId: string | null;
  message: string;
  timestamp: string;
  read: boolean;
}

export interface Balance {
  memberId: string;
  memberName: string;
  amount: number;
}

export interface SimplifiedDebt {
  from: GroupMember;
  to: GroupMember;
  amount: number;
}

export interface AppState {
  user: UserProfile;
  members: Member[];
  groups: Group[];
  transactions: Transaction[];
  notifications: Notification[];
  setUser: (
    name: string,
    walletAddress: string | null,
    authToken: string | null,
  ) => void;
  setNotificationsEnabled: (enabled: boolean) => void;
  addMember: (
    member: Omit<Member, 'id' | 'addedAt' | 'lastTransactionAt'> &
      Partial<Pick<Member, 'id' | 'addedAt' | 'lastTransactionAt'>>,
  ) => string;
  removeMemberFromList: (id: string) => void;
  toggleFavorite: (id: string) => void;
  updateMemberLastTransaction: (id: string) => void;
  addTransaction: (
    tx: Omit<Transaction, 'id' | 'timestamp'> &
      Partial<Pick<Transaction, 'id' | 'timestamp'>>,
  ) => string;

  addNotification: (
    notif: Omit<Notification, 'id' | 'timestamp' | 'read'> &
      Partial<Pick<Notification, 'id' | 'timestamp' | 'read'>>,
  ) => string;
  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: () => void;
  createGroup: (name: string, emoji: string, memberIds?: string[]) => string;
  deleteGroup: (groupId: string) => void;
  addGroupMember: (
    groupId: string,
    name: string,
    walletAddress?: string,
    memberId?: string | null,
  ) => void;
  updateMemberWallet: (groupId: string, memberId: string, wallet: string) => void;
  removeMember: (groupId: string, memberId: string) => void;
  addExpense: (groupId: string, expense: Omit<Expense, 'id' | 'createdAt'>) => void;
  removeExpense: (groupId: string, expenseId: string) => void;
  addSettlement: (settlement: Omit<Settlement, 'id'>) => void;
  updateSettlement: (settlementId: string, updates: Partial<Settlement>) => void;
  confirmSettlement: (
    groupId: string,
    settlementId: string,
    txSignature: string,
    paymentMethod?: string,
  ) => void;
  getGroup: (groupId: string) => Group | undefined;
  getBalances: (groupId: string) => Balance[];
  getSimplifiedDebts: (groupId: string) => SimplifiedDebt[];
}
