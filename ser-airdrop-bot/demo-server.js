// Demo server with FULL SIMULATION - Launch to $1M Market Cap
import express from 'express';
import helmet from 'helmet';
import { WebSocketServer } from 'ws';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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
  res.json(demoStatus);
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.listen(PORT, () => {
  console.log(`
  ╔═══════════════════════════════════════════════════════════╗
  ║                                                           ║
  ║   🐧 SPR AIRDROP BOT - FULL SIMULATION DEMO 🐧            ║
  ║                                                           ║
  ║   Watch the token grow from LAUNCH to $1M Market Cap!     ║
  ║                                                           ║
  ╚═══════════════════════════════════════════════════════════╝

  📊 Dashboard: http://localhost:${PORT}

  Simulation starts in 3 seconds...
  `);
});

// WebSocket server for live updates
const wss = new WebSocketServer({ port: PORT + 1 });

// Simulation phases - from launch to $1M
const PHASES = [
  { name: 'LAUNCH', mc: 5000, holders: 15, volume: 2000, duration: 8000 },
  { name: '$10K', mc: 10000, holders: 25, volume: 8000, duration: 6000 },
  { name: '$25K', mc: 25000, holders: 45, volume: 20000, duration: 6000 },
  { name: '$50K', mc: 50000, holders: 80, volume: 45000, duration: 6000 },
  { name: '$100K', mc: 100000, holders: 150, volume: 100000, duration: 6000 },
  { name: '$250K', mc: 250000, holders: 300, volume: 250000, duration: 6000 },
  { name: '$500K', mc: 500000, holders: 500, volume: 400000, duration: 6000 },
  { name: '$750K', mc: 750000, holders: 700, volume: 600000, duration: 6000 },
  { name: '$1M 🎉', mc: 1000000, holders: 1000, volume: 800000, duration: 10000 },
];

// Demo status with market cap
const demoStatus = {
  mood: 'idle',
  thought: '🐧 Preparing for launch...',
  timestamp: Date.now(),
  // Market stats
  marketCap: 0,
  price: 0,
  volume24h: 0,
  phase: 'PRE-LAUNCH',
  // Treasury
  treasurySol: 0,
  treasuryPenguin: 0,
  // Airdrop stats
  lastAirdropTime: null,
  lastAirdropAmount: 0,
  lastAirdropRecipients: 0,
  totalAirdrops: 0,
  totalPenguinDistributed: 0,
  // Holders
  eligibleHolders: 0,
  totalHolders: 0,
  // Timing
  nextAirdropTime: Date.now() + 10 * 60 * 1000,
  recentActivity: []
};

// Penguin thoughts for each mood
const thoughts = {
  idle: [
    "Waddle waddle... waiting for SOL...",
    "Penguins don't sell. They huddle.",
    "The early penguin gets the $PENGUIN",
    "Just vibing in the Antarctic of Solana...",
  ],
  watching: [
    "👀 I see SOL incoming...",
    "My penguin senses are tingling...",
    "SOL detected! Engaging protocols...",
  ],
  cooking: [
    "🍳 COOKING TIME! Swapping SOL → $PENGUIN",
    "Chef Penguin in the kitchen!",
    "Jupiter, take the wheel!",
    "SOL goes in, $PENGUIN comes out!",
  ],
  counting: [
    "🔍 Counting $SPR holders...",
    "*adjusts monocle* Who's eligible?",
    "Taking snapshot of diamond flippers!",
  ],
  airdropping: [
    "🪂 AIRDROP ENGAGED!!!",
    "FREE PENGUIN FOR EVERYONE!!!",
    "Sending $PENGUIN to the real ones...",
    "Parachutes deployed!",
  ],
  celebrating: [
    "🎉 AIRDROP COMPLETE!!!",
    "WE ALL EATING GOOD TONIGHT!",
    "GG EZ! Diamond flippers win!",
    "Mission accomplished!",
  ],
  milestone: [
    "🚀 NEW MILESTONE REACHED!",
    "WE'RE PUMPING!!!",
    "LFG!!! 🚀🐧",
  ]
};

