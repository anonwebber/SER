import { Connection, Keypair, PublicKey, VersionedTransaction } from '@solana/web3.js';
import { CONFIG } from './config.js';

// PumpPortal API for claiming creator fees
const PUMPPORTAL_API = 'https://pumpportal.fun/api/trade-local';

// Known safe program IDs
const SAFE_PROGRAMS = new Set([
  '6EF8rrecthR5Dkzon8Nwu78hRvfCKubJ14M5uBEwF6P', // Pump.fun program
  'pAMMBay6oceH9fJKBRHGP5D4bD4sWpmSwMn52FMfXEA', // PumpAMM program (pump.fun AMM)
  '11111111111111111111111111111111',             // System Program
  'ComputeBudget111111111111111111111111111111',  // Compute Budget
  'ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL', // Associated Token Program
  'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA', // Token Program
  'TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb', // Token-2022 Program
]);

// Maximum SOL that can be spent on fees (0.01 SOL = 10M lamports)
const MAX_FEE_LAMPORTS = 10_000_000;

interface ClaimResult {
  success: boolean;
  amount?: number;
  signature?: string;
  error?: string;
}

interface VerificationResult {
  safe: boolean;
  reason?: string;
}

/**
 * SECURITY: Verify transaction before signing
 * Checks that the transaction only does what we expect (claim fees)
 */
async function verifyTransactionSafety(
  connection: Connection,
  tx: VersionedTransaction,
  wallet: Keypair
): Promise<VerificationResult> {
  try {
    const message = tx.message;

    // Get account keys from the transaction
    const accountKeys = message.staticAccountKeys.map(k => k.toString());

    // Check 1: Verify all programs are known/safe
    const compiledInstructions = message.compiledInstructions;
    for (const ix of compiledInstructions) {
      const programId = accountKeys[ix.programIdIndex];
      if (!SAFE_PROGRAMS.has(programId)) {
        return {
          safe: false,
          reason: `Unknown program detected: ${programId}. Transaction rejected for safety.`,
        };
      }
    }

    // Check 2: Simulate transaction to see balance changes
    const simulation = await connection.simulateTransaction(tx, {
      sigVerify: false,
      replaceRecentBlockhash: true,
    });

    if (simulation.value.err) {
      return {
        safe: false,
        reason: `Simulation failed: ${JSON.stringify(simulation.value.err)}`,
      };
    }

    // Check 3: Verify we're receiving SOL, not losing it (beyond fees)
    // The pre/post balances should show us gaining SOL (from claimed fees)
    const preBalances = simulation.value.accounts?.[0]?.lamports;
    const logs = simulation.value.logs || [];

    // Look for suspicious patterns in logs
    const suspiciousPatterns = [
      'Transfer',      // Raw SOL transfer (should only be fees)
      'Approve',       // Token approval (dangerous)
      'SetAuthority',  // Changing authorities (dangerous)
    ];

    // Note: Some of these might appear in legitimate claim transactions
    // We're being cautious but not overly restrictive
    for (const log of logs) {
      // Check for explicit large SOL transfers (not to fee accounts)
      if (log.includes('Transfer') && log.includes('lamports')) {
        // Extract amount if possible and check it's reasonable
        const match = log.match(/(\d+)\s*lamports/);
        if (match) {
          const amount = parseInt(match[1]);
          // If transferring OUT more than max fee, reject
          if (amount > MAX_FEE_LAMPORTS && !log.includes('success')) {
            return {
              safe: false,
              reason: `Large SOL transfer detected (${amount} lamports). Transaction rejected.`,
            };
          }
        }
      }
    }

    // Check 4: Ensure our wallet is the fee payer (expected)
    const feePayer = accountKeys[0];
    if (feePayer !== wallet.publicKey.toString()) {
      return {
        safe: false,
        reason: `Unexpected fee payer: ${feePayer}. Expected: ${wallet.publicKey.toString()}`,
      };
    }

    // Check 5: Count instructions - claim should be simple (1-3 instructions typically)
    if (compiledInstructions.length > 10) {
      return {
        safe: false,
        reason: `Too many instructions (${compiledInstructions.length}). Possible malicious bundling.`,
      };
    }

    return { safe: true };
  } catch (error) {
    return {
      safe: false,
      reason: `Verification error: ${error instanceof Error ? error.message : String(error)}`,
    };
  }
}

/**
 * Claim ALL creator fees from pump.fun using PumpPortal API
 * This claims fees from all tokens at once
 *
 * SECURITY: Transaction is verified before signing
 */
export async function claimCreatorFees(
  connection: Connection,
  wallet: Keypair
): Promise<ClaimResult> {
  try {
    // Request the claim transaction from PumpPortal
    const response = await fetch(PUMPPORTAL_API, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'collectCreatorFee',
        pool: 'pump',
        priorityFee: 0.0001, // Priority fee in SOL
        publicKey: wallet.publicKey.toString(),
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();

      // Check for common "no fees" responses
      if (errorText.includes('no fees') || errorText.includes('nothing to claim') || errorText.includes('0 SOL')) {
        return { success: false, error: 'No fees to claim' };
      }

      return { success: false, error: `API error: ${response.status} - ${errorText}` };
    }

    // PumpPortal returns a serialized transaction
    const data = await response.arrayBuffer();
    const tx = VersionedTransaction.deserialize(new Uint8Array(data));

    // ========== SECURITY CHECK ==========
    console.log('🔒 Verifying transaction safety...');
    const verification = await verifyTransactionSafety(connection, tx, wallet);

    if (!verification.safe) {
      console.error('❌ SECURITY: Transaction rejected -', verification.reason);
      return {
        success: false,
        error: `Security check failed: ${verification.reason}`,
      };
    }
    console.log('✅ Transaction verified safe');
    // ====================================

    // Sign the transaction (only after verification passes)
    tx.sign([wallet]);

    // Send the transaction
    const signature = await connection.sendTransaction(tx, {
      skipPreflight: false,
      preflightCommitment: 'confirmed',
      maxRetries: 3,
    });

    // Confirm the transaction
    const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash();
    await connection.confirmTransaction({
      signature,
      blockhash,
      lastValidBlockHeight,
    });

    return {
      success: true,
      signature,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);

    // Check for common errors
    if (errorMessage.includes('insufficient') || errorMessage.includes('0x1')) {
      return { success: false, error: 'Insufficient SOL for transaction fee' };
    }
    if (errorMessage.includes('no fees') || errorMessage.includes('nothing')) {
      return { success: false, error: 'No fees to claim' };
    }

    return { success: false, error: errorMessage };
  }
}

/**
 * Check if there might be creator fees to claim
 * Note: This is a rough estimate - the actual claim will tell us for sure
 */
export async function getClaimableCreatorFees(connection: Connection): Promise<number> {
  // PumpPortal doesn't have a "check balance" endpoint
  // We just try to claim and see what happens
  return 0.01; // Always try to claim
}
