# Agent.md — SplitSOL

> This file is the single source of truth for any AI agent working on SplitSOL.
> Read it completely before writing any code. Every decision you need to make is covered here.

---

## Project Identity

**What:** SplitSOL is a mobile-first group expense splitting app built on Solana. Think Splitwise + Venmo, but with instant on-chain USDC/SOL settlements and permanent memo-based receipts.

**Who:** Crypto-native users who frequently split dinners, trips, NFT mints, group investments, and shared subscriptions.

**Where:** Android phones via React Native (Expo). Solana Mobile Hackathon submission.

**Core user flow:** Create group → Add members → Log expenses → View calculated balances → Tap "Settle" → Approve in Phantom wallet → Transaction confirmed on Solana → Memo visible on Explorer.

---

## Tech Stack (Do Not Deviate)

| Layer | Technology | Version/Notes |
|---|---|---|
| Framework | React Native via Expo | SDK 51+ |
| Language | TypeScript | Strict mode |
| Navigation | Expo Router | File-based routing |
| State | Zustand | With `persist` middleware |
| Persistence | AsyncStorage | Via `@react-native-async-storage/async-storage` |
| Blockchain SDK | `@solana/web3.js` | v1.x (not v2) |
| Token operations | `@solana/spl-token` | For USDC transfers + ATA management |
| Wallet connection | `@solana-mobile/mobile-wallet-adapter-protocol-web3js` | MWA protocol |
| QR codes | `react-native-qrcode-svg` + `expo-camera` | Generate + scan |
| Haptics | `expo-haptics` | Every meaningful interaction |
| Notifications | `expo-notifications` | Local only (no server) |
| Styling | `StyleSheet.create()` | No NativeWind, no styled-components |
| Build | EAS Build | APK via `eas build --profile preview` |

**Do NOT introduce:** Redux, React Navigation (we use Expo Router), NativeWind/Tailwind, Styled Components, SQLite, Firebase, any backend/server, any custom Solana programs/smart contracts.

---

## Project Structure

