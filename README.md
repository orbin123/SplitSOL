# SplitSOL

SplitSOL is a mobile-first group expense app for Solana. It lets friends split shared costs in USDC terms, track who owes what, and settle balances on-chain with Phantom wallet auth and an AutoPay flow that can swap into the right asset when needed.

Built with Expo, React Native, Expo Router, and Zustand.

## Why SplitSOL

Traditional split-bill apps stop at bookkeeping. SplitSOL closes the loop:

- Wallet-based identity instead of username/password onboarding
- Group expense tracking with simplified balances
- QR-based contact sharing and member invites
- On-chain settlement on Solana
- AutoPay support for direct USDC or swap-assisted payments
- Mobile-native polish like haptics, empty states, and notifications

## Core Experience

The intended user journey looks like this:

1. Fresh install
2. Connect Phantom
3. Choose a display name
4. Create a group
5. Add friends by QR
6. Add shared expenses
7. View net balances
8. Settle on-chain
9. Open the success screen and explorer link
10. Review history and notifications

## Features

### Wallet onboarding

- Phantom-first onboarding flow
- Wallet session reauthorization
- Clear handling for wallet rejection and missing-wallet cases

### Group expense tracking

- Create groups with names and emoji
- Add members from contacts or QR scan
- Add expenses in USDC terms
- Auto-calculated balances and simplified debts

### Settlement flow

- Open pending debts from a dedicated settle hub
- Prepare a payment route before confirmation
- Settle directly with USDC when possible
- Fall back to AutoPay swap logic when needed
- Show success state with Solana explorer link

### Contact and invite flow

- Generate your own QR identity card
- Scan another user to add them instantly
- Reuse contacts across groups

### Mobile polish

- Haptic feedback across primary actions
- Empty states on key list screens
- Notification feed for reminders and activity
- Light visual theme throughout the app

## Tech Stack

- `Expo` / `React Native`
- `Expo Router` for file-based navigation
- `Zustand` for local app state
- `@solana/web3.js` + SPL Token tooling
- `@solana-mobile/mobile-wallet-adapter-protocol-web3js`
- `expo-camera`, `expo-notifications`, `expo-haptics`

## Project Structure

```text
app/            Screens and routes
components/     Shared UI and feature components
store/          Zustand state and actions
utils/          Solana, formatting, QR, notifications, AutoPay helpers
assets/         App icons and branding assets
docs/           Demo and project documentation
```

## Getting Started

### Prerequisites

- Node.js
- npm
- Expo CLI tooling via `npx`
- Phantom wallet on a supported mobile device for settlement testing

### Install

```bash
npm install
```

### Start the app

```bash
npx expo start
```

Common shortcuts:

```bash
npm run android
npm run ios
npm run web
```

## Build an Android APK

Preview builds are configured in `eas.json` to output an APK:

```bash
eas build --platform android --profile preview
```

## Typecheck

```bash
npx tsc --noEmit
```

## Demo Script

A polished walkthrough for the demo flow lives here:

- `docs/demo-flow-phase-11.md`

## Current Notes

- The app is currently configured for `Solana devnet`.
- Expenses are represented in `USDC`.
- The project is optimized around a mobile demo flow and local-first state.

## What Makes It Different

SplitSOL is not just another IOU tracker. It combines consumer-friendly bill splitting with crypto-native settlement, making the jump from “who owes whom” to “the payment is already done” in the same app.

## License

This project is private unless the repository owner decides otherwise.