function getThought(mood) {
  const list = thoughts[mood] || thoughts.idle;
  return list[Math.floor(Math.random() * list.length)];
}

function addActivity(type, message) {
  demoStatus.recentActivity.unshift({
    timestamp: Date.now(),
    type,
    message
  });
  if (demoStatus.recentActivity.length > 20) {
    demoStatus.recentActivity.pop();
  }
}

// Broadcast to all clients
function broadcast(data) {
  const msg = JSON.stringify(data);
  wss.clients.forEach(client => {
    if (client.readyState === 1) {
      client.send(msg);
    }
  });
}

function broadcastStatus() {
  broadcast({ type: 'status', data: demoStatus });
}

// Generate random eligible holders (30-50% of total are eligible)
function generateHolders(total) {
  const eligiblePercent = 0.3 + Math.random() * 0.2;
  return Math.floor(total * eligiblePercent);
}

// Simulation state
let currentPhaseIndex = -1;
let simulationRunning = false;

async function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

async function simulatePhase(phase, phaseIndex) {
  const isLaunch = phaseIndex === 0;
  const isFinal = phaseIndex === PHASES.length - 1;

  // 1. Milestone announcement
  demoStatus.mood = 'milestone';
  demoStatus.phase = phase.name;
  demoStatus.marketCap = phase.mc;
  demoStatus.price = phase.mc / 1000000000;
  demoStatus.volume24h = phase.volume;
  demoStatus.totalHolders = phase.holders;
  demoStatus.eligibleHolders = generateHolders(phase.holders);

  if (isLaunch) {
    demoStatus.thought = "🚀 TOKEN LAUNCHED ON PUMP.FUN!";
    addActivity('info', `🚀 $SPR LAUNCHED! Market Cap: $${phase.mc.toLocaleString()}`);
  } else {
    demoStatus.thought = `🎯 ${phase.name} MARKET CAP REACHED!`;
    addActivity('info', `🎯 Milestone: ${phase.name} MC! Volume: $${phase.volume.toLocaleString()}`);
  }
  broadcastStatus();
  await sleep(2000);

  // 2. Creator fee claimed
  const creatorFee = phase.volume * 0.01; // 1% creator fee
  const solReceived = creatorFee / 150; // SOL at ~$150

  demoStatus.mood = 'watching';
  demoStatus.thought = getThought('watching');
  demoStatus.treasurySol = solReceived;
  addActivity('claim', `💰 Claimed ${solReceived.toFixed(4)} SOL creator fee from pump.fun`);
  broadcastStatus();
  await sleep(2000);

  // 3. Swap SOL to $PENGUIN (70% swap, 30% reserve)
  const swapAmount = solReceived * 0.70;
  const reserveAmount = solReceived * 0.30;
  const penguinPerSol = 150000 + Math.random() * 50000;
  const penguinReceived = Math.floor(swapAmount * penguinPerSol);

  demoStatus.mood = 'cooking';
  demoStatus.thought = getThought('cooking');
  addActivity('info', `📊 Split: ${swapAmount.toFixed(4)} SOL (70%) swap, ${reserveAmount.toFixed(4)} SOL (30%) reserve`);
  broadcastStatus();
  await sleep(1500);

  demoStatus.treasurySol = reserveAmount;
  demoStatus.treasuryPenguin = penguinReceived;
  addActivity('swap', `🔄 Swapped ${swapAmount.toFixed(4)} SOL → ${penguinReceived.toLocaleString()} $PENGUIN`);
  broadcastStatus();
  await sleep(2000);

  // 4. Take snapshot
  demoStatus.mood = 'counting';
  demoStatus.thought = getThought('counting');
  addActivity('info', `📸 Snapshot: ${demoStatus.eligibleHolders} eligible holders (≥100K $SPR)`);
  broadcastStatus();
  await sleep(2000);

  // 5. Airdrop
  demoStatus.mood = 'airdropping';
  demoStatus.thought = getThought('airdropping');
  addActivity('airdrop', `🪂 Airdropping ${penguinReceived.toLocaleString()} $PENGUIN to ${demoStatus.eligibleHolders} holders...`);
  broadcastStatus();
  await sleep(2000);

  // 6. Celebrate
  demoStatus.mood = 'celebrating';
  demoStatus.thought = getThought('celebrating');
  demoStatus.totalAirdrops++;
  demoStatus.totalPenguinDistributed += penguinReceived;
  demoStatus.lastAirdropTime = Date.now();
  demoStatus.lastAirdropAmount = penguinReceived;
  demoStatus.lastAirdropRecipients = demoStatus.eligibleHolders;
  demoStatus.treasuryPenguin = 0;

  addActivity('airdrop', `🎉 Airdrop #${demoStatus.totalAirdrops} complete! ${penguinReceived.toLocaleString()} $PENGUIN → ${demoStatus.eligibleHolders} holders`);
  broadcastStatus();

  if (isFinal) {
    await sleep(3000);
    demoStatus.thought = "🏆 $1M MARKET CAP! WE MADE IT FRENS!";
    addActivity('info', `🏆 CONGRATULATIONS! $SPR reached $1,000,000 Market Cap!`);
    addActivity('info', `📊 Total Airdrops: ${demoStatus.totalAirdrops} | Total Distributed: ${demoStatus.totalPenguinDistributed.toLocaleString()} $PENGUIN`);
    broadcastStatus();
    await sleep(5000);
  } else {
    await sleep(2000);
  }

  // 7. Back to idle
  demoStatus.mood = 'idle';
  demoStatus.thought = getThought('idle');
  broadcastStatus();
}

