import {
  Connection,
  Keypair,
  PublicKey,
  Transaction,
  sendAndConfirmTransaction
} from '@solana/web3.js';
import {
  getOrCreateAssociatedTokenAccount,
  createTransferInstruction,
  getAssociatedTokenAddress,
  createAssociatedTokenAccountInstruction,
  TOKEN_PROGRAM_ID,
  TOKEN_2022_PROGRAM_ID
} from '@solana/spl-token';
import { CONFIG } from './config.js';
import { statusBroadcaster } from './status.js';
import { Holder } from './snapshot.js';

interface Distribution {
  address: string;
  amount: number; // Amount of TSLAx to send
}

interface AirdropResult {
  success: boolean;
  distributed: number;
  recipients: number;
  skippedDumpers: number;  // Wallets that dumped after snapshot
  txSignatures: string[];
  errors: string[];
}

// Real-time verification: Check if wallet still holds minimum $SER
// Note: $SER may use Token-2022 program, so we try both
async function verifySerHolding(
  connection: Connection,
  walletAddress: string
): Promise<boolean> {
  try {
    const serMint = new PublicKey(CONFIG.serMint);
    const walletPubkey = new PublicKey(walletAddress);

    // Try Token-2022 first (more common for pump.fun tokens)
    try {
      const tokenAccount = await getAssociatedTokenAddress(
        serMint,
        walletPubkey,
        false,
        TOKEN_2022_PROGRAM_ID
      );
      const accountInfo = await connection.getTokenAccountBalance(tokenAccount);
      const balance = Number(accountInfo.value.uiAmount) || 0;
      return balance >= CONFIG.minSerHolding;
    } catch {
      // Try standard SPL Token as fallback
      const tokenAccount = await getAssociatedTokenAddress(serMint, walletPubkey);
      const accountInfo = await connection.getTokenAccountBalance(tokenAccount);
      const balance = Number(accountInfo.value.uiAmount) || 0;
      return balance >= CONFIG.minSerHolding;
    }
  } catch {
    // If we can't verify, assume they don't qualify (safe default)
    return false;
  }
}

export async function calculateDistribution(
  eligibleHolders: Holder[],
  totalEligibleBalance: number,
  tslaxToDistribute: number
): Promise<Distribution[]> {
  return eligibleHolders.map(holder => ({
    address: holder.address,
    amount: (holder.balance / totalEligibleBalance) * tslaxToDistribute
  }));
}