```
SplitSOL/
├── app/                              # SCREENS — file-based routing via Expo Router
│   ├── _layout.tsx                   # Root Stack navigator + global providers
│   ├── index.tsx                     # Entry router — redirects to onboarding or tabs
│   ├── (onboarding)/
│   │   ├── _layout.tsx               # Onboarding stack (headerless)
│   │   └── welcome.tsx               # Name entry + "Get Started" → completeOnboarding()
│   ├── (tabs)/
│   │   ├── _layout.tsx               # Bottom tab navigator (Groups, Activity, Profile)
│   │   ├── groups.tsx                # Groups list + FAB to create
│   │   ├── activity.tsx              # Chronological settlement feed across all groups
│   │   └── profile.tsx               # User info, wallet connection, QR, settings
│   ├── group/
│   │   ├── create.tsx                # Create group form (name + emoji picker)
│   │   └── [id]/
│   │       ├── index.tsx             # Group detail — expenses tab + balances tab
│   │       ├── add-expense.tsx       # Expense form (description, amount, paidBy, splitAmong)
│   │       ├── add-member.tsx        # Add member (name + optional wallet via QR scan)
│   │       └── settle/
│   │           └── [settlementId].tsx # Settlement confirmation → MWA → tx submit
│   ├── group/invite/
│   │   └── [id].tsx                  # QR-based group invite screen
│   └── tx/
│       └── [signature].tsx           # Transaction success — signature, Explorer link
│
├── components/                       # REUSABLE UI — never contain business logic
│   ├── ui/                           # Generic design system components
│   │   ├── Button.tsx                # Primary, secondary, danger, ghost variants
│   │   ├── Card.tsx                  # White card with border + semantic pastel cards
│   │   ├── Input.tsx                 # Styled TextInput with label
│   │   ├── Badge.tsx                 # Status badges (settled, pending, failed)
│   │   ├── Avatar.tsx                # Initials-based circle avatar with deterministic color
│   │   ├── EmptyState.tsx            # Emoji + title + subtitle + optional CTA
│   │   └── LoadingOverlay.tsx        # Full-screen translucent overlay with spinner + message
│   ├── groups/
│   │   ├── GroupCard.tsx             # Group preview in list (emoji, name, members, balance)
│   │   └── MemberChip.tsx            # Small member tag with avatar
│   ├── expenses/
│   │   ├── ExpenseCard.tsx           # Single expense row (category icon, desc, amount, payer)
│   │   ├── BalanceSummary.tsx        # Net balance display per member
│   │   └── SettlementCard.tsx        # "X owes Y" card with Settle button
│   ├── wallet/
│   │   ├── ConnectButton.tsx         # Connect/disconnect wallet via MWA
│   │   ├── WalletBadge.tsx           # Truncated address + green dot + QR display
│   │   └── QRScanner.tsx             # Camera-based QR scanner for wallet addresses
│   └── layout/
│       └── ScreenWrapper.tsx         # SafeAreaView + padding + background color wrapper
│
├── store/                            # GLOBAL STATE — Zustand
│   ├── useAppStore.ts                # Single store with all state + actions + computed
│   └── types.ts                      # All TypeScript interfaces (Member, Expense, Group, etc.)
│
├── utils/                            # PURE FUNCTIONS — no React, no hooks, no state
│   ├── constants.ts                  # Colors, spacing, fonts, Solana addresses, app config
│   ├── calculations.ts              # calculateBalances(), simplifyDebts(), getTotalExpenses()
│   ├── formatters.ts                # truncateAddress(), formatCurrency(), timeAgo(), getInitials()
│   ├── solana.ts                    # getConnection(), buildSOLTransfer(), buildUSDCTransfer(), addMemo()
│   ├── mwa.ts                       # connectWallet(), signAndSendTransaction(), executeSettlement()
│   └── notifications.ts            # notifyExpenseAdded(), notifySettlementReceived(), permissions
│
├── hooks/                            # CUSTOM HOOKS — React logic bridges
│   ├── useWallet.ts                  # Wraps wallet state + connect/disconnect actions
│   └── useBalances.ts               # Wraps balance calculations for a given group
│
├── assets/
│   ├── icon.png                      # 1024x1024 app icon
│   ├── splash.png                    # Splash screen image
│   ├── adaptive-icon.png            # Android adaptive icon foreground
│   └── images/                       # Any in-app images
│
├── app.json                          # Expo configuration
├── eas.json                          # EAS Build profiles (development, preview, production)
├── tsconfig.json                     # TypeScript strict config with @/* path alias
├── babel.config.js                   # Babel with expo-router/babel plugin
├── package.json
├── .gitignore
├── README.md
└── Agent.md                          # This file
```

### File Placement Rules

- **Screens go in `app/`** — one file per route, named to match the URL.
- **Reusable UI goes in `components/`** — must accept props, must not import from `store/` directly (exception: `ConnectButton` which needs wallet state).
- **Business logic goes in `utils/`** — pure functions only. No React imports. No hooks. Testable in isolation.
- **State goes in `store/`** — single Zustand store. All mutations happen through store actions.
- **Hooks go in `hooks/`** — thin wrappers that combine store state with React lifecycle.

---

## Design System

### Visual Identity

Light-mode fintech aesthetic. Soft pastel semantic cards on a light gray base. Bold monospace numbers. Purple accent for primary actions.

The design is inspired by modern crypto wallet UIs: lavender gradient cards for balance overviews, mint green for settlements/confirmations, peach for debts you owe.

### Color Tokens

Always import from `utils/constants.ts`. Never hardcode hex values in components.

