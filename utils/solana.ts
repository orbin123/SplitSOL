import {
  AddressLookupTableAccount,
  Connection,
  LAMPORTS_PER_SOL,
  PublicKey,
  Transaction,
  TransactionInstruction,
  TransactionMessage,
  VersionedTransaction,
} from '@solana/web3.js';
import {
  createAssociatedTokenAccountInstruction,
  createTransferInstruction,
  getAccount,
  getAssociatedTokenAddress,
} from '@solana/spl-token';
import { APP, SOLANA } from './constants';

export type SolanaTransaction = Transaction | VersionedTransaction;

let _connection: Connection | null = null;

export const getRpcEndpoint = (): string =>
  SOLANA.CLUSTER === 'devnet' ? SOLANA.DEVNET_RPC : SOLANA.MAINNET_RPC;

export const getConnection = (): Connection => {
  if (!_connection) {
    _connection = new Connection(getRpcEndpoint(), 'confirmed');
  }
  return _connection;
};

export const getSOLBalance = async (address: string): Promise<number> => {
  const conn = getConnection();
  const pubkey = new PublicKey(address);
  const balance = await conn.getBalance(pubkey);
  return balance / LAMPORTS_PER_SOL;
};

export const getUSDCMint = (): PublicKey =>
  new PublicKey(SOLANA.USDC_MINT_MAINNET);

export const getUSDCAssociatedTokenAddress = async (
  owner: string | PublicKey,
): Promise<PublicKey> => {
  const ownerPubkey = typeof owner === 'string' ? new PublicKey(owner) : owner;
  return getAssociatedTokenAddress(getUSDCMint(), ownerPubkey);
};

export const getTokenBalance = async (
  owner: string,
  mint: string,
): Promise<number> => {
  const conn = getConnection();

  try {
    const ownerPubkey = new PublicKey(owner);
    const mintPubkey = new PublicKey(mint);
    const ata = await getAssociatedTokenAddress(mintPubkey, ownerPubkey);
    const balance = await conn.getTokenAccountBalance(ata);
    return Number(balance.value.uiAmountString ?? balance.value.uiAmount ?? 0);
  } catch {
    return 0;
  }
};

export const getUSDCBalance = async (owner: string): Promise<number> =>
  getTokenBalance(owner, SOLANA.USDC_MINT_MAINNET);

export const buildSOLTransfer = async (
  from: string,
  to: string,
  amountSOL: number,
): Promise<Transaction> => {
  const conn = getConnection();
  const fromPubkey = new PublicKey(from);
  const toPubkey = new PublicKey(to);
  const { SystemProgram } = await import('@solana/web3.js');

  const transaction = new Transaction().add(
    SystemProgram.transfer({
      fromPubkey,
      toPubkey,
      lamports: Math.round(amountSOL * LAMPORTS_PER_SOL),
    }),
  );

  const { blockhash, lastValidBlockHeight } = await conn.getLatestBlockhash();
  transaction.recentBlockhash = blockhash;
  transaction.lastValidBlockHeight = lastValidBlockHeight;
  transaction.feePayer = fromPubkey;

  return transaction;
};

export const buildUSDCTransferInstructions = async (
  from: string,
  to: string,
  amountUSDC: number,
): Promise<TransactionInstruction[]> => {
  const conn = getConnection();
  const fromPubkey = new PublicKey(from);
  const toPubkey = new PublicKey(to);
  const mintPubkey = getUSDCMint();
  const fromATA = await getAssociatedTokenAddress(mintPubkey, fromPubkey);
  const toATA = await getAssociatedTokenAddress(mintPubkey, toPubkey);
  const instructions: TransactionInstruction[] = [];

  try {
    await getAccount(conn, toATA);
  } catch {
    instructions.push(
      createAssociatedTokenAccountInstruction(
        fromPubkey,
        toATA,
        toPubkey,
        mintPubkey,
      ),
    );
  }

  const amountInSmallestUnit = Math.round(
    amountUSDC * Math.pow(10, APP.USDC_DECIMALS),
  );

  instructions.push(
    createTransferInstruction(
      fromATA,
      toATA,
      fromPubkey,
      amountInSmallestUnit,
    ),
  );

  return instructions;
};

export const buildUSDCTransfer = async (
  from: string,
  to: string,
  amountUSDC: number,
): Promise<Transaction> => {
  const conn = getConnection();
  const fromPubkey = new PublicKey(from);
  const instructions = await buildUSDCTransferInstructions(from, to, amountUSDC);
  const transaction = new Transaction().add(...instructions);
  const { blockhash, lastValidBlockHeight } = await conn.getLatestBlockhash();

  transaction.recentBlockhash = blockhash;
  transaction.lastValidBlockHeight = lastValidBlockHeight;
  transaction.feePayer = fromPubkey;

  return transaction;
};

export const buildMemoInstruction = (
  message: string,
): TransactionInstruction => {
  const memoProgramId = new PublicKey(SOLANA.MEMO_PROGRAM_ID);

  return new TransactionInstruction({
    keys: [],
    programId: memoProgramId,
    data: Buffer.from(message, 'utf-8'),
  });
};

export const addMemo = (
  transaction: Transaction,
  message: string,
): Transaction => {
  transaction.add(buildMemoInstruction(message));
  return transaction;
};

const resolveAddressLookupTableAccounts = async (
  transaction: VersionedTransaction,
): Promise<AddressLookupTableAccount[]> => {
  const conn = getConnection();
  const tables = await Promise.all(
    transaction.message.addressTableLookups.map(async (lookup) => {
      const result = await conn.getAddressLookupTable(lookup.accountKey);
      return result.value;
    }),
  );

  return tables.filter(
    (table): table is AddressLookupTableAccount => Boolean(table),
  );
};

export const appendInstructionsToVersionedTransaction = async (
  transaction: VersionedTransaction,
  instructions: TransactionInstruction[],
): Promise<VersionedTransaction> => {
  const addressLookupTableAccounts =
    await resolveAddressLookupTableAccounts(transaction);
  const message = TransactionMessage.decompile(transaction.message, {
    addressLookupTableAccounts,
  });

  message.instructions.push(...instructions);

  return new VersionedTransaction(
    message.compileToV0Message(addressLookupTableAccounts),
  );
};

export const appendInstructionsToTransaction = async (
  transaction: SolanaTransaction,
  instructions: TransactionInstruction[],
): Promise<SolanaTransaction> => {
  if (transaction instanceof Transaction) {
    transaction.add(...instructions);
    return transaction;
  }

  return appendInstructionsToVersionedTransaction(transaction, instructions);
};

export const addMemoToTransaction = async (
  transaction: SolanaTransaction,
  message: string,
): Promise<SolanaTransaction> =>
  appendInstructionsToTransaction(transaction, [buildMemoInstruction(message)]);

export const getExplorerUrl = (signature: string): string => {
  return `${SOLANA.EXPLORER_BASE}/tx/${signature}?cluster=${SOLANA.CLUSTER}`;
};

export const confirmTransaction = async (
  signature: string,
): Promise<boolean> => {
  const conn = getConnection();
  try {
    const result = await conn.confirmTransaction(signature, 'confirmed');
    return !result.value.err;
  } catch {
    return false;
  }
};