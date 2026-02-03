import {
  Connection,
  Keypair,
  VersionedTransaction,
  LAMPORTS_PER_SOL,
  PublicKey
} from '@solana/web3.js';
import https from 'https';
import { CONFIG } from './config.js';
import { statusBroadcaster } from './status.js';

// Jupiter API for graduated tokens (authenticated endpoint)
const JUPITER_QUOTE_API = 'https://api.jup.ag/swap/v1/quote';
const JUPITER_SWAP_API = 'https://api.jup.ag/swap/v1/swap';
const JUPITER_API_KEY = process.env.JUPITER_API_KEY || '2297f1bd-5700-4805-914f-4025d34abd95';

// Native SOL mint
const SOL_MINT = 'So11111111111111111111111111111111111111112';

// Helper function for HTTPS requests (more reliable than fetch in some Node environments)
function httpsRequest(url: string, options: { method?: string; headers?: Record<string, string>; body?: string } = {}): Promise<any> {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const reqOptions = {
      hostname: urlObj.hostname,
      port: 443,
      path: urlObj.pathname + urlObj.search,
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        ...options.headers,
      },
    };

    const req = https.request(reqOptions, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          if (res.statusCode && res.statusCode >= 400) {
            reject(new Error(`HTTP ${res.statusCode}: ${data}`));
          } else {
            resolve(JSON.parse(data));
          }
        } catch (e) {
          reject(new Error(`Failed to parse response: ${data.slice(0, 200)}`));
        }
      });
    });

    req.on('error', (e) => reject(e));
    req.setTimeout(30000, () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });

    if (options.body) {
      req.write(options.body);
    }
    req.end();
  });
}

interface SwapResult {
  success: boolean;
  tslaxAmount?: number;
  txSignature?: string;
  error?: string;
}

export async function swapSolToTslax(
  connection: Connection,
  wallet: Keypair,
  solAmount: number
): Promise<SwapResult> {
  try {
    statusBroadcaster.updateMood('buying');
    statusBroadcaster.addActivity('info', `🔄 Starting swap: ${solAmount.toFixed(4)} SOL → TSLAx`);

    // Convert SOL to lamports
    const inputAmount = Math.floor(solAmount * LAMPORTS_PER_SOL);

    // Step 1: Get quote from Jupiter
    const quoteUrl = `${JUPITER_QUOTE_API}?inputMint=${SOL_MINT}&outputMint=${CONFIG.tslaxMint}&amount=${inputAmount}&slippageBps=500`;

    statusBroadcaster.addActivity('info', `📊 Getting Jupiter quote...`);

    const quoteData = await httpsRequest(quoteUrl, {
      headers: { 'x-api-key': JUPITER_API_KEY },
    });

    if (!quoteData || quoteData.error) {
      throw new Error(`Jupiter quote failed: ${quoteData?.error || 'No route found'}`);
    }

    const expectedOutput = Number(quoteData.outAmount) / 1e6; // TSLAx decimals
    statusBroadcaster.addActivity('info', `📈 Quote: ~${expectedOutput.toLocaleString()} TSLAx`);

    // Step 2: Get swap transaction
    const swapData = await httpsRequest(JUPITER_SWAP_API, {
      method: 'POST',
      headers: { 'x-api-key': JUPITER_API_KEY },
      body: JSON.stringify({
        quoteResponse: quoteData,
        userPublicKey: wallet.publicKey.toString(),
        wrapAndUnwrapSol: true,
        dynamicComputeUnitLimit: true,
        prioritizationFeeLamports: 100000, // 0.0001 SOL priority fee
      }),
    });

    if (!swapData.swapTransaction) {
      throw new Error('No swap transaction returned');
    }

    // Deserialize transaction
    const swapTransactionBuf = Buffer.from(swapData.swapTransaction, 'base64');
    const tx = VersionedTransaction.deserialize(swapTransactionBuf);

    statusBroadcaster.addActivity('info', `📝 Transaction received, signing...`);

    // Sign and send
    tx.sign([wallet]);

    const txSignature = await connection.sendTransaction(tx, {
      skipPreflight: false,
      preflightCommitment: 'confirmed',
      maxRetries: 3,
    });

    statusBroadcaster.addActivity('info', `📤 Swap tx sent: ${txSignature.slice(0, 8)}...`);

    // Confirm transaction
    const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash();
    await connection.confirmTransaction({
      signature: txSignature,
      blockhash,
      lastValidBlockHeight,
    });

    // Get TSLAx balance to calculate amount received
    const tslaxMint = new PublicKey(CONFIG.tslaxMint);
    let tslaxAmount = 0;

    try {
      const tokenAccounts = await connection.getTokenAccountsByOwner(wallet.publicKey, { mint: tslaxMint });
      if (tokenAccounts.value.length > 0) {
        const balanceInfo = await connection.getTokenAccountBalance(tokenAccounts.value[0].pubkey);
        tslaxAmount = balanceInfo.value.uiAmount || 0;
      }
    } catch (e) {
      // Ignore balance check errors
    }

    statusBroadcaster.addActivity('swap', `✅ Swapped ${solAmount.toFixed(4)} SOL → ${tslaxAmount.toLocaleString()} TSLAx!`, txSignature);
    statusBroadcaster.recordSwap(solAmount);

    return {
      success: true,
      tslaxAmount,
      txSignature
    };

  } catch (error: unknown) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    statusBroadcaster.updateMood('error');
    statusBroadcaster.addActivity('error', `❌ Swap failed: ${errorMsg}`);

    return {
      success: false,
      error: errorMsg
    };
  }
}

export async function getSolBalance(connection: Connection, wallet: PublicKey): Promise<number> {
  const balance = await connection.getBalance(wallet);
  return balance / LAMPORTS_PER_SOL;
}