```typescript
COLORS = {
  bg: {
    primary: '#F5F5F7',        // Light gray — screen background
    secondary: '#FFFFFF',       // White — card backgrounds
    dark: '#1A1A2E',           // Deep navy — dark elements, quick action icons
  },
  card: {
    lavender: '#EDE5FB',        // Balance cards, "you pay" sections, group totals
    lavenderDark: '#D8C8F5',    // Gradient end for lavender cards
    mint: '#D4F5E0',            // Settlement confirmed, "receives" sections
    mintDark: '#A8E6C3',        // Gradient end for mint cards
    peach: '#FDE8D8',           // You owe cards, pending debts
    peachDark: '#F9C9A8',       // Gradient end for peach cards
    rose: '#FCE4EC',            // Warnings, deletion confirmations
    blue: '#E3F2FD',            // Informational, owed-to-you cards
  },
  accent: {
    purple: '#7C3AED',          // Primary CTA buttons, active tabs, links
    purpleLight: '#A78BFA',     // Hover/active states
    green: '#10B981',           // Settled status, positive balances, checkmarks
    red: '#EF4444',             // You owe, errors, negative balances
    amber: '#F59E0B',           // Pending status, warnings
  },
  text: {
    primary: '#1A1A2E',         // Headings, amounts, important text
    secondary: '#6B7280',       // Body text, labels
    tertiary: '#9CA3AF',        // Placeholders, muted info, timestamps
    white: '#FFFFFF',           // Text on dark/colored backgrounds
  },
  border: '#E5E7EB',            // Card borders, input borders, dividers
}
```

### Semantic Card Usage Rules

| Card Color | Use For | Example |
|---|---|---|
| Lavender gradient | Balance summaries, "you pay" in settlement, group totals | Overall balance card on home screen |
| Mint gradient | Settlements confirmed, "receives" section, positive outcomes | Tx success amount card |
| Peach | Debts you owe, pending settlements | "You owe ₹500 to Bob" card |
| Blue | Money owed to you | "Bob owes you ₹750" card |
| White | Neutral content — expense rows, settings items, forms | Expense list items |
| Rose | Destructive confirmations | Delete group dialog |

### Typography

```typescript
// Primary font: DM Sans (loaded via expo-google-fonts or system fallback)
// Monospace for amounts: JetBrains Mono (or system monospace fallback)

FONT = {
  size: { xs: 11, sm: 13, md: 15, lg: 17, xl: 20, xxl: 24, hero: 32 },
  weight: { normal: '400', medium: '500', semibold: '600', bold: '700', extrabold: '800' },
}
```

**Rules:**
- All monetary amounts use monospace font, `fontWeight: '700'` or `'800'`.
- Section labels are uppercase, `fontSize: 11`, `letterSpacing: 0.5-1`, `color: text.secondary`.
- Screen titles are `fontSize: 22-26`, `fontWeight: '800'`, `color: text.primary`.
- Never use Inter, Roboto, or Arial.

### Spacing & Radius

```typescript
SPACING = { xs: 4, sm: 8, md: 12, lg: 16, xl: 20, xxl: 24, xxxl: 32 }
RADIUS  = { sm: 8, md: 12, lg: 16, xl: 20, xxl: 24, full: 9999 }
```

**Rules:**
- Cards: `borderRadius: 18-24`, `padding: 16-24`.
- Buttons: `borderRadius: 14-18`, `padding: 14-18 vertical`.
- Inputs: `borderRadius: 14`, `padding: 14-16`, `border: 1.5px solid border color`.
- Avatars: fully round (`borderRadius: size/2`).
- Small tags/badges: `borderRadius: 8-12`.

### Component Patterns

**Every button triggers haptics:**
```typescript
import * as Haptics from 'expo-haptics';
// Light — navigation, toggles
// Medium — create, add, submit
// Success notification — settlement confirmed
// Error notification — transaction failed
```

**Every async operation shows loading state.** Never leave the user staring at a frozen screen. Use `LoadingOverlay` for settlements, `ActivityIndicator` inline for data fetching.

**Every list has an empty state.** Use `EmptyState` component with contextual emoji, title, subtitle, and CTA button.

**Amounts are always right-aligned** in list rows. Use `fontFamily: monospace` for amounts.

**Balance colors are semantic:** green = positive (owed to you), red = negative (you owe), gray = settled (zero).

---

## State Management

### Store Architecture

Single Zustand store in `store/useAppStore.ts`. No multiple stores. No React Context for data.

