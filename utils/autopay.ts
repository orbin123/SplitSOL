import { TOKEN_PROGRAM_ID } from '@solana/spl-token';
import { PublicKey, VersionedTransaction } from '@solana/web3.js';
import { Buffer } from 'buffer';
import { APP, SOLANA } from './constants';
import {
  SolanaTransaction,
  appendInstructionsToTransaction,
  buildSOLTransfer,
  buildUSDCTransfer,
  buildUSDCTransferInstructions,
  getConnection,
  getUSDCBalance,
} from './solana';

const JUPITER_QUOTE_URL = 'https://quote-api.jup.ag/v6/quote';
const JUPITER_SWAP_URL = 'https://quote-api.jup.ag/v6/swap';
const JUPITER_PRICE_URL = 'https://api.jup.ag/price/v3';
const DEFAULT_SLIPPAGE_BPS = 50;
const WRAPPED_SOL_MINT = 'So11111111111111111111111111111111111111112';

interface JupiterQuoteResponse {
  inputMint: string;
  inAmount: string;
  outputMint: string;
  outAmount: string;
  otherAmountThreshold: string;
  swapMode: 'ExactIn' | 'ExactOut';
  slippageBps: number;
  priceImpactPct: string;
  routePlan: Array<{
    swapInfo: {
      label?: string;
      inputMint: string;
      outputMint: string;
      inAmount: string;
      outAmount: string;
      feeAmount: string;
      feeMint: string;
    };
    percent: number;
  }>;
  platformFee?: {
    amount: string;
    feeBps: number;
  } | null;
}

interface JupiterSwapResponse {
  swapTransaction: string;
  lastValidBlockHeight?: number;
  prioritizationFeeLamports?: number;
  dynamicSlippageReport?: {
    slippageBps?: number;
  };
}

interface TokenCandidate {
  mint: string;
  symbol: string;
  decimals: number;
  balanceRaw: bigint;
  balanceUi: number;
}

interface PricedTokenCandidate extends TokenCandidate {
  usdPrice?: number;
  quote: JupiterQuoteResponse;
  inputAmount: number;
  estimatedUsdValue?: number;
}

export interface AutoPayResult {
  method: 'direct_usdc' | 'swap';
  inputToken: string;
  inputAmount: number;
  outputUSDC: number;
  slippage: number;
  route: string;
  transaction: SolanaTransaction;
  inputTokenMint?: string;
  isDevnetFallback?: boolean;
}

const getTokenLabel = (mint: string): string => {
  if (mint === SOLANA.USDC_MINT_MAINNET) return APP.CURRENCY_SYMBOL;
  if (mint === WRAPPED_SOL_MINT) return 'SOL';
  return `${mint.slice(0, 4)}...${mint.slice(-4)}`;
};

const uiAmountToRaw = (amount: number, decimals: number): bigint =>
  BigInt(Math.round(amount * Math.pow(10, decimals)));

const rawAmountToUi = (amount: string | bigint, decimals: number): number =>
  Number(amount.toString()) / Math.pow(10, decimals);

const fetchJson = async <T>(url: string, init?: RequestInit): Promise<T> => {
  const response = await fetch(url, init);

  if (!response.ok) {
    const body = await response.text();
    throw new Error(body || `Request failed with ${response.status}`);
  }

  return response.json() as Promise<T>;
};

const getWalletTokenCandidates = async (
  walletAddress: string,
): Promise<TokenCandidate[]> => {
  const connection = getConnection();
  const owner = new PublicKey(walletAddress);
  const mintMap = new Map<string, TokenCandidate>();

  const [solBalance, tokenAccounts] = await Promise.all([
    connection.getBalance(owner),
    connection.getParsedTokenAccountsByOwner(owner, {
      programId: TOKEN_PROGRAM_ID,
    }),
  ]);

  if (solBalance > 0) {
    mintMap.set(WRAPPED_SOL_MINT, {
      mint: WRAPPED_SOL_MINT,
      symbol: 'SOL',
      decimals: 9,
      balanceRaw: BigInt(solBalance),
      balanceUi: solBalance / 1_000_000_000,
    });
  }

  tokenAccounts.value.forEach(({ account }) => {
    const parsed = account.data.parsed?.info;
    const mint = parsed?.mint;
    const tokenAmount = parsed?.tokenAmount;

    if (!mint || !tokenAmount?.amount) return;

    const amountRaw = BigInt(tokenAmount.amount);
    if (amountRaw <= 0n) return;

    const decimals = Number(tokenAmount.decimals ?? 0);
    const balanceUi = Number(
      tokenAmount.uiAmountString ?? tokenAmount.uiAmount ?? 0,
    );
    const existing = mintMap.get(mint);

    if (existing) {
      existing.balanceRaw += amountRaw;
      existing.balanceUi += balanceUi;
      return;
    }

    mintMap.set(mint, {
      mint,
      symbol: getTokenLabel(mint),
      decimals,
      balanceRaw: amountRaw,
      balanceUi,
    });
  });

  return [...mintMap.values()].filter((token) => token.balanceRaw > 0n);
};

const fetchTokenPrices = async (
  mints: string[],
): Promise<Record<string, number>> => {
  if (mints.length === 0) return {};

  try {
    const params = new URLSearchParams({ ids: mints.join(',') });
    const response = await fetchJson<
      Record<string, { usdPrice?: number } | undefined>
    >(`${JUPITER_PRICE_URL}?${params.toString()}`);

    return Object.fromEntries(
      Object.entries(response).map(([mint, value]) => [
        mint,
        value?.usdPrice ?? 0,
      ]),
    );
  } catch {
    return {};
  }
};

