/**
 * AutoPay — settlement transaction builder.
 *
 * Payment strategy (in priority order):
 *  1. Direct USDC transfer         — sender has enough USDC
 *  2. SOL-equivalent transfer      — devnet fallback (Jupiter swap API doesn't work on devnet)
 *  3. Jupiter SOL → USDC swap      — mainnet path, ready for production
 */
import { VersionedTransaction } from '@solana/web3.js';
import { APP, SOLANA } from './constants';
import {
  SolanaTransaction,
  buildSOLTransfer,
  buildUSDCTransfer,
  buildUSDCTransferInstructions,
  appendInstructionsToVersionedTransaction,
  addMemoToTransaction,
  getUSDCBalance,
} from './solana';

// ─── Types ────────────────────────────────────────────────────────────────────

export type AutoPayMethod = 'USDC' | 'SOL_EQUIVALENT' | 'JUPITER_SWAP';

export interface BuildSettlementTransactionParams {
  fromWallet: string;
  toWallet: string;
  amountUSDC: number;
  cluster: 'devnet' | 'mainnet-beta';
}

export interface SettlementTransactionResult {
  transaction: SolanaTransaction;
  paymentMethod: AutoPayMethod;
  details: {
    amountUSDC: number;
    amountSOL?: number;    // SOL_EQUIVALENT: SOL amount sent
    solUsdcRate?: number;  // SOL_EQUIVALENT: rate used (USDC per 1 SOL)
    jupiterRoute?: string; // JUPITER_SWAP: route description
  };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const SOL_NATIVE_MINT = 'So11111111111111111111111111111111111111112';

/** fetch() with a manual timeout, safe for all React Native Hermes versions. */
const fetchWithTimeout = (
  url: string,
  options: RequestInit = {},
  ms = 8000,
): Promise<Response> =>
  Promise.race([
    fetch(url, options),
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('Request timed out')), ms),
    ),
  ]);

/**
 * Fetches the live SOL price in USD (≈ USDC) from Jupiter Price API.
 * The price feed works from any network context — it's not a swap API.
 * Returns null on any failure so callers can fall back gracefully.
 */
export const getJupiterSolPrice = async (): Promise<number | null> => {
  try {
    const res = await fetchWithTimeout(
      'https://price.jup.ag/v6/price?ids=SOL',
      {},
      4000,
    );
    if (!res.ok) return null;
    const json = (await res.json()) as {
      data?: { SOL?: { price?: number } };
    };
    return json.data?.SOL?.price ?? null;
  } catch {
    return null;
  }
};

/**
 * Builds a Jupiter v6 swap transaction (SOL → USDC, ExactOut) for mainnet.
 * Appends a USDC transfer instruction so the swapped USDC goes to the recipient
 * in the same atomic transaction.
 *
 * NOT usable on devnet — Jupiter swap API only supports mainnet.
 */
export const getJupiterSwapTransaction = async (params: {
  fromWallet: string;
  toWallet: string;
  amountUSDC: number;
}): Promise<VersionedTransaction> => {
  const { fromWallet, toWallet, amountUSDC } = params;
  const outputMint = SOLANA.USDC_MINT_MAINNET;
  const amountOut = Math.round(amountUSDC * Math.pow(10, APP.USDC_DECIMALS));

  // 1. Quote: exact-out — we know exactly how much USDC the recipient needs
  const quoteParams = new URLSearchParams({
    inputMint: SOL_NATIVE_MINT,
    outputMint,
    amount: amountOut.toString(),
    swapMode: 'ExactOut',
    slippageBps: '50',
  });

  const quoteRes = await fetchWithTimeout(
    `https://quote-api.jup.ag/v6/quote?${quoteParams}`,
    {},
    10_000,
  );
  if (!quoteRes.ok) throw new Error(`Jupiter quote failed (${quoteRes.status})`);
  const quoteResponse = await quoteRes.json();

  // 2. Swap transaction — USDC lands in fromWallet's ATA
  const swapRes = await fetchWithTimeout(
    'https://quote-api.jup.ag/v6/swap',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        quoteResponse,
        userPublicKey: fromWallet,
        wrapAndUnwrapSol: true,
      }),
    },
    10_000,
  );
  if (!swapRes.ok) throw new Error(`Jupiter swap failed (${swapRes.status})`);
  const { swapTransaction } = (await swapRes.json()) as { swapTransaction: string };

  const versionedTx = VersionedTransaction.deserialize(
    Buffer.from(swapTransaction, 'base64'),
  );

  // 3. Append USDC transfer: fromWallet ATA → toWallet ATA
  //    The swap outputs USDC to fromWallet's ATA first; this instruction forwards it.
  const transferIxs = await buildUSDCTransferInstructions(fromWallet, toWallet, amountUSDC);
  return appendInstructionsToVersionedTransaction(versionedTx, transferIxs);
};

// ─── Main entry point ─────────────────────────────────────────────────────────

/**
 * Builds the optimal settlement transaction for the given parameters.
 *
 * Memo format: `SplitSOL | GroupName | FromName → ToName | 25.00 USDC`
 */
export const buildSettlementTransaction = async (
  params: BuildSettlementTransactionParams,
  memo?: string,
): Promise<SettlementTransactionResult> => {
  const { fromWallet, toWallet, amountUSDC, cluster } = params;
  const memoText = memo ?? `SplitSOL | ${amountUSDC.toFixed(2)} USDC`;

  // Step 1: Check sender USDC balance
  const usdcBalance = await getUSDCBalance(fromWallet);

  // Step 2a: Direct USDC transfer — preferred path
  if (usdcBalance >= amountUSDC) {
    const base = await buildUSDCTransfer(fromWallet, toWallet, amountUSDC);
    const tx = await addMemoToTransaction(base, memoText);
    return {
      transaction: tx,
      paymentMethod: 'USDC',
      details: { amountUSDC },
    };
  }

  // Step 2b: Devnet fallback — send SOL equivalent
  //   Jupiter swap API doesn't work on devnet. We send SOL directly at
  //   the current market rate (or a safe hardcoded fallback).
  if (cluster === 'devnet') {
    const livePrice = await getJupiterSolPrice(); // SOL price in USD ≈ USDC
    // DEVNET_USDC_TO_SOL = 0.001 means 1 USDC = 0.001 SOL → 1 SOL = 1000 USDC
    const fallbackRate = 1 / SOLANA.DEVNET_USDC_TO_SOL;
    const solUsdcRate = livePrice ?? fallbackRate;
    const amountSOL = amountUSDC / solUsdcRate;

    const base = await buildSOLTransfer(fromWallet, toWallet, amountSOL);
    const tx = await addMemoToTransaction(base, memoText);
    return {
      transaction: tx,
      paymentMethod: 'SOL_EQUIVALENT',
      details: { amountUSDC, amountSOL, solUsdcRate },
    };
  }

  // Step 2c: Mainnet — Jupiter SOL → USDC swap, forwarded directly to recipient
  const swapTx = await getJupiterSwapTransaction({ fromWallet, toWallet, amountUSDC });
  const tx = await addMemoToTransaction(swapTx, memoText);
  return {
    transaction: tx,
    paymentMethod: 'JUPITER_SWAP',
    details: { amountUSDC, jupiterRoute: 'Jupiter v6 (ExactOut)' },
  };
};