```
useAppStore
├── user: UserProfile              # name, walletAddress, onboardingComplete
├── groups: Group[]                # All groups with nested members, expenses, settlements
├── walletAddress: string | null   # Connected wallet (also in user, but top-level for convenience)
├── walletAuthToken: string | null # MWA auth token for reauthorization
│
├── [User Actions]
│   ├── setUser(updates)
│   └── completeOnboarding(name)
│
├── [Wallet Actions]
│   ├── setWallet(address, authToken?)
│   └── disconnectWallet()
│
├── [Group Actions]
│   ├── createGroup(name, emoji) → returns groupId
│   └── deleteGroup(groupId)
│
├── [Member Actions]
│   ├── addMember(groupId, name, walletAddress?)
│   ├── updateMemberWallet(groupId, memberId, wallet)
│   └── removeMember(groupId, memberId)
│
├── [Expense Actions]
│   ├── addExpense(groupId, expenseData)
│   └── removeExpense(groupId, expenseId)
│
├── [Settlement Actions]
│   ├── addSettlement(settlementData)
│   └── updateSettlement(settlementId, updates)
│
└── [Computed — functions, not stored]
    ├── getGroup(groupId) → Group | undefined
    ├── getBalances(groupId) → Balance[]
    └── getSimplifiedDebts(groupId) → SimplifiedDebt[]
```

### State Rules

1. **All mutations go through store actions.** Never mutate state directly. Never use `setState` outside the store.
2. **Immutable updates only.** Always spread objects/arrays. Never `.push()`, never `obj.key = value`.
3. **Persistence is automatic.** The store uses `persist` middleware with `AsyncStorage`. The `partialize` option ensures only data (not functions) is persisted.
4. **Computed values are functions, not stored data.** `getBalances()` and `getSimplifiedDebts()` recalculate from current state every time.
5. **IDs are generated via `generateId()`** from formatters — `Date.now().toString(36) + Math.random().toString(36).slice(2, 9)`. No UUID library.

### How Components Read State

```typescript
// CORRECT — subscribe to specific slices
const groups = useAppStore((s) => s.groups);
const addGroup = useAppStore((s) => s.addGroup);

// WRONG — subscribes to entire store, re-renders on every change
const store = useAppStore();
```

---

## Solana Integration

### Network Configuration

```typescript
CLUSTER: 'devnet'                    // Switch to 'mainnet-beta' for production demo
DEVNET_RPC: 'https://api.devnet.solana.com'
MAINNET_RPC: 'https://api.mainnet-beta.solana.com'
```

### Key Addresses

```typescript
USDC_MINT_MAINNET: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v'
MEMO_PROGRAM_ID:   'MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr'
USDC_DECIMALS:     6    // 1 USDC = 1_000_000 smallest units
```

### Connection Management

Singleton pattern. Never create multiple `Connection` objects:

```typescript
let _connection: Connection | null = null;
export const getConnection = (): Connection => {
  if (!_connection) {
    _connection = new Connection(RPC_URL, 'confirmed');
  }
  return _connection;
};
```

### Transaction Building Pattern

Every settlement transaction follows this exact structure:

```
Transaction
├── Instruction 1 (optional): createAssociatedTokenAccountInstruction
│   └── Only if recipient doesn't have a USDC ATA yet
├── Instruction 2: createTransferInstruction (SPL token transfer)
│   └── From sender ATA → recipient ATA, amount in smallest units
└── Instruction 3: Memo instruction
    └── "SplitSOL | {groupName} | {amount} | {fromName} → {toName}"
```

For Devnet testing where USDC isn't available, use SOL transfers instead (SystemProgram.transfer). The transaction structure is identical — just swap the transfer instruction.

### MWA Flow

Every MWA interaction uses `transact()` from the mobile wallet adapter:

```
1. Call transact(async (wallet) => { ... })
2. Inside: wallet.authorize() — opens Phantom, user approves
3. Set transaction.feePayer and transaction.recentBlockhash
4. Call wallet.signAndSendTransactions({ transactions: [tx] })
5. Returns signature string
6. Confirm via connection.confirmTransaction(signature)
```

