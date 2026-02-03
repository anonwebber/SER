import { Connection, Keypair } from '@solana/web3.js';
import bs58 from 'bs58';
import express from 'express';
import helmet from 'helmet';
import path from 'path';
import http from 'http';
import { fileURLToPath } from 'url';

import { CONFIG, validateConfig } from './config.js';
import { statusBroadcaster } from './status.js';
import { swapSolToTslax, getSolBalance } from './swap.js';
import { getTokenHolders } from './snapshot.js';
import { calculateDistribution, executeAirdrop, getTslaxBalance } from './airdrop.js';
import { fetchMarketData, getMarketPhase } from './market.js';
import { claimCreatorFees } from './claim.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// State
let connection: Connection;
let wallet: Keypair | null = null;
let isProcessing = false;
let demoMode = false;

// Continuous loop settings
const MIN_SOL_FOR_CYCLE = 1.0; // Trigger swap+airdrop when we have 1 SOL
const LOOP_INTERVAL_MS = 15000; // Check every 15 seconds

async function initialize() {
  console.log(`
  ╔═══════════════════════════════════════════════════════════╗
  ║                                                           ║
  ║   🚀 STRATEGIC ELON RESERVE - AIRDROP BOT 🚀              ║
  ║                                                           ║
  ║   "$SER holders don't sell. They accumulate."             ║
  ║                                                           ║
  ╚═══════════════════════════════════════════════════════════╝
  `);

  // Validate config
  const configResult = validateConfig();
  if (!configResult.valid) {
    console.error('❌ Configuration invalid. Check your environment variables.');
    process.exit(1);
  }
  demoMode = configResult.demoMode;

  // Initialize connection
  connection = new Connection(CONFIG.rpcUrl, 'confirmed');
  console.log('✅ Connected to Solana RPC');

  // Initialize wallet (only if not in demo mode)
  if (!demoMode) {
    try {
      const privateKeyBytes = bs58.decode(CONFIG.treasuryPrivateKey);
      wallet = Keypair.fromSecretKey(privateKeyBytes);
      console.log(`✅ Treasury wallet: ${wallet.publicKey.toString()}`);
    } catch (error) {
      console.error('❌ Invalid private key format');
      process.exit(1);
    }
  } else {
    console.log('⚠️  DEMO MODE: No wallet initialized - dashboard only');
  }

  // Start Express server for dashboard and attach WebSocket
  const server = startDashboardServer();

  // Initialize status broadcaster (WebSocket on same server)
  statusBroadcaster.init(server);

  // Get initial balances (only if wallet exists)
  if (wallet) {
    await updateBalances();
  }

  // Start continuous loop (only if not in demo mode)
  if (!demoMode) {
    startContinuousLoop();
  }

  // Start market data monitoring (always runs)
  startMarketMonitor();

  if (demoMode) {
    console.log(`
  🚀 Bot running in DEMO MODE!

  📊 Dashboard: http://localhost:${CONFIG.dashboardPort}
  🔌 WebSocket: ws://localhost:${CONFIG.dashboardPort} (same port)

  ⚠️  Add TREASURY_PRIVATE_KEY and SER_MINT to enable real airdrops.
  📈 Market data is live from DexScreener.
  🎬 Simulated activity running for demo purposes.
    `);
    statusBroadcaster.updateMood('idle');
    startDemoSimulation();
  } else {
    console.log(`
  🚀 Bot is now running in CONTINUOUS MODE!

  📊 Dashboard: http://localhost:${CONFIG.dashboardPort}
  🔌 WebSocket: ws://localhost:${CONFIG.dashboardPort} (same port)

  🔄 Mode: Continuous loop (claim → swap → airdrop)
  💰 Trigger threshold: ${MIN_SOL_FOR_CYCLE} SOL available
  💎 Reserve: 30% of all claimed SOL (never touched)
  👥 Min $SER to receive airdrop: ${CONFIG.minSerHolding.toLocaleString()}

  Bot will continuously:
  1. Claim creator fees from pump.fun
  2. 30% of claimed SOL goes to reserve (accumulates forever)
  3. When 70% portion reaches ${MIN_SOL_FOR_CYCLE} SOL → swap to TSLAx
  4. Immediately airdrop to holders
  5. Repeat!
    `);
    statusBroadcaster.updateMood('idle');
  }
}

