export interface Member {
    id: string;
    name: string;
    walletAddress: string | null;  // Solana public key (base58 string)
    avatarColor: string;           // Generated from name hash
    isCurrentUser: boolean;
  }
  
  export interface Expense {
    id: string;
    description: string;
    amount: number;                // In USDC
    paidBy: string;                // Member ID
    splitAmong: string[];          // Array of Member IDs
    splitType: 'equal' | 'custom'; // Future: support custom splits
    customSplits?: Record<string, number>;  // memberId -> amount (for custom)
    createdAt: string;             // ISO date string
    category?: ExpenseCategory;
  }
  
  export type ExpenseCategory =
    | 'food'
    | 'transport'
    | 'stay'
    | 'shopping'
    | 'entertainment'
    | 'other';
  
  export interface Settlement {
    id: string;
    groupId: string;
    from: string;                  // Member ID (debtor)
    to: string;                    // Member ID (creditor)
    amount: number;                // Amount to settle
    amountUSDC?: number;           // Converted USDC amount
    status: 'pending' | 'processing' | 'confirmed' | 'failed';
    txSignature?: string;          // Solana transaction signature
    memo?: string;                 // On-chain memo text
    settledAt?: string;            // ISO date string
    explorerUrl?: string;
  }
  
  export interface Group {
    id: string;
    name: string;
    emoji: string;                 // Group emoji icon
    members: Member[];
    expenses: Expense[];
    settlements: Settlement[];
    createdAt: string;
    inviteCode?: string;           // For QR-based invites
  }
  
  export interface UserProfile {
    name: string;
    walletAddress: string | null;
    onboardingComplete: boolean;
    createdAt: string;
  }
  
  // === COMPUTED TYPES ===
  
  export interface Balance {
    memberId: string;
    memberName: string;
    amount: number;                // Positive = owed TO them, Negative = they OWE
  }
  
  export interface SimplifiedDebt {
    from: Member;
    to: Member;
    amount: number;
  }
  
  // === STORE INTERFACE ===
  
  export interface AppState {
    // Data
    user: UserProfile;
    groups: Group[];
    walletAddress: string | null;
    walletAuthToken: string | null;
  
    // User Actions
    setUser: (user: Partial<UserProfile>) => void;
    completeOnboarding: (name: string) => void;
  
    // Wallet Actions
    setWallet: (address: string, authToken?: string) => void;
    disconnectWallet: () => void;
  
    // Group Actions
    createGroup: (name: string, emoji: string) => string;  // Returns group ID
    deleteGroup: (groupId: string) => void;
  
    // Member Actions
    addMember: (groupId: string, name: string, walletAddress?: string) => void;
    updateMemberWallet: (groupId: string, memberId: string, wallet: string) => void;
    removeMember: (groupId: string, memberId: string) => void;
  
    // Expense Actions
    addExpense: (groupId: string, expense: Omit<Expense, 'id' | 'createdAt'>) => void;
    removeExpense: (groupId: string, expenseId: string) => void;
  
    // Settlement Actions
    addSettlement: (settlement: Omit<Settlement, 'id'>) => void;
    updateSettlement: (settlementId: string, updates: Partial<Settlement>) => void;
  
    // Computed (these are functions, not stored data)
    getGroup: (groupId: string) => Group | undefined;
    getBalances: (groupId: string) => Balance[];
    getSimplifiedDebts: (groupId: string) => SimplifiedDebt[];
  }