**Critical:** Always fetch a fresh `recentBlockhash` right before signing. Stale blockhashes cause transaction failures.

### Polyfill Requirement

Solana web3.js requires Buffer in React Native. This MUST be at the very top of `app/_layout.tsx`, before all other imports:

```typescript
import { Buffer } from 'buffer';
global.Buffer = global.Buffer || Buffer;
```

### Error Handling for Blockchain Operations

Always wrap MWA/Solana calls in try-catch. Map error messages to user-friendly alerts:

| Error contains | User message |
|---|---|
| `User rejected` | "You cancelled the transaction in your wallet." |
| `insufficient` | "Not enough SOL to cover this transaction and fees." |
| `timeout` | "Network is busy. Please try again." |
| `blockhash` | "Transaction expired. Please try again." |
| Anything else | "Something went wrong. Please try again." |

---

## Navigation

### Route Map

```
/                           → index.tsx (redirect based on onboarding state)
/(onboarding)/welcome       → Onboarding name entry
/(tabs)/groups              → Groups list (home tab)
/(tabs)/activity            → Settlement activity feed
/(tabs)/profile             → Profile + wallet + settings
/group/create               → Create new group (modal presentation)
/group/[id]                 → Group detail (expenses + balances)
/group/[id]/add-expense     → Add expense form
/group/[id]/add-member      → Add member form
/group/[id]/settle/[sid]    → Settlement confirmation → on-chain tx
/group/invite/[id]          → QR-based group invite
/tx/[signature]             → Transaction success screen
```

### Navigation Rules

- Use `router.push()` for forward navigation.
- Use `router.replace()` after settlement success — prevents going back to the settle screen.
- Use `router.back()` for back navigation within flows.
- Group create screen uses `presentation: 'modal'` in Stack.Screen options.
- Transaction success screen hides the back button (`headerBackVisible: false`).

---

## Data Types

All defined in `store/types.ts`. Never create ad-hoc types elsewhere.

```typescript
interface Member {
  id: string;
  name: string;
  walletAddress: string | null;
  avatarColor: string;           // Deterministic from name hash
  isCurrentUser: boolean;
}

interface Expense {
  id: string;
  description: string;
  amount: number;                // Local currency (INR)
  paidBy: string;                // Member ID
  splitAmong: string[];          // Member IDs
  splitType: 'equal' | 'custom';
  customSplits?: Record<string, number>;
  createdAt: string;             // ISO 8601
  category?: 'food' | 'transport' | 'stay' | 'shopping' | 'entertainment' | 'other';
}

interface Settlement {
  id: string;
  groupId: string;
  from: string;                  // Member ID (debtor)
  to: string;                    // Member ID (creditor)
  amount: number;
  amountUSDC?: number;
  status: 'pending' | 'processing' | 'confirmed' | 'failed';
  txSignature?: string;
  memo?: string;
  settledAt?: string;
  explorerUrl?: string;
}

interface Group {
  id: string;
  name: string;
  emoji: string;
  members: Member[];
  expenses: Expense[];
  settlements: Settlement[];
  createdAt: string;
  inviteCode?: string;
}

interface UserProfile {
  name: string;
  walletAddress: string | null;
  onboardingComplete: boolean;
  createdAt: string;
}
```

---

## Algorithms

### Balance Calculation

```
For each expense in the group:
  1. The payer gets CREDIT for the full amount: balances[paidBy] += amount
  2. Each person in splitAmong gets DEBITED their share: balances[memberId] -= (amount / splitAmong.length)

Result: positive balance = others owe you. Negative = you owe others.
```

### Debt Simplification

```
1. Separate members into creditors (positive balance) and debtors (negative balance)
2. Sort both lists descending by absolute amount
3. Greedy match: pair largest debtor with largest creditor
4. Settlement amount = min(debtor's debt, creditor's credit)
5. Subtract settlement from both, advance pointer when someone hits zero
6. Repeat until all debts cleared
```

This minimizes the number of on-chain transactions needed.

---

## Coding Conventions

### TypeScript

