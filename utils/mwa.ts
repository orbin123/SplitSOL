import { transact } from '@solana-mobile/mobile-wallet-adapter-protocol-web3js';
import { Transaction, PublicKey } from '@solana/web3.js';
import { APP, SOLANA } from './constants';
import { getConnection } from './solana';

interface AuthResult {
  address: string;
  authToken: string;
}

// Connect wallet — returns the wallet address
export const connectWallet = async (): Promise<AuthResult> => {
  const result = await transact(async (wallet) => {
    const auth = await wallet.authorize({
      identity: {
        name: APP.NAME,
        uri: APP.IDENTITY_URI,
        icon: 'favicon.ico',
      },
      cluster: SOLANA.CLUSTER,
    });

    return {
      address: auth.accounts[0].address,
      authToken: auth.auth_token,
    };
  });

  return result;
};

// Sign and send a transaction — returns the signature
export const signAndSendTransaction = async (
  transaction: Transaction,
): Promise<string> => {
  const connection = getConnection();

  const signature = await transact(async (wallet) => {
    // Re-authorize
    const auth = await wallet.authorize({
      identity: {
        name: APP.NAME,
        uri: APP.IDENTITY_URI,
        icon: 'favicon.ico',
      },
      cluster: SOLANA.CLUSTER,
    });

    // Ensure blockhash is fresh
    const { blockhash, lastValidBlockHeight } =
      await connection.getLatestBlockhash();
    transaction.recentBlockhash = blockhash;
    transaction.lastValidBlockHeight = lastValidBlockHeight;
    transaction.feePayer = new PublicKey(auth.accounts[0].address);

    // Sign and send
    const signatures = await wallet.signAndSendTransactions({
      transactions: [transaction],
    });

    return signatures[0];
  });

  return signature;
};

// Convenience: Build, sign, send, and confirm in one call
export const executeSettlement = async (
  transaction: Transaction,
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