export interface UserProfile {
  name: string;
  walletAddress: string | null;
  walletAuthToken: string | null;
  notificationsEnabled: boolean;
  createdAt: string;
}

export interface Contact {
  id: string;
  name: string;
  walletAddress: string;
  isFavorite: boolean;
  addedAt: string;
  lastTransactionAt: string | null;
}

export interface Member {
  id: string;
  name: string;
  walletAddress: string | null;
  contactId: string | null;
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
  splitType: 'equal' | 'custom';
  customSplits?: Record<string, number>;
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
  memo?: string;
  settledAt?: string;
  explorerUrl?: string;
}

export interface Group {
  id: string;
  name: string;
  emoji: string;
  members: Member[];
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
  from: Member;
  to: Member;
  amount: number;
}

export interface AppState {
  user: UserProfile;
  contacts: Contact[];
  groups: Group[];
  transactions: Transaction[];
  notifications: Notification[];
  setUser: (
    name: string,
    walletAddress: string | null,
    authToken: string | null,
  ) => void;
  setNotificationsEnabled: (enabled: boolean) => void;
  addContact: (
    contact: Omit<Contact, 'id' | 'addedAt' | 'lastTransactionAt'> &
      Partial<Pick<Contact, 'id' | 'addedAt' | 'lastTransactionAt'>>,
  ) => string;
  removeContact: (id: string) => void;
  toggleFavorite: (id: string) => void;
  updateContactLastTransaction: (id: string) => void;
  addTransaction: (
    tx: Omit<Transaction, 'id' | 'timestamp'> &
      Partial<Pick<Transaction, 'id' | 'timestamp'>>,
  ) => string;
  updateTransactionStatus: (
    id: string,
    status: Transaction['status'],
    chainData: TransactionChain | null,
  ) => void;
  addNotification: (
    notif: Omit<Notification, 'id' | 'timestamp' | 'read'> &
      Partial<Pick<Notification, 'id' | 'timestamp' | 'read'>>,
  ) => string;
  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: () => void;
  createGroup: (name: string, emoji: string, contactIds?: string[]) => string;
  deleteGroup: (groupId: string) => void;
  addMember: (
    groupId: string,
    name: string,
    walletAddress?: string,
    contactId?: string | null,
  ) => void;
  updateMemberWallet: (groupId: string, memberId: string, wallet: string) => void;
  removeMember: (groupId: string, memberId: string) => void;
  addExpense: (groupId: string, expense: Omit<Expense, 'id' | 'createdAt'>) => void;
  removeExpense: (groupId: string, expenseId: string) => void;
  addSettlement: (settlement: Omit<Settlement, 'id'>) => void;
  updateSettlement: (settlementId: string, updates: Partial<Settlement>) => void;
  getGroup: (groupId: string) => Group | undefined;
  getBalances: (groupId: string) => Balance[];
  getSimplifiedDebts: (groupId: string) => SimplifiedDebt[];
}