- Strict mode. No `any` types unless absolutely unavoidable (then add `// eslint-disable-next-line` comment).
- Use `interface` for object shapes, `type` for unions/aliases.
- All function parameters and return types must be typed.
- Use optional chaining (`?.`) and nullish coalescing (`??`) generously.

### React Native

- Functional components only. No class components.
- Use `StyleSheet.create()` at the bottom of every component file. Never inline style objects directly (except when composing dynamic styles).
- FlatList for all scrollable lists (never `.map()` inside ScrollView for lists > 5 items).
- `keyExtractor` must return a string on every FlatList.
- Always handle keyboard dismissal: wrap forms in `KeyboardAvoidingView` or use `Keyboard.dismiss()`.

### Naming

| Thing | Convention | Example |
|---|---|---|
| Files (components) | PascalCase.tsx | `ExpenseCard.tsx` |
| Files (utils) | camelCase.ts | `calculations.ts` |
| Files (screens) | kebab-case.tsx | `add-expense.tsx` |
| Components | PascalCase | `const ExpenseCard = () => {}` |
| Functions | camelCase | `calculateBalances()` |
| Constants | SCREAMING_SNAKE | `USDC_DECIMALS` |
| Interfaces | PascalCase | `interface Settlement {}` |
| Store hooks | useXxxStore | `useAppStore` |
| Custom hooks | useXxx | `useWallet` |
| Event handlers | handleXxx | `handleSettle` |
| Boolean props | isXxx / hasXxx | `isLoading`, `hasWallet` |

### Imports

Order imports in every file:

```typescript
// 1. React / React Native
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';

// 2. Expo libraries
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';

// 3. Third-party libraries
import { Connection, PublicKey } from '@solana/web3.js';

// 4. Internal — store
import { useAppStore } from '@/store/useAppStore';

// 5. Internal — components
import { Button } from '@/components/ui/Button';

// 6. Internal — utils/hooks
import { COLORS, SPACING } from '@/utils/constants';
import { formatCurrency } from '@/utils/formatters';

// 7. Internal — types
import type { Group, Expense } from '@/store/types';
```

### Git Commits

Commit every 30–60 minutes with descriptive messages:

```
Prefixes: init:, feat:, fix:, style:, refactor:, docs:, build:, test:, milestone:

Examples:
  init: expo project with TypeScript and dependencies
  feat: add group creation screen with emoji picker
  feat: implement balance calculation algorithm
  feat: integrate MWA wallet connection
  fix: handle missing ATA in USDC transfer
  style: polish settlement screen with lavender/mint cards
  milestone: Day 2 complete — on-chain settlements working
```

---

## Feature Implementation Patterns

### Adding a New Screen

1. Create the file in the correct `app/` subdirectory.
2. Import `useLocalSearchParams` if it's a dynamic route (`[id]`).
3. Read state from store using `useAppStore((s) => s.xxx)`.
4. Use `ScreenWrapper` for consistent padding/background.
5. Add the route to the Stack in `_layout.tsx` if it needs custom header options.

### Adding a New Component

1. Create in the appropriate `components/` subdirectory.
2. Define a typed props interface.
3. Accept all data via props — don't reach into the store.
4. Use design tokens from `constants.ts` — never hardcode colors or spacing.
5. Put `StyleSheet.create()` at the bottom of the file.

### Adding a New Store Action

1. Add the TypeScript signature to the `AppState` interface in `types.ts`.
2. Implement the action in `useAppStore.ts` using `set()` for mutations or `get()` for reads.
3. Always use immutable updates (spread operators).
4. If the action has side effects (notifications, haptics), trigger them inside the action.

### Adding a Solana Feature

1. Build the transaction builder as a pure function in `utils/solana.ts`.
2. Wrap the MWA signing flow in `utils/mwa.ts`.
3. Call from the screen component inside a try-catch.
4. Show `LoadingOverlay` during processing.
5. On success: update store + haptic + navigate to success.
6. On failure: Alert with mapped error message.

---

## Critical Do/Don't Rules

### DO