async function runSimulation() {
  if (simulationRunning) return;
  simulationRunning = true;

  // Reset state
  demoStatus.marketCap = 0;
  demoStatus.price = 0;
  demoStatus.volume24h = 0;
  demoStatus.phase = 'PRE-LAUNCH';
  demoStatus.treasurySol = 0;
  demoStatus.treasuryPenguin = 0;
  demoStatus.totalAirdrops = 0;
  demoStatus.totalPenguinDistributed = 0;
  demoStatus.eligibleHolders = 0;
  demoStatus.totalHolders = 0;
  demoStatus.lastAirdropTime = null;
  demoStatus.recentActivity = [];

  console.log('\n🐧 Starting simulation: Launch → $1M Market Cap\n');

  // Pre-launch
  demoStatus.mood = 'idle';
  demoStatus.thought = '🥚 Token launching in 3... 2... 1...';
  addActivity('info', '🥚 Preparing token launch on pump.fun...');
  broadcastStatus();
  await sleep(3000);

  // Run through all phases
  for (let i = 0; i < PHASES.length; i++) {
    currentPhaseIndex = i;
    await simulatePhase(PHASES[i], i);

    // Wait before next phase (shorter wait for demo)
    if (i < PHASES.length - 1) {
      await sleep(1000);
    }
  }

  // Loop the simulation
  console.log('\n🔄 Simulation complete! Restarting in 10 seconds...\n');
  await sleep(10000);
  simulationRunning = false;
  runSimulation();
}

wss.on('connection', (ws) => {
  console.log('🐧 Dashboard connected!');
  ws.send(JSON.stringify({ type: 'status', data: demoStatus }));
});

// Start simulation after 3 seconds
setTimeout(() => {
  runSimulation();
}, 3000);

// Update countdown timer
setInterval(() => {
  demoStatus.nextAirdropTime = Date.now() + 10 * 60 * 1000;
}, 60000);

console.log('🐧 Demo server starting...');
