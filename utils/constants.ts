export const COLORS = {
    // Backgrounds
    bg: {
      primary: '#0A0E1A',     // Deep navy — main background
      secondary: '#111827',    // Slightly lighter — cards
      tertiary: '#1F2937',     // Even lighter — inputs, secondary cards
      accent: '#7C3AED',       // Vibrant purple — primary actions
      accentLight: '#8B5CF6',  // Lighter purple — hover/active states
      success: '#10B981',      // Green — settled, confirmed
      danger: '#EF4444',       // Red — errors, owe money
      warning: '#F59E0B',      // Amber — pending
    },
    // Text
    text: {
      primary: '#F9FAFB',     // Almost white — headings
      secondary: '#9CA3AF',   // Gray — body text, labels
      tertiary: '#6B7280',    // Darker gray — placeholders
      accent: '#A78BFA',      // Light purple — links, highlights
      success: '#34D399',     // Green text
      danger: '#F87171',      // Red text
    },
    // Borders
    border: {
      default: '#1F2937',
      focus: '#7C3AED',
    },
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
    full: 9999,
  };
  
  // === SOLANA CONSTANTS ===
  export const SOLANA = {
    DEVNET_RPC: 'https://api.devnet.solana.com',
    MAINNET_RPC: 'https://api.mainnet-beta.solana.com',
    USDC_MINT_MAINNET: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
    MEMO_PROGRAM_ID: 'MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr',
    EXPLORER_BASE: 'https://explorer.solana.com',
    CLUSTER: 'devnet' as const,  // Switch to 'mainnet-beta' for production
  };
  
  // === APP CONSTANTS ===
  export const APP = {
    NAME: 'SplitSOL',
    VERSION: '1.0.0',
    IDENTITY_URI: 'https://splitsol.app',
    MAX_GROUP_MEMBERS: 20,
    MAX_EXPENSE_DESCRIPTION: 100,
    CURRENCY_SYMBOL: '₹',
    USDC_DECIMALS: 6,
  };