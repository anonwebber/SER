// Demo server with REAL DATA from DexScreener + Simulated Airdrops
import express from 'express';
import helmet from 'helmet';
import { WebSocketServer } from 'ws';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const CONFIG = {
  SPR_MINT: '9He1uoAy4JVn5NGzGhokBLbhAvnEVLu1D9qFQRkMpump',
  PENGUIN_MINT: '8Jx8AAHj86wbQgUTjGuj6GTTL5Ps3cqxKRTvpaJApump',
  TREASURY_WALLET: 'Gfe4t8GmpnrYJYe14dNc2YmQ5oYjPZiuVT32G8zN2MZC',
  HELIUS_API_KEY: 'ffc54226-c74b-4016-9202-0fa023e38c47',
  MIN_HOLDING: 100000,
};

const RPC_URL = `https://mainnet.helius-rpc.com/?api-key=${CONFIG.HELIUS_API_KEY}`;

const app = express();
const PORT = 3000;

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

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

app.get('/api/status', (req, res) => {
  res.json(status);
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.listen(PORT, () => {
  console.log(`
  ╔═══════════════════════════════════════════════════════════╗
  ║                                                           ║
  ║   🐧 SPR AIRDROP BOT - REAL DATA DEMO 🐧                  ║
  ║                                                           ║
  ║   Live market data from DexScreener!                      ║
  ║   Simulated airdrop cycles every 10 minutes               ║
  ║                                                           ║
  ╚═══════════════════════════════════════════════════════════╝

  📊 Dashboard: http://localhost:${PORT}
  🔌 WebSocket: ws://localhost:${PORT + 1}

  Loading real data...
  `);
});

// WebSocket server
const wss = new WebSocketServer({ port: PORT + 1 });

// Status object
const status = {
  mood: 'idle',
  thought: '🐧 Loading real market data...',
  timestamp: Date.now(),
  // Market (real from DexScreener)
  marketCap: 0,
  price: 0,
  volume24h: 0,
  priceChange24h: 0,
  phase: 'LOADING...',
  // Treasury (real from Solana)
  treasurySol: 0,
  treasuryPenguin: 0,
  // Holders (real from Helius)
  eligibleHolders: 0,
  totalHolders: 0,
  // Airdrop stats (simulated)
  lastAirdropTime: null,
  lastAirdropAmount: 0,
  lastAirdropRecipients: 0,
  totalAirdrops: 0,
  totalPenguinDistributed: 0,
  // Timing
  nextAirdropTime: Date.now() + 10 * 60 * 1000,
  recentActivity: []
};

// Random hype messages - GenZ/Web3 slang with penguin vibes
const hypeMessages = [
  "bro penguin just ate that dip like fish fr fr",
  "sellers rn: 🤡 penguins rn: 😎",
  "140 buys vs 73 sells... penguins dont sell they huddle",
  "that 2 SOL sell got absorbed faster than a penguin catches fish",
  "paperhands fumbled the bag... again... waddle of shame",
  "some mf really sold before airdrop im crying 💀",
  "penguin colony growing... 350 holders now eligible",
  "chart looking like a penguin sliding down ice rn wheee",
  "whale just belly flopped in with 15 SOL lmaoo",
  "ratio of buys to sells is actually insane rn",
  "imagine not holding when airdrops hit every 10 min",
  "sellers getting absolutely penguin'd",
  "this dip aint even a dip its a penguin nap",
  "someone dumped 5 SOL and it got eaten in 2 seconds flat",
  "penguins together strong... bears in shambles",
  "bro really sold at the bottom cant make this up",
  "new penguin just waddled into the colony gm gm",
  "that green candle got me feeling some type of way",
  "seller thought he did something lol chart said nah",
  "accumulation szn... smart penguins know whats up",
  "volume pumping like a penguin heartbeat rn",
  "whoever sold at 250k mc... you good bro?",
  "this the calmest penguin huddle ive ever seen",
  "buys absolutely farming sells rn not even close",
  "penguin math: hold + time = wagmi",
  "that sell wall got demolished like its nothing",
  "diamond flippers activated cant stop wont stop",
  "300+ eligible holders all just vibing fr",
  "some paper flipper just got rekt watch the chart",
  "penguins sliding into profit while bears crying",
  "this consolidation tighter than a penguin huddle",
  "bruh 24h volume at 4M and we just getting started",
  "seller fumbled... buyer secured... simple as",
  "that bounce was cleaner than a penguins tuxedo",
  "weak flippers shaken out... only real ones left",
  "chart doing the penguin waddle up stairs rn",
  "imagine panic selling a token with auto airdrops lol",
  "new holder alert another penguin joined the squad",
  "that buy just made sellers look goofy af",
  "penguin protocol: buy dip receive airdrop repeat",
  "paperhands down bad while we up good",
  "liquidity deeper than antarctic ocean fr",
  "bid wall looking thicc like a emperor penguin",
  "seller tried to dump... got absolutely bodied",
  "this is what peak penguin performance looks like",
  "green candles stacking like penguins in a colony",
  "ratio check: 2746 buys to 2131 sells... we winning",
  "that dip got bought up before i could even screenshot",
  "penguin tip: cant get rekt if you never sell",
  "sellers punching air rn while we collecting airdrops",
  "another one bites the ice... paper flipper eliminated",
  "chart said nah to that sell pressure lmaooo",
];

// Penguin thoughts
const thoughts = {
  idle: [
    "Waddle waddle... watching the market...",
    "Real data, real penguins, real gains 🐧",
    "DexScreener says we're cooking!",
    "Holders are diamond flippers 💎",
  ],
  cooking: [
    "🍳 Swapping SOL → $PENGUIN...",
    "Jupiter, take the wheel!",
    "Chef Penguin in the kitchen!",
  ],
  counting: [
    "🔍 Scanning blockchain for holders...",
    "Checking who has ≥100K $SPR...",
    "Real-time verification in progress...",
  ],
  airdropping: [
    "🪂 AIRDROP IN PROGRESS!!!",
    "$PENGUIN raining from the sky!",
    "Sending rewards to diamond flippers!",
  ],
  celebrating: [
    "🎉 AIRDROP COMPLETE!!!",
    "GG! See you in 10 minutes!",
    "Diamond flippers stay winning!",
  ],
};

function getThought(mood) {
  const list = thoughts[mood] || thoughts.idle;
  return list[Math.floor(Math.random() * list.length)];
}

function getPhase(mc) {
  if (mc >= 1000000) return '$1M+ 🚀';
  if (mc >= 750000) return '$750K';
  if (mc >= 500000) return '$500K';
  if (mc >= 250000) return '$250K';
  if (mc >= 100000) return '$100K';
  if (mc >= 50000) return '$50K';
  if (mc >= 25000) return '$25K';
  if (mc >= 10000) return '$10K';
  if (mc > 0) return 'LAUNCHED';
  return 'PRE-LAUNCH';
}

function addActivity(type, message) {
  const newActivity = {
    timestamp: Date.now(),
    type,
    message
  };

  // Separate events and hype messages
  const isHype = type === 'hype';
  const events = status.recentActivity.filter(a => a.type !== 'hype');
  const hypes = status.recentActivity.filter(a => a.type === 'hype');

  if (isHype) {
    // Add hype, keep max 5 hype messages
    hypes.unshift(newActivity);
    if (hypes.length > 5) hypes.pop();
  } else {
    // Add event, keep max 5 event messages
    events.unshift(newActivity);
    if (events.length > 5) events.pop();
  }

  // Merge and sort by timestamp, keep total max 10
  status.recentActivity = [...events, ...hypes]
    .sort((a, b) => b.timestamp - a.timestamp)
    .slice(0, 10);

  broadcast({ type: 'activity', data: newActivity });
}

function addRandomHype() {
  const msg = hypeMessages[Math.floor(Math.random() * hypeMessages.length)];
  addActivity('hype', msg);
}

function broadcast(data) {
  const msg = JSON.stringify(data);
  wss.clients.forEach(client => {
    if (client.readyState === 1) {
      client.send(msg);
    }
  });
}

function broadcastStatus() {
  broadcast({ type: 'status', data: status });
}

// Fetch real market data from DexScreener
async function fetchMarketData() {
  try {
    const response = await fetch(`https://api.dexscreener.com/latest/dex/tokens/${CONFIG.SPR_MINT}`);
    const data = await response.json();

    if (data.pairs && data.pairs.length > 0) {
      const bestPair = data.pairs.reduce((best, current) =>
        (current.liquidity?.usd || 0) > (best.liquidity?.usd || 0) ? current : best
      );

      status.price = parseFloat(bestPair.priceUsd) || 0;
      status.marketCap = bestPair.fdv || 0;
      status.volume24h = bestPair.volume?.h24 || 0;
      status.priceChange24h = bestPair.priceChange?.h24 || 0;
      status.phase = getPhase(status.marketCap);

      broadcast({ type: 'market', data: {
        marketCap: status.marketCap,
        price: status.price,
        volume24h: status.volume24h,
        priceChange24h: status.priceChange24h,
        phase: status.phase
      }});
    }
  } catch (e) {
    console.error('DexScreener error:', e.message);
  }
}

// Fetch real treasury balances
async function fetchTreasuryBalances() {
  try {
    // SOL balance
    const solRes = await fetch(RPC_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0', id: 1,
        method: 'getBalance',
        params: [CONFIG.TREASURY_WALLET]
      })
    });
    const solData = await solRes.json();
    status.treasurySol = (solData.result?.value || 0) / 1e9;

    // $PENGUIN balance
    try {
      const pengRes = await fetch(RPC_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0', id: 1,
          method: 'getTokenAccountsByOwner',
          params: [CONFIG.TREASURY_WALLET, { mint: CONFIG.PENGUIN_MINT }, { encoding: 'jsonParsed' }]
        })
      });
      const pengData = await pengRes.json();
      if (pengData.result?.value?.length > 0) {
        status.treasuryPenguin = pengData.result.value[0].account.data.parsed.info.tokenAmount.uiAmount || 0;
      }
    } catch { status.treasuryPenguin = 0; }

    broadcast({ type: 'treasury', data: { sol: status.treasurySol, penguin: status.treasuryPenguin }});
  } catch (e) {
    console.error('Treasury fetch error:', e.message);
  }
}