function startDashboardServer(): http.Server {
  const app = express();

  // Security headers
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'"],
        styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
        fontSrc: ["'self'", "https://fonts.gstatic.com"],
        imgSrc: ["'self'", "data:", "https:"],
        connectSrc: ["'self'", "ws:", "wss:"],
      },
    },
  }));

  // Serve static files from public directory
  app.use(express.static(path.join(__dirname, '../../public')));

  // API endpoint for current status
  app.get('/api/status', (req, res) => {
    res.json(statusBroadcaster.getStatus());
  });

  // Health check
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: Date.now(), demoMode });
  });

  // Serve dashboard
  app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../../public/index.html'));
  });

  // Create HTTP server (for WebSocket to attach to)
  const server = http.createServer(app);

  server.listen(CONFIG.dashboardPort, () => {
    console.log(`✅ Dashboard server running on port ${CONFIG.dashboardPort}`);
  });

  return server;
}

async function updateBalances() {
  if (!wallet) return { solBalance: 0, tslaxBalance: 0 };

  const solBalance = await getSolBalance(connection, wallet.publicKey);
  const tslaxBalance = await getTslaxBalance(connection, wallet.publicKey);

  statusBroadcaster.updateTreasury(solBalance, tslaxBalance);

  return { solBalance, tslaxBalance };
}

// ============ CONTINUOUS LOOP (No Waiting!) ============

function startContinuousLoop() {
  if (!wallet) return;

  console.log('🔄 Starting continuous loop...');
  statusBroadcaster.addActivity('info', '🔄 Continuous mode active - will claim, swap, and airdrop automatically!');

  // Run the loop
  runContinuousLoop();
}