- Always check if wallet is connected before showing settle UI.
- Always check if recipient member has a wallet address before settlement.
- Always fetch fresh blockhash immediately before signing.
- Always use `router.replace()` (not `push`) after successful settlement.
- Always show the Solana Explorer link after confirmed transactions.
- Always round currency amounts to 2 decimal places for display.
- Always run haptic feedback on: button press (light), expense added (medium), settlement confirmed (success), error (error).
- Always format memo strings as: `"SplitSOL | {groupName} | {amount} | {from} → {to}"`.
- Always handle the edge case where a member is both payer and part of the split.
- Always use `FlatList` with `keyExtractor` for any list that could exceed 5 items.

### DON'T

- Don't store private keys anywhere. Ever. MWA handles all signing.
- Don't use Expo Go for testing MWA features — it requires a development build.
- Don't create multiple Solana `Connection` instances — use the singleton.
- Don't use `@solana/web3.js` v2 — the MWA adapter is built for v1.x.
- Don't hardcode colors, spacing, or font sizes — always use constants.
- Don't put business logic in components — keep it in utils or store actions.
- Don't use `console.log` in production code — remove before building APK.
- Don't allow expenses with amount 0 or negative amounts.
- Don't allow groups with 0 members or expenses split among 0 people.
- Don't navigate back to the settlement screen after a successful transaction.
- Don't show raw Solana errors to users — always map to friendly messages.
- Don't use `localStorage`, `sessionStorage`, or any web-only API.
- Don't install new dependencies without confirming Expo compatibility first.
- Don't write Solana programs/smart contracts — we use existing on-chain programs only.

---

## Testing on Device

### Development Setup

1. Physical Android device with Phantom wallet installed.
2. Phantom switched to Devnet (Settings → Developer Settings).
3. Devnet SOL airdropped via faucet.solana.com.
4. Development build (not Expo Go) installed via `eas build --profile development`.

### Pre-Submit Verification Checklist

```
[ ] Fresh install: clear data or reinstall → onboarding appears
[ ] Enter name → redirects to groups tab
[ ] Create group with emoji → appears in list
[ ] Add 3+ members → shown in group detail
[ ] Add expense → balances update correctly
[ ] Balances tab shows correct debts with Settle buttons
[ ] Connect wallet → address shows in profile
[ ] Tap Settle → settlement screen shows correct details
[ ] Confirm in Phantom → transaction submits
[ ] Success screen shows → Explorer link works → memo visible
[ ] Activity feed shows the settlement
[ ] Close app → reopen → all data persists
[ ] No crashes on any screen
[ ] All back navigation works
[ ] All empty states display correctly
```

---

## Solana Explorer URLs

```
Transaction:  https://explorer.solana.com/tx/{signature}?cluster=devnet
Account:      https://explorer.solana.com/address/{pubkey}?cluster=devnet
```

For demo: always show the transaction on Explorer to prove the memo is on-chain.

---

## Category Emoji Map

```typescript
const CATEGORY_EMOJI: Record<string, string> = {
  food: '🍽️',
  transport: '🚕',
  stay: '🏨',
  shopping: '🛍️',
  entertainment: '🎬',
  other: '📦',
};
```

---

## Performance Notes

- Use `React.memo()` on expensive list items (ExpenseCard, GroupCard) if re-renders become noticeable.
- Use `useMemo` for balance calculations that depend on large expense arrays.
- AsyncStorage operations are async — don't block UI on store hydration. Show loading state until hydrated.
- Solana RPC calls have rate limits on public endpoints. Don't poll aggressively. One call per user action is fine.

---

## What Judges Care About

1. **Does the app solve a real problem?** → Expense splitting is daily-use. ✓
2. **Is the UX clean and mobile-native?** → Pastel cards, haptics, QR scanning, not a web wrapper. ✓
3. **Does it use Solana meaningfully?** → Real USDC/SOL transfers + Memo program. ✓
4. **Can they see it work in the demo?** → Wallet connect → settle → Explorer proof. ✓
5. **Is the code professional?** → TypeScript, clean architecture, active commit history. ✓

Every line of code should serve one of these five goals.