import 'dotenv/config';

export const CONFIG = {
  // Wallet & RPC
  treasuryPrivateKey: process.env.TREASURY_PRIVATE_KEY || '',
  rpcUrl: process.env.RPC_URL || 'https://api.mainnet-beta.solana.com',
  heliusApiKey: process.env.HELIUS_API_KEY || '',

  // Token mints
  serMint: process.env.SER_MINT || '',
  tslaxMint: process.env.TSLAX_MINT || 'XsDoVfqeBukxuZHWhdvWHBhgEHjGNst4MLodqsJHzoB',

  // Airdrop settings
  minSerHolding: Number(process.env.MIN_SER_HOLDING) || 50000,
  airdropIntervalMinutes: Number(process.env.AIRDROP_INTERVAL_MINUTES) || 10,

  // Economics - 70% swap to TSLAx, 30% stays in treasury
  treasuryReserve: Number(process.env.TREASURY_RESERVE) || 0.30, // 30% stays as SOL
  swapPercent: Number(process.env.SWAP_PERCENT) || 0.70, // 70% swapped to TSLAx

  // Dashboard - Railway sets PORT automatically
  dashboardPort: Number(process.env.PORT) || Number(process.env.DASHBOARD_PORT) || 3000,

  // Minimum SOL to trigger swap (to avoid dust swaps)
  minSolToSwap: Number(process.env.MIN_SOL_TO_SWAP) || 0.1,

  // Jupiter settings
  slippageBps: 300, // 3% slippage
};

export function validateConfig(): { valid: boolean; demoMode: boolean } {
  const criticalMissing = ['treasuryPrivateKey', 'serMint'].filter(
    key => !CONFIG[key as keyof typeof CONFIG] ||
           CONFIG[key as keyof typeof CONFIG] === 'your_base58_private_key' ||
           CONFIG[key as keyof typeof CONFIG] === 'your_ser_mint_from_pumpfun'
  );

  const heliusMissing = !CONFIG.heliusApiKey || CONFIG.heliusApiKey === 'your_helius_api_key';

  if (heliusMissing) {
    console.error('❌ Missing HELIUS_API_KEY - required for holder snapshots');
    return { valid: false, demoMode: false };
  }

  if (criticalMissing.length > 0) {
    console.log(`⚠️  Running in DEMO MODE - missing: ${criticalMissing.join(', ')}`);
    console.log('   Dashboard will show market data but no real airdrops.');
    return { valid: true, demoMode: true };
  }

  return { valid: true, demoMode: false };
}