// Fetch real holder count
async function fetchHolders() {
  try {
    const response = await fetch(RPC_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 'snapshot',
        method: 'getTokenAccounts',
        params: { mint: CONFIG.SPR_MINT, limit: 1000, options: { showZeroBalance: false } }
      })
    });
    const data = await response.json();
    const accounts = data.result?.token_accounts || [];

    const holders = accounts.map(a => ({ balance: Number(a.amount) / 1e6 }));
    status.totalHolders = holders.length;
    status.eligibleHolders = holders.filter(h => h.balance >= CONFIG.MIN_HOLDING).length;

    broadcast({ type: 'holders', data: { eligible: status.eligibleHolders, total: status.totalHolders }});
  } catch (e) {
    console.error('Holders fetch error:', e.message);
  }
}

// Simulate airdrop cycle - matches actual tokenomics flow
async function simulateAirdropCycle() {
  await fetchTreasuryBalances();

  // Step 1: Detect SOL in treasury (creator fee from pump.fun)
  if (status.treasurySol < 0.5) {
    const feeReceived = 1.5 + Math.random() * 2.5; // 1.5-4 SOL simulated
    status.treasurySol = feeReceived;
    addActivity('claim', `creator fee just landed... ${feeReceived.toFixed(4)} SOL from pump.fun volume`);
    broadcast({ type: 'treasury', data: { sol: status.treasurySol, penguin: status.treasuryPenguin }});
    broadcastStatus();
    await sleep(2500);
  }

  // Step 2: Calculate the 70/30 split
  status.mood = 'cooking';
  status.thought = getThought('cooking');
  const swapAmount = status.treasurySol * 0.7;
  const reserveAmount = status.treasurySol * 0.3;
  addActivity('info', `splitting the bag: ${swapAmount.toFixed(4)} SOL going to jupiter, ${reserveAmount.toFixed(4)} SOL for flywheel + gas`);
  broadcastStatus();
  await sleep(2000);

  // Step 3: Execute swap on Jupiter
  addActivity('swap', `swapping ${swapAmount.toFixed(4)} SOL → $PENGUIN on jupiter...`);
  broadcastStatus();
  await sleep(2500);

  const penguinReceived = Math.floor(swapAmount * (130000 + Math.random() * 40000));
  status.treasuryPenguin = penguinReceived;
  status.treasurySol = reserveAmount;
  addActivity('swap', `swap filled... ${penguinReceived.toLocaleString()} $PENGUIN secured at ${(swapAmount * 150 / penguinReceived * 1e6).toFixed(2)} USD per 1M`);
  broadcast({ type: 'treasury', data: { sol: status.treasurySol, penguin: status.treasuryPenguin }});
  broadcastStatus();
  await sleep(2000);

  // Step 4: Snapshot all $SPR holders via Helius
  status.mood = 'counting';
  status.thought = getThought('counting');
  addActivity('info', `hitting helius api for $SPR holder snapshot...`);
  broadcastStatus();
  await sleep(2000);

  await fetchHolders();
  addActivity('info', `snapshot locked: ${status.totalHolders} total wallets, ${status.eligibleHolders} holding 100K+ $SPR`);
  broadcastStatus();
  await sleep(1500);

  if (status.eligibleHolders === 0) {
    status.mood = 'idle';
    status.thought = 'bruh nobody holding 100K... actually ngmi';
    addActivity('info', `zero eligible wallets... airdrop cancelled this cycle`);
    broadcastStatus();
    return;
  }

  // Step 5: Real-time verification before airdrop
  addActivity('info', `verifying all ${status.eligibleHolders} wallets still holding... no dumpers getting through`);
  broadcastStatus();
  await sleep(2000);

  // Step 6: Check for dumpers (simulate 0-4 paper hands)
  const dumpersFound = Math.floor(Math.random() * 5);
  const verifiedHolders = status.eligibleHolders - dumpersFound;

  if (dumpersFound > 0) {
    addActivity('info', `lmao caught ${dumpersFound} wallet${dumpersFound > 1 ? 's' : ''} that dumped after snapshot... blocked and ratio'd`);
    broadcastStatus();
    await sleep(1500);
  } else {
    addActivity('info', `all ${status.eligibleHolders} wallets still diamond handing... zero paper flippers`);
    broadcastStatus();
    await sleep(1500);
  }

  // Step 7: Calculate pro-rata distribution
  const totalEligibleBal = verifiedHolders * (180000 + Math.random() * 120000); // simulated
  addActivity('info', `calculating pro-rata: ${penguinReceived.toLocaleString()} $PENGUIN ÷ ${totalEligibleBal.toLocaleString()} $SPR`);
  broadcastStatus();
  await sleep(1500);

  // Step 8: Execute airdrop in batches
  status.mood = 'airdropping';
  status.thought = getThought('airdropping');
  const batchCount = Math.ceil(verifiedHolders / 7);
  addActivity('airdrop', `executing airdrop: ${verifiedHolders} wallets across ${batchCount} batches...`);
  broadcastStatus();
  await sleep(2000);

  // Show batch progress
  for (let i = 1; i <= Math.min(batchCount, 4); i++) {
    const walletsInBatch = Math.min(7, verifiedHolders - (i - 1) * 7);
    addActivity('airdrop', `batch ${i}/${batchCount} sent: ${walletsInBatch} wallets confirmed onchain`);
    broadcastStatus();
    await sleep(1200);
  }
  if (batchCount > 4) {
    addActivity('airdrop', `batches 5-${batchCount} all confirmed... txs went through clean`);
    await sleep(1000);
  }

  // Step 9: Final results
  status.mood = 'celebrating';
  status.thought = getThought('celebrating');
  status.totalAirdrops++;
  status.totalPenguinDistributed += penguinReceived;
  status.lastAirdropTime = Date.now();
  status.lastAirdropAmount = penguinReceived;
  status.lastAirdropRecipients = verifiedHolders;

  let resultMsg = `airdrop #${status.totalAirdrops} complete: ${penguinReceived.toLocaleString()} $PENGUIN → ${verifiedHolders} diamond flippers`;
  if (dumpersFound > 0) {
    resultMsg += ` | ${dumpersFound} dumper${dumpersFound > 1 ? 's' : ''} got nothing`;
  }
  addActivity('airdrop', resultMsg);

  status.treasuryPenguin = 0;
  broadcast({ type: 'treasury', data: { sol: status.treasurySol, penguin: 0 }});
  broadcast({ type: 'airdrop', data: {
    amount: status.lastAirdropAmount,
    recipients: status.lastAirdropRecipients,
    totalAirdrops: status.totalAirdrops,
    totalDistributed: status.totalPenguinDistributed
  }});
  broadcastStatus();

  await sleep(2500);

  // Back to idle, set next airdrop timer
  status.mood = 'idle';
  status.thought = getThought('idle');
  status.nextAirdropTime = Date.now() + 10 * 60 * 1000;
  broadcast({ type: 'nextAirdrop', data: { timestamp: status.nextAirdropTime }});
  addActivity('info', `next airdrop cycle in 10 min... keep holding frens`);
  broadcastStatus();
}

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

