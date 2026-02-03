import { CONFIG } from './config.js';
import { statusBroadcaster } from './status.js';

export interface Holder {
  address: string;
  balance: number;
}

export interface SnapshotResult {
  allHolders: Holder[];
  eligibleHolders: Holder[];
  totalEligibleBalance: number;
}

// Helius API response types
interface HeliusTokenAccount {
  owner: string;
  amount: string | number;
}

interface ParsedTokenAccountInfo {
  owner: string;
  tokenAmount: {
    uiAmount: number | null;
  };
}

interface ParsedTokenAccount {
  account: {
    data: {
      parsed: {
        info: ParsedTokenAccountInfo;
      };
    };
  };
}

export async function getTokenHolders(): Promise<SnapshotResult> {
  statusBroadcaster.updateMood('counting');
  statusBroadcaster.addActivity('info', 'Taking snapshot of $SER holders...');

  try {
    // Use Helius DAS API to get token holders with pagination
    let allTokenAccounts: HeliusTokenAccount[] = [];
    let cursor: string | undefined = undefined;
    let pageCount = 0;
    const MAX_PAGES = 20; // Safety limit

    do {
      const params: any = {
        mint: CONFIG.serMint,
        limit: 1000, // Helius max is 1000
        options: {
          showZeroBalance: false
        }
      };

      if (cursor) {
        params.cursor = cursor;
      }

      const response = await fetch(`https://mainnet.helius-rpc.com/?api-key=${CONFIG.heliusApiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 'ser-snapshot',
          method: 'getTokenAccounts',
          params
        })
      });

      if (!response.ok) {
        throw new Error(`Helius API error: ${response.statusText}`);
      }

      const data = await response.json();

      if (data.error) {
        throw new Error(`Helius error: ${data.error.message}`);
      }

      const tokenAccounts = data.result?.token_accounts || [];
      allTokenAccounts = allTokenAccounts.concat(tokenAccounts);

      // Get cursor for next page
      cursor = data.result?.cursor;
      pageCount++;

    } while (cursor && pageCount < MAX_PAGES);

    const tokenAccounts = allTokenAccounts;

    // Parse all holders
    const allHolders: Holder[] = tokenAccounts.map((account: HeliusTokenAccount) => ({
      address: account.owner,
      balance: Number(account.amount) / 1e6 // Assuming 6 decimals, adjust if different
    }));

    // Filter eligible holders (≥50K $SER)
    const eligibleHolders = allHolders.filter(h => h.balance >= CONFIG.minSerHolding);

    // Calculate total eligible balance for pro-rata
    const totalEligibleBalance = eligibleHolders.reduce((sum, h) => sum + h.balance, 0);

    statusBroadcaster.updateHolders(eligibleHolders.length, allHolders.length);
    statusBroadcaster.addActivity('info', `Snapshot: ${eligibleHolders.length} eligible holders (≥${CONFIG.minSerHolding.toLocaleString()} $SER) out of ${allHolders.length} total`);

    return {
      allHolders,
      eligibleHolders,
      totalEligibleBalance
    };

  } catch (error: unknown) {
    statusBroadcaster.updateMood('error');
    statusBroadcaster.addActivity('error', `Snapshot failed: ${error instanceof Error ? error.message : String(error)}`);
    throw error;
  }
}

// Alternative method using Helius searchAssets if getTokenAccounts doesn't work
export async function getTokenHoldersAlt(): Promise<SnapshotResult> {
  statusBroadcaster.updateMood('counting');

  try {
    let allHolders: Holder[] = [];
    let page = 1;
    let hasMore = true;

    while (hasMore) {
      const response = await fetch(`https://api.helius.xyz/v0/token-metadata?api-key=${CONFIG.heliusApiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mintAccounts: [CONFIG.serMint],
          includeOffChain: false
        })
      });

      // This is a simplified version - you might need to paginate through
      // the actual holder data using a different endpoint
      break;
    }

    // Fallback: Use getProgramAccounts via RPC (more expensive but works)
    const rpcResponse = await fetch(CONFIG.rpcUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method: 'getProgramAccounts',
        params: [
          'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA', // Token Program
          {
            encoding: 'jsonParsed',
            filters: [
              { dataSize: 165 }, // Token account size
              { memcmp: { offset: 0, bytes: CONFIG.serMint } } // Mint address
            ]
          }
        ]
      })
    });

    const rpcData = await rpcResponse.json();
    const accounts = rpcData.result || [];

    allHolders = accounts.map((acc: ParsedTokenAccount) => ({
      address: acc.account.data.parsed.info.owner,
      balance: Number(acc.account.data.parsed.info.tokenAmount.uiAmount) || 0
    })).filter((h: Holder) => h.balance > 0);

    const eligibleHolders = allHolders.filter(h => h.balance >= CONFIG.minSerHolding);
    const totalEligibleBalance = eligibleHolders.reduce((sum, h) => sum + h.balance, 0);

    statusBroadcaster.updateHolders(eligibleHolders.length, allHolders.length);

    return { allHolders, eligibleHolders, totalEligibleBalance };

  } catch (error: unknown) {
    statusBroadcaster.updateMood('error');
    throw error;
  }
}
