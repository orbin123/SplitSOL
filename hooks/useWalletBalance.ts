import { useState, useEffect, useCallback } from 'react';
import { getSOLBalanceWithRetry, getUSDCBalance } from '@/utils/solana';
import { isValidWalletAddress } from '@/utils/memberQr';

export interface WalletBalance {
  solBalance: number | null;
  usdcBalance: number | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

export function useWalletBalance(
  walletAddress: string | null | undefined,
): WalletBalance {
  const [solBalance, setSolBalance] = useState<number | null>(null);
  const [usdcBalance, setUsdcBalance] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!walletAddress || !isValidWalletAddress(walletAddress)) {
      setSolBalance(null);
      setUsdcBalance(null);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const [sol, usdc] = await Promise.all([
        getSOLBalanceWithRetry(walletAddress),
        getUSDCBalance(walletAddress).catch(() => 0),
      ]);
      setSolBalance(sol);
      setUsdcBalance(usdc);
    } catch {
      setSolBalance(null);
      setUsdcBalance(null);
      setError("Couldn't reach Solana devnet. Pull down to retry.");
    } finally {
      setLoading(false);
    }
  }, [walletAddress]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { solBalance, usdcBalance, loading, error, refresh };
}