async function runContinuousLoop() {
  while (true) {
    if (!wallet) {
      await sleep(LOOP_INTERVAL_MS);
      continue;
    }

    try {
      // Step 1: Try to claim any pending creator fees
      if (!isProcessing) {
        await tryClaimFees();
      }

      // Step 2: Check current SOL balance
      const solBalance = await getSolBalance(connection, wallet.publicKey);
      const tslaxBalance = await getTslaxBalance(connection, wallet.publicKey);
      statusBroadcaster.updateTreasury(solBalance, tslaxBalance);

      // Step 3: Calculate available SOL (respecting 30% reserve)
      const reserveAmount = statusBroadcaster.getReserveAmount();
      const availableToSwap = statusBroadcaster.getAvailableToSwap(solBalance);

      // Step 4: If we have enough AVAILABLE SOL (not touching reserve), run the full cycle
      if (availableToSwap >= MIN_SOL_FOR_CYCLE && !isProcessing) {
        console.log(`💰 Available: ${availableToSwap.toFixed(4)} SOL (Reserve: ${reserveAmount.toFixed(4)} SOL) - triggering swap + airdrop!`);
        statusBroadcaster.addActivity('info', `💰 ${availableToSwap.toFixed(4)} SOL available (${reserveAmount.toFixed(4)} SOL in reserve) - starting cycle!`);
        await runFullCycle(availableToSwap);
      }

      // Step 5: If we have TSLAx but no pending swap, airdrop it
      if (tslaxBalance > 0 && !isProcessing) {
        console.log(`🚀 Found ${tslaxBalance.toLocaleString()} TSLAx - airdropping!`);
        await runAirdropOnly();
      }

    } catch (error: unknown) {
      console.error('Loop error:', error instanceof Error ? error.message : String(error));
    }

    // Wait before next iteration
    await sleep(LOOP_INTERVAL_MS);
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function tryClaimFees() {
  if (!wallet) return;

  try {
    // Get balance BEFORE claim to calculate how much was claimed
    const balanceBefore = await getSolBalance(connection, wallet.publicKey);

    const result = await claimCreatorFees(connection, wallet);
    if (result.success) {
      // Get balance AFTER claim
      const balanceAfter = await getSolBalance(connection, wallet.publicKey);
      const claimedAmount = balanceAfter - balanceBefore;

      if (claimedAmount > 0) {
        // Record the claimed amount for reserve calculation
        statusBroadcaster.recordClaim(claimedAmount);
        statusBroadcaster.addActivity('claim', `💸 Claimed ${claimedAmount.toFixed(4)} SOL! tx: ${result.signature?.slice(0, 8)}...`);
        console.log(`✅ Claimed ${claimedAmount.toFixed(4)} SOL - tx: ${result.signature}`);
      } else {
        statusBroadcaster.addActivity('claim', `💸 Claimed creator fees! tx: ${result.signature?.slice(0, 8)}...`);
        console.log(`✅ Claimed creator fees - tx: ${result.signature}`);
      }
    }
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    if (!msg.includes('no fees') && !msg.includes('nothing')) {
      console.error('Claim error:', msg);
    }
  }
}

async function runFullCycle(availableToSwap: number) {
  if (isProcessing || !wallet) return;
  isProcessing = true;

  try {
    statusBroadcaster.updateMood('cooking');

    // Swap the ENTIRE available amount (reserve is already protected)
    // The 70/30 split is enforced by only allowing 70% of claimed SOL to be "available"
    const swapAmount = availableToSwap;
    const currentReserve = statusBroadcaster.getReserveAmount();

    statusBroadcaster.addActivity('info', `📊 Swapping ${swapAmount.toFixed(4)} SOL (30% reserve of ${currentReserve.toFixed(4)} SOL protected)`);
    console.log(`📊 Swapping ${swapAmount.toFixed(4)} SOL, reserve ${currentReserve.toFixed(4)} SOL untouched`);

    // Execute swap to TSLAx
    const swapResult = await swapSolToTslax(connection, wallet, swapAmount);

    if (!swapResult.success) {
      statusBroadcaster.addActivity('error', `❌ Swap failed: ${swapResult.error}`);
      console.error('Swap failed:', swapResult.error);
      isProcessing = false;
      statusBroadcaster.updateMood('idle');
      return;
    }

    statusBroadcaster.addActivity('swap', `🚀 Acquired ${swapResult.tslaxAmount?.toLocaleString() || 'some'} TSLAx!`);
    console.log(`✅ Swap complete! Got ${swapResult.tslaxAmount?.toLocaleString() || 'some'} TSLAx`);

    // Update balances
    await updateBalances();

    // Immediately run airdrop
    await executeAirdropCycle();

  } catch (error: unknown) {
    statusBroadcaster.updateMood('error');
    statusBroadcaster.addActivity('error', `❌ Cycle failed: ${error instanceof Error ? error.message : String(error)}`);
    console.error('Full cycle error:', error);
  }

  isProcessing = false;
  statusBroadcaster.updateMood('idle');
}

async function runAirdropOnly() {
  if (isProcessing || !wallet) return;
  isProcessing = true;

  try {
    await executeAirdropCycle();
  } catch (error) {
    console.error('Airdrop only error:', error);
  }

  isProcessing = false;
}

async function executeAirdropCycle() {
  if (!wallet) return;

  const tslaxBalance = await getTslaxBalance(connection, wallet.publicKey);

  if (tslaxBalance <= 0) {
    statusBroadcaster.addActivity('info', 'No TSLAx to distribute');
    return;
  }

  statusBroadcaster.updateMood('cooking');
  statusBroadcaster.addActivity('info', `🚀 Starting airdrop! ${tslaxBalance.toLocaleString()} TSLAx to distribute`);
  console.log(`🚀 Airdropping ${tslaxBalance.toLocaleString()} TSLAx...`);

  // Get eligible holders
  const snapshot = await getTokenHolders();

  if (snapshot.eligibleHolders.length === 0) {
    statusBroadcaster.addActivity('info', 'No eligible holders found (need ≥50K $SER)');
    console.log('No eligible holders found');
    return;
  }

  statusBroadcaster.addActivity('info', `📸 Found ${snapshot.eligibleHolders.length} eligible holders`);

  // Calculate distribution
  const distributions = await calculateDistribution(
    snapshot.eligibleHolders,
    snapshot.totalEligibleBalance,
    tslaxBalance
  );

  // Execute airdrop
  const result = await executeAirdrop(connection, wallet, distributions);

  if (result.success) {
    let message = `🎉 Airdrop complete! ${result.distributed.toLocaleString()} TSLAx → ${result.recipients} holders`;
    if (result.skippedDumpers > 0) {
      message += ` (🛡️ ${result.skippedDumpers} dumper(s) blocked)`;
    }
    statusBroadcaster.addActivity('airdrop', message);
    statusBroadcaster.recordAirdrop(result.distributed, result.recipients);
    console.log(`✅ ${message}`);
  } else {
    statusBroadcaster.addActivity('error', `Airdrop had errors: ${result.errors.join(', ')}`);
    console.error('Airdrop errors:', result.errors);
  }

  // Update balances
  await updateBalances();
}

function startMarketMonitor() {
  // Fetch market data immediately
  updateMarketData();

  // Then update every 30 seconds
  setInterval(updateMarketData, 30000);
}

async function updateMarketData() {
  try {
    const marketData = await fetchMarketData();

    if (marketData) {
      const phase = getMarketPhase(marketData.marketCap);
      statusBroadcaster.updateMarket(
        marketData.marketCap,
        marketData.price,
        marketData.volume24h,
        marketData.priceChange24h,
        phase
      );
    }
  } catch (error: unknown) {
    console.error('Market data error:', error instanceof Error ? error.message : String(error));
  }
}


// ============ DEMO MODE SIMULATION ============

const HYPE_MESSAGES = [
  "ser that 5 SOL buy just made whales take notice",
  "diamond hands only no paper hands here",
  "strategic reserve army assembling the fund grows",
  "smol dip? nah fam thats a buying opportunity",
  "holders rn: im not selling im ACCUMULATING",
  "wen lambo? nah fam wen tesla roadster",
  "paperhands getting rekt while we stack",
  "the march to valhalla continues",
  "imagine selling before the real pump lmaooo",
  "reserves dont panic reserves HODL",
  "this dip is just whales loading up frfr",
  "POV: you didnt sell and now youre based",
  "weak hands OUT strong reserves IN",
  "the chart looking like a rocket trajectory",
  "if youre reading this youre still early ser",
  "reserve check - we all still here? WAGMI",
  "sellers gonna be crying later",
  "that green candle tho chefs kiss",
  "reserve math: buy + hodl = generational wealth",
  "the flippening is coming stay comfy",
  "bears are ngmi reserves run this market",
  "just aped another bag because why not",
  "this is the way of the strategic reserve",
  "normies dont understand the reserve yet",
  "500k mcap? this is literally free money",
  "imagine not being in the strategic reserve rn",
  "the vibes in here are immaculate",
  "another day another dollar cost average",
  "slow and steady wins the race - reserve proverb",
  "chart looking THICC bullish af",
  "paper hands exit liquidity for diamond hands",
  "reserves together strong",
  "this community is actually built different",
  "not financial advice but also... accumulate more?",
  "the strategic reserve stays undefeated",
  "zoom out kings this is just the beginning",
  "accumulation phase looking beautiful",
  "whale wallet just loaded 10 SOL sheeeesh",
  "the treasury is getting thicker bullish",
  "when in doubt zoom out reserve style"
];

const EVENT_TEMPLATES = {
  deposit: (sol: number) => `💰 Detected ${sol.toFixed(2)} SOL creator fee deposit`,
  split: (swap: number, reserve: number) => `📊 70/30 Split: ${swap.toFixed(2)} SOL swap | ${reserve.toFixed(2)} SOL flywheel + gas`,
  swap: (tslax: number) => `🚀 Jupiter swap complete: acquired ${tslax.toLocaleString()} TSLAx`,
  snapshot: (holders: number) => `📸 Helius snapshot: ${holders} wallets with 50K+ $SER`,
  verify: (verified: number) => `✅ Real-time verify: ${verified} holders still diamond hands`,
  dumper: (count: number) => count > 0 ? `🛡️ Anti-dump: ${count} paper hand(s) detected and blocked` : `🛡️ Anti-dump check: all holders verified diamond`,
  airdrop: (tslax: number, holders: number) => `🎉 Airdrop complete: ${tslax.toLocaleString()} TSLAx → ${holders} holders`,
};

// Helper for demo mode
function setDemoNextAirdrop() {
  const next = new Date();
  next.setMinutes(next.getMinutes() + 2);
  next.setSeconds(0, 0);
  statusBroadcaster.setNextAirdrop(next.getTime());
}

function startDemoSimulation() {
  console.log('🎬 Starting demo simulation...');

  // Set initial demo values
  statusBroadcaster.updateTreasury(2.5, 150000);
  statusBroadcaster.updateHolders(127, 892);
  setDemoNextAirdrop();

  // Random hype messages every 4-8 seconds
  setInterval(() => {
    const msg = HYPE_MESSAGES[Math.floor(Math.random() * HYPE_MESSAGES.length)];
    statusBroadcaster.addActivity('info', msg);
  }, 4000 + Math.random() * 4000);

  // Simulate airdrop cycle every 2 minutes (for demo purposes)
  simulateAirdropCycle();
  setInterval(simulateAirdropCycle, 120000);
}

async function simulateAirdropCycle() {
  const delays = (ms: number) => new Promise(r => setTimeout(r, ms));

  // Random values for this cycle
  const solDeposit = 1 + Math.random() * 4;
  const swapAmount = solDeposit * 0.7;
  const reserveAmount = solDeposit * 0.3;
  const tslaxAcquired = Math.floor(swapAmount * 45000 + Math.random() * 10000);
  const snapshotHolders = 120 + Math.floor(Math.random() * 30);
  const verifiedHolders = snapshotHolders - Math.floor(Math.random() * 5);
  const dumpers = Math.floor(Math.random() * 4);
  const finalHolders = verifiedHolders - dumpers;

  // Step 1: Deposit detected
  statusBroadcaster.updateMood('watching');
  statusBroadcaster.addActivity('claim', EVENT_TEMPLATES.deposit(solDeposit));
  await delays(2000);

  // Step 2: 70/30 split
  statusBroadcaster.updateMood('cooking');
  statusBroadcaster.addActivity('info', EVENT_TEMPLATES.split(swapAmount, reserveAmount));
  await delays(2500);

  // Step 3: Jupiter swap
  statusBroadcaster.addActivity('swap', EVENT_TEMPLATES.swap(tslaxAcquired));
  statusBroadcaster.updateTreasury(reserveAmount + Math.random(), tslaxAcquired);
  await delays(3000);

  // Step 4: Helius snapshot
  statusBroadcaster.addActivity('info', EVENT_TEMPLATES.snapshot(snapshotHolders));
  statusBroadcaster.updateHolders(snapshotHolders, 800 + Math.floor(Math.random() * 200));
  await delays(2000);

  // Step 5: Real-time verification
  statusBroadcaster.addActivity('info', EVENT_TEMPLATES.verify(verifiedHolders));
  await delays(2000);

  // Step 6: Dumper check
  statusBroadcaster.addActivity('info', EVENT_TEMPLATES.dumper(dumpers));
  await delays(1500);

  // Step 7: Airdrop complete
  statusBroadcaster.addActivity('airdrop', EVENT_TEMPLATES.airdrop(tslaxAcquired, finalHolders));
  statusBroadcaster.recordAirdrop(tslaxAcquired, finalHolders);
  statusBroadcaster.updateMood('idle');

  // Update next airdrop time
  setDemoNextAirdrop();
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🚀 Strategic Reserve going offline... Goodbye!');
  process.exit(0);
});

// Start the bot
initialize().catch(console.error);
