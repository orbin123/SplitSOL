import { transact } from '@solana-mobile/mobile-wallet-adapter-protocol-web3js';
import { PublicKey, Transaction, VersionedTransaction } from '@solana/web3.js';
import { APP, SOLANA } from './constants';
import { getConnection } from './solana';

export type WalletTransaction = Transaction | VersionedTransaction;

export interface AuthResult {
  address: string;
  authToken: string;
}

const APP_IDENTITY = {
  name: APP.NAME,
  uri: APP.IDENTITY_URI,
  icon: 'favicon.ico',
} as const;

// Connect wallet — returns the wallet address
export const connectWallet = async (): Promise<AuthResult> => {
  const result = await transact(async (wallet) => {
    const auth = await wallet.authorize({
      identity: APP_IDENTITY,
      cluster: SOLANA.CLUSTER,
    });

    return {
      address: auth.accounts[0].address,
      authToken: auth.auth_token,
    };
  });

  return result;
};

export const reauthorizeWallet = async (
  authToken: string,
): Promise<AuthResult> => {
  const result = await transact(async (wallet) => {
    const auth = await wallet.reauthorize({
      auth_token: authToken,
      identity: APP_IDENTITY,
    });

    return {
      address: auth.accounts[0].address,
      authToken: auth.auth_token,
    };
  });

  return result;
};

export const disconnectWalletSession = async (
  authToken: string,
): Promise<void> => {
  await transact(async (wallet) => {
    await wallet.deauthorize({
      auth_token: authToken,
    });
  });
};

// Sign and send a transaction — returns the signature
export const signAndSendTransaction = async (
  transaction: WalletTransaction,
): Promise<string> => {
  const connection = getConnection();

  const signature = await transact(async (wallet) => {
    // Re-authorize
    const auth = await wallet.authorize({
      identity: APP_IDENTITY,
      cluster: SOLANA.CLUSTER,
    });

    if (transaction instanceof Transaction) {
      const { blockhash, lastValidBlockHeight } =
        await connection.getLatestBlockhash();
      transaction.recentBlockhash = blockhash;
      transaction.lastValidBlockHeight = lastValidBlockHeight;
      transaction.feePayer = new PublicKey(auth.accounts[0].address);
    }

    const signatures = await wallet.signAndSendTransactions({
      transactions: [transaction as any],
    });

    return signatures[0];
  });

  return signature;
};

// Convenience: Build, sign, send, and confirm in one call
export const executeSettlement = async (
  transaction: WalletTransaction,
): Promise<{ signature: string; confirmed: boolean }> => {
  const signature = await signAndSendTransaction(transaction);

  // Wait for confirmation
  const connection = getConnection();
  const confirmation = await connection.confirmTransaction(
    signature,
    'confirmed',
  );

  return {
    signature,
    confirmed: !confirmation.value.err,
  };
};