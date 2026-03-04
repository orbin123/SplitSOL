import {
    Connection,
    PublicKey,
    Transaction,
    TransactionInstruction,
    LAMPORTS_PER_SOL,
  } from '@solana/web3.js';
  import {
    createTransferInstruction,
    getAssociatedTokenAddress,
    getAccount,
    createAssociatedTokenAccountInstruction,
  } from '@solana/spl-token';
  import { SOLANA, APP } from './constants';
  
  // Singleton connection
  let _connection: Connection | null = null;
  
  export const getConnection = (): Connection => {
    if (!_connection) {
      const rpc = SOLANA.CLUSTER === 'devnet'
        ? SOLANA.DEVNET_RPC
        : SOLANA.MAINNET_RPC;
      _connection = new Connection(rpc, 'confirmed');
    }
    return _connection;
  };
  
  // Check SOL balance
  export const getSOLBalance = async (address: string): Promise<number> => {
    const conn = getConnection();
    const pubkey = new PublicKey(address);
    const balance = await conn.getBalance(pubkey);
    return balance / LAMPORTS_PER_SOL;
  };
  
  // Build a SOL transfer transaction (simpler, good for Devnet testing)
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
  
    const { blockhash, lastValidBlockHeight } =
      await conn.getLatestBlockhash();
    transaction.recentBlockhash = blockhash;
    transaction.lastValidBlockHeight = lastValidBlockHeight;
    transaction.feePayer = fromPubkey;
  
    return transaction;
  };
  
  // Build a USDC transfer transaction
  export const buildUSDCTransfer = async (
    from: string,
    to: string,
    amountUSDC: number,
  ): Promise<Transaction> => {
    const conn = getConnection();
    const fromPubkey = new PublicKey(from);
    const toPubkey = new PublicKey(to);
    const mintPubkey = new PublicKey(SOLANA.USDC_MINT_MAINNET);
  
    // Get Associated Token Accounts
    const fromATA = await getAssociatedTokenAddress(mintPubkey, fromPubkey);
    const toATA = await getAssociatedTokenAddress(mintPubkey, toPubkey);
  
    const transaction = new Transaction();
  
    // Check if recipient's ATA exists, if not create it
    try {
      await getAccount(conn, toATA);
    } catch {
      // ATA doesn't exist — add creation instruction
      transaction.add(
        createAssociatedTokenAccountInstruction(
          fromPubkey,  // payer
          toATA,       // ATA to create
          toPubkey,    // owner
          mintPubkey,  // mint
        ),
      );
    }
  
    // Add transfer instruction
    const amountInSmallestUnit = Math.round(
      amountUSDC * Math.pow(10, APP.USDC_DECIMALS),
    );
  
    transaction.add(
      createTransferInstruction(
        fromATA,
        toATA,
        fromPubkey,
        amountInSmallestUnit,
      ),
    );
  
    // Set blockhash and fee payer
    const { blockhash, lastValidBlockHeight } =
      await conn.getLatestBlockhash();
    transaction.recentBlockhash = blockhash;
    transaction.lastValidBlockHeight = lastValidBlockHeight;
    transaction.feePayer = fromPubkey;
  
    return transaction;
  };
  
  // Add a memo instruction to an existing transaction
  export const addMemo = (
    transaction: Transaction,
    message: string,
  ): Transaction => {
    const memoProgramId = new PublicKey(SOLANA.MEMO_PROGRAM_ID);
  
    transaction.add(
      new TransactionInstruction({
        keys: [],
        programId: memoProgramId,
        data: Buffer.from(message, 'utf-8'),
      }),
    );
  
    return transaction;
  };
  
  // Get Solana Explorer URL for a transaction
  export const getExplorerUrl = (signature: string): string => {
    return `${SOLANA.EXPLORER_BASE}/tx/${signature}?cluster=${SOLANA.CLUSTER}`;
  };
  
  // Confirm a transaction
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