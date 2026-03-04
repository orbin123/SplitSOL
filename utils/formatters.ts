import { APP } from './constants';

// Truncate wallet address: "7xKXWbz5abc123def456" → "7xKX...f456"
export const truncateAddress = (address: string, chars = 4): string => {
  if (!address) return '';
  return `${address.slice(0, chars)}...${address.slice(-chars)}`;
};

// Format currency: 2000 → "₹2,000.00"
export const formatCurrency = (amount: number): string => {
  return `${APP.CURRENCY_SYMBOL}${amount.toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
};

// Format USDC: 10.5 → "10.50 USDC"
export const formatUSDC = (amount: number): string => {
  return `${amount.toFixed(2)} USDC`;
};

// Relative time: "2 hours ago", "Just now"
export const timeAgo = (dateString: string): string => {
  const now = Date.now();
  const then = new Date(dateString).getTime();
  const seconds = Math.floor((now - then) / 1000);

  if (seconds < 60) return 'Just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
  return new Date(dateString).toLocaleDateString();
};

// Generate a deterministic color from a string (for avatars)
export const stringToColor = (str: string): string => {
  const colors = [
    '#7C3AED', '#EC4899', '#F59E0B', '#10B981',
    '#3B82F6', '#EF4444', '#8B5CF6', '#14B8A6',
    '#F97316', '#06B6D4', '#84CC16', '#E11D48',
  ];
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
};

// Get initials from name: "Ankit Kumar" → "AK"
export const getInitials = (name: string): string => {
  return name
    .split(' ')
    .map((word) => word[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
};

// Generate a simple unique ID
export const generateId = (): string => {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 9);
};

// Build a memo string for on-chain settlement
export const buildMemo = (
  groupName: string,
  fromName: string,
  toName: string,
  amount: number,
): string => {
  return `SplitSOL | ${groupName} | ${formatCurrency(amount)} | ${fromName} -> ${toName}`;
};