const fetchQuote = async (
  inputMint: string,
  amountUSDC: number,
): Promise<JupiterQuoteResponse> => {
  const requiredOutRaw = uiAmountToRaw(amountUSDC, APP.USDC_DECIMALS);
  const params = new URLSearchParams({
    inputMint,
    outputMint: SOLANA.USDC_MINT_MAINNET,
    amount: requiredOutRaw.toString(),
    swapMode: 'ExactOut',
    slippageBps: String(DEFAULT_SLIPPAGE_BPS),
  });

  return fetchJson<JupiterQuoteResponse>(
    `${JUPITER_QUOTE_URL}?${params.toString()}`,
  );
};

const pickBestQuote = async (
  walletAddress: string,
  amountUSDC: number,
): Promise<PricedTokenCandidate> => {
  const tokens = (await getWalletTokenCandidates(walletAddress)).filter(
    (token) => token.mint !== SOLANA.USDC_MINT_MAINNET,
  );

  if (tokens.length === 0) {
    throw new Error('No supported token balances were found for AutoPay.');
  }

  const priceMap = await fetchTokenPrices(tokens.map((token) => token.mint));
  const quoteResults: Array<PricedTokenCandidate | null> = await Promise.all(
    tokens.map(async (token) => {
      try {
        const quote = await fetchQuote(token.mint, amountUSDC);
        const rawInput = BigInt(quote.inAmount);
        if (rawInput > token.balanceRaw) return null;

        const inputAmount = rawAmountToUi(rawInput, token.decimals);
        const usdPrice = priceMap[token.mint];

        return {
          ...token,
          usdPrice,
          quote,
          inputAmount,
          estimatedUsdValue:
            usdPrice && usdPrice > 0 ? inputAmount * usdPrice : undefined,
        };
      } catch {
        return null;
      }
    }),
  );

  const validQuotes = quoteResults.filter(
    (item): item is PricedTokenCandidate => item !== null,
  );

  if (validQuotes.length === 0) {
    throw new Error('No Jupiter swap route was found for your available tokens.');
  }

  validQuotes.sort((a, b) => {
    if (a.estimatedUsdValue && b.estimatedUsdValue) {
      return a.estimatedUsdValue - b.estimatedUsdValue;
    }

    if (a.estimatedUsdValue) return -1;
    if (b.estimatedUsdValue) return 1;
    return a.inputAmount - b.inputAmount;
  });

  return validQuotes[0];
};

const fetchSwapTransaction = async (
  walletAddress: string,
  quoteResponse: JupiterQuoteResponse,
): Promise<JupiterSwapResponse> =>
  fetchJson<JupiterSwapResponse>(JUPITER_SWAP_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      userPublicKey: walletAddress,
      quoteResponse,
      dynamicComputeUnitLimit: true,
      prioritizationFeeLamports: 'auto',
      wrapAndUnwrapSol: true,
    }),
  });

const getRouteLabel = (quote: JupiterQuoteResponse): string => {
  const route = quote.routePlan
    .map((step) => step.swapInfo.label)
    .filter(Boolean)
    .join(' -> ');

  return route || 'Jupiter';
};

export async function buildAutoPayTransaction(
  walletAddress: string,
  recipientAddress: string,
  amountUSDC: number,
): Promise<AutoPayResult> {
  if (SOLANA.CLUSTER === 'devnet') {
    const amountInSOL = amountUSDC * SOLANA.DEVNET_USDC_TO_SOL;
    const transaction = await buildSOLTransfer(
      walletAddress,
      recipientAddress,
      amountInSOL,
    );

    return {
      method: 'swap',
      inputToken: 'SOL',
      inputAmount: amountInSOL,
      outputUSDC: amountUSDC,
      slippage: 0,
      route: 'Devnet SOL equivalent',
      transaction,
      inputTokenMint: WRAPPED_SOL_MINT,
      isDevnetFallback: true,
    };
  }

  const directUsdcBalance = await getUSDCBalance(walletAddress);
  if (directUsdcBalance >= amountUSDC) {
    return {
      method: 'direct_usdc',
      inputToken: APP.CURRENCY_SYMBOL,
      inputAmount: amountUSDC,
      outputUSDC: amountUSDC,
      slippage: 0,
      route: 'Direct USDC balance',
      transaction: await buildUSDCTransfer(
        walletAddress,
        recipientAddress,
        amountUSDC,
      ),
      inputTokenMint: SOLANA.USDC_MINT_MAINNET,
    };
  }

  const bestQuote = await pickBestQuote(walletAddress, amountUSDC);
  const swapResponse = await fetchSwapTransaction(walletAddress, bestQuote.quote);
  const swapTransaction = VersionedTransaction.deserialize(
    Buffer.from(swapResponse.swapTransaction, 'base64'),
  );
  const transferInstructions = await buildUSDCTransferInstructions(
    walletAddress,
    recipientAddress,
    amountUSDC,
  );
  const transaction = await appendInstructionsToTransaction(
    swapTransaction,
    transferInstructions,
  );

  return {
    method: 'swap',
    inputToken: bestQuote.symbol,
    inputAmount: bestQuote.inputAmount,
    outputUSDC: amountUSDC,
    slippage:
      (swapResponse.dynamicSlippageReport?.slippageBps ??
        bestQuote.quote.slippageBps) / 100,
    route: getRouteLabel(bestQuote.quote),
    transaction,
    inputTokenMint: bestQuote.mint,
  };
}

export const getAutoPayPreviewLabel = (result: AutoPayResult): string => {
  if (result.method === 'direct_usdc') {
    return 'Paying directly from USDC balance';
  }

  if (result.isDevnetFallback) {
    return `Using ${result.inputAmount.toFixed(4)} SOL (Devnet equivalent)`;
  }

  return `Using ${result.inputAmount.toFixed(4)} ${result.inputToken} (via Jupiter swap)`;
};