export async function executeAirdrop(
  connection: Connection,
  wallet: Keypair,
  distributions: Distribution[]
): Promise<AirdropResult> {
  statusBroadcaster.updateMood('airdropping');

  const txSignatures: string[] = [];
  const errors: string[] = [];
  let totalDistributed = 0;
  let successfulRecipients = 0;
  let skippedDumpers = 0;

  const tslaxMint = new PublicKey(CONFIG.tslaxMint);

  // TSLAx uses standard SPL Token program
  const TSLAX_PROGRAM_ID = TOKEN_PROGRAM_ID;

  // Get source token account (treasury's TSLAx account)
  const sourceTokenAccount = await getAssociatedTokenAddress(
    tslaxMint,
    wallet.publicKey,
    false,
    TSLAX_PROGRAM_ID
  );

  statusBroadcaster.addActivity('info', `Verifying ${distributions.length} wallets still hold ≥${CONFIG.minSerHolding.toLocaleString()} $SER...`);

  // REAL-TIME VERIFICATION: Filter out wallets that dumped after snapshot
  const verifiedDistributions: Distribution[] = [];

  for (const dist of distributions) {
    const stillHolds = await verifySerHolding(connection, dist.address);

    if (stillHolds) {
      verifiedDistributions.push(dist);
    } else {
      skippedDumpers++;
      statusBroadcaster.addActivity('info', `⚠️ Skipped ${dist.address.slice(0, 4)}...${dist.address.slice(-4)} - dumped after snapshot`);
    }
  }

  if (skippedDumpers > 0) {
    statusBroadcaster.addActivity('info', `🛡️ Blocked ${skippedDumpers} paper hand(s) from receiving airdrop`);
  }

  if (verifiedDistributions.length === 0) {
    statusBroadcaster.addActivity('info', 'No verified holders remaining for airdrop');
    return {
      success: true,
      distributed: 0,
      recipients: 0,
      skippedDumpers,
      txSignatures: [],
      errors: []
    };
  }

  // Recalculate distribution for verified holders only
  const totalVerifiedAmount = verifiedDistributions.reduce((sum, d) => sum + d.amount, 0);

  // Batch transactions (max ~5-10 transfers per tx to stay under compute limits)
  const BATCH_SIZE = 7;
  const batches: Distribution[][] = [];

  for (let i = 0; i < verifiedDistributions.length; i += BATCH_SIZE) {
    batches.push(verifiedDistributions.slice(i, i + BATCH_SIZE));
  }

  statusBroadcaster.addActivity('info', `Preparing ${batches.length} batch(es) for ${verifiedDistributions.length} verified recipients...`);

  for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
    const batch = batches[batchIndex];

    try {
      const transaction = new Transaction();
      let batchRecipients = 0;

      for (const dist of batch) {
        const recipientPubkey = new PublicKey(dist.address);

        // Get or create recipient's token account
        const recipientTokenAccount = await getAssociatedTokenAddress(
          tslaxMint,
          recipientPubkey,
          false,
          TSLAX_PROGRAM_ID
        );

        // Check if account exists, if not we need to create it
        const accountInfo = await connection.getAccountInfo(recipientTokenAccount);

        if (!accountInfo) {
          // Account doesn't exist - we need to create it
          transaction.add(
            createAssociatedTokenAccountInstruction(
              wallet.publicKey, // payer
              recipientTokenAccount, // ata
              recipientPubkey, // owner
              tslaxMint, // mint
              TSLAX_PROGRAM_ID
            )
          );
        }

        // Add transfer instruction
        // Convert to smallest unit (assuming 6 decimals for TSLAx)
        const amountInSmallestUnit = Math.floor(dist.amount * 1e6);

        if (amountInSmallestUnit > 0) {
          transaction.add(
            createTransferInstruction(
              sourceTokenAccount,
              recipientTokenAccount,
              wallet.publicKey,
              amountInSmallestUnit,
              [],
              TSLAX_PROGRAM_ID
            )
          );
          batchRecipients++;
        }
      }

      // Send transaction
      const signature = await sendAndConfirmTransaction(
        connection,
        transaction,
        [wallet],
        { commitment: 'confirmed' }
      );

      txSignatures.push(signature);

      // Count successful
      const batchTotal = batch.reduce((sum, d) => sum + d.amount, 0);
      totalDistributed += batchTotal;
      successfulRecipients += batchRecipients;

      statusBroadcaster.addActivity('airdrop', `Batch ${batchIndex + 1}/${batches.length} sent: ${batchRecipients} recipients, ${batchTotal.toLocaleString()} TSLAx`, signature);

      // Small delay between batches to avoid rate limits
      if (batchIndex < batches.length - 1) {
        await new Promise(r => setTimeout(r, 500));
      }

    } catch (error: unknown) {
      const errorMsg = `Batch ${batchIndex + 1} failed: ${error instanceof Error ? error.message : String(error)}`;
      errors.push(errorMsg);
      statusBroadcaster.addActivity('error', errorMsg);
    }
  }

  const success = errors.length === 0;

  if (success) {
    statusBroadcaster.updateMood('celebrating');
    statusBroadcaster.recordAirdrop(totalDistributed, successfulRecipients);
  }

  return {
    success,
    distributed: totalDistributed,
    recipients: successfulRecipients,
    skippedDumpers,
    txSignatures,
    errors
  };
}

export async function getTslaxBalance(
  connection: Connection,
  wallet: PublicKey
): Promise<number> {
  try {
    const tslaxMint = new PublicKey(CONFIG.tslaxMint);
    // TSLAx uses standard SPL Token
    const tokenAccount = await getAssociatedTokenAddress(
      tslaxMint,
      wallet,
      false,
      TOKEN_PROGRAM_ID
    );
    const accountInfo = await connection.getTokenAccountBalance(tokenAccount);
    return Number(accountInfo.value.uiAmount) || 0;
  } catch {
    return 0;
  }
}