// WebSocket connection handler
wss.on('connection', (ws) => {
  console.log('🐧 Dashboard connected!');
  ws.send(JSON.stringify({ type: 'status', data: status }));
});

// Initialize and start
async function init() {
  console.log('📊 Fetching real market data...');
  await fetchMarketData();
  console.log(`   Market Cap: $${status.marketCap.toLocaleString()}`);
  console.log(`   Price: $${status.price}`);

  console.log('💰 Fetching treasury balances...');
  await fetchTreasuryBalances();
  console.log(`   SOL: ${status.treasurySol.toFixed(4)}`);
  console.log(`   $PENGUIN: ${status.treasuryPenguin}`);

  console.log('👥 Fetching holder count...');
  await fetchHolders();
  console.log(`   Eligible: ${status.eligibleHolders} / ${status.totalHolders}`);

  status.mood = 'idle';
  status.thought = getThought('idle');
  addActivity('info', `penguin bot online and locked in... ${status.eligibleHolders} holders bout to eat`);
  addActivity('info', `mc sitting at $${status.marketCap.toLocaleString()} rn... ${status.phase} and climbing`);
  addActivity('info', `real data no cap... dexscreener hooked up lets get it`);

  console.log('\n✅ Ready! Open http://localhost:3000\n');
  console.log('⏰ First simulated airdrop in 30 seconds...\n');

  // Update real data every 30 seconds
  setInterval(fetchMarketData, 30000);
  setInterval(fetchTreasuryBalances, 30000);

  // Random hype messages every 5-15 seconds
  function scheduleHype() {
    const delay = 5000 + Math.random() * 10000; // 5-15 seconds
    setTimeout(() => {
      addRandomHype();
      scheduleHype();
    }, delay);
  }
  scheduleHype();

  // Simulate airdrop after 30 seconds, then every 2 minutes for demo
  setTimeout(simulateAirdropCycle, 30000);
  setInterval(simulateAirdropCycle, 2 * 60 * 1000); // Every 2 min for demo (not 10)
}

init();
