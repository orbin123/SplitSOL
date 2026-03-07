export const COLORS = {
  bg: {
    primary: '#F8F7FC',
    secondary: '#FFFFFF',
    tertiary: '#F3F4F6',
    accent: '#7C3AED',
    accentLight: '#8B5CF6',
    accentSoft: '#EDE9FE',
    success: '#10B981',
    danger: '#EF4444',
    warning: '#F59E0B',
    dark: '#1A1A2E',
  },
  text: {
    primary: '#1A1A2E',
    secondary: '#6B7280',
    tertiary: '#9CA3AF',
    accent: '#7C3AED',
    success: '#10B981',
    danger: '#EF4444',
    white: '#FFFFFF',
  },
  border: {
    default: '#E5E7EB',
    focus: '#7C3AED',
  },
};

export const GRADIENTS = {
  purple: ['#C4B5FD', '#E9D5FF'] as [string, string],
  purpleSoft: ['#DDD6FE', '#F5F3FF'] as [string, string],
};

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
};

export const FONT = {
  size: {
    xs: 11,
    sm: 13,
    md: 15,
    lg: 17,
    xl: 20,
    xxl: 24,
    hero: 32,
  },
  weight: {
    normal: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
    extrabold: '800' as const,
  },
};

export const RADIUS = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  full: 9999,
};

export const SOLANA = {
  DEVNET_RPC: 'https://api.devnet.solana.com',
  MAINNET_RPC: 'https://api.mainnet-beta.solana.com',
  USDC_MINT_MAINNET: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
  MEMO_PROGRAM_ID: 'MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr',
  EXPLORER_BASE: 'https://explorer.solana.com',
  CLUSTER: 'devnet' as const,
  /** Devnet only: 1 USDC ≈ X SOL (for testing when USDC not available) */
  DEVNET_USDC_TO_SOL: 0.001,
};

export const APP = {
  NAME: 'SplitSOL',
  VERSION: '1.0.0',
  IDENTITY_URI: 'https://splitsol.app',
  MAX_GROUP_MEMBERS: 20,
  MAX_EXPENSE_DESCRIPTION: 100,
  CURRENCY_SYMBOL: 'USDC',
  USDC_DECIMALS: 6,
};

export const TAB_BAR_HEIGHT = 100;
