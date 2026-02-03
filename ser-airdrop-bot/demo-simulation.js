// SPR Airdrop Bot - Full Lifecycle Simulation
// Simulates: Token launch → Growth → Treasury operations → Airdrops

// ANSI color codes (works in most terminals)
const colors = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  gray: '\x1b[90m',
};

const c = (color, text) => `${colors[color]}${text}${colors.reset}`;
const bold = (text) => `${colors.bold}${text}${colors.reset}`;

// Simulation config
const CONFIG = {
  tokenName: '$SPR',
  penguinToken: '$PENGUIN',
  minHolding: 100000,        // 100K $SPR minimum for airdrops
  swapPercent: 0.70,         // 70% of SOL swapped to $PENGUIN
  treasuryReserve: 0.30,     // 30% stays as SOL in treasury
  airdropIntervalMinutes: 10,
  creatorFeePercent: 1,      // 1% creator fee on pump.fun
};

// State
let state = {
  marketCap: 0,
  price: 0,
  volume24h: 0,
  holders: [],
  treasurySol: 0,
  treasuryPenguin: 0,
  totalAirdrops: 0,
  totalPenguinDistributed: 0,
  milestone: 'Pre-Launch',
  time: 0,
};

// Utility functions
const sleep = (ms) => new Promise(r => setTimeout(r, ms));
const formatNum = (n) => n.toLocaleString(undefined, { maximumFractionDigits: 2 });
const formatSol = (n) => `${n.toFixed(4)} SOL`;
const formatToken = (n, symbol) => `${formatNum(n)} ${symbol}`;

// Generate random holders
function generateHolders(count, totalSupply) {
  const holders = [];
  let remaining = totalSupply;

  for (let i = 0; i < count - 1; i++) {
    const maxShare = remaining * 0.12;
    const balance = Math.random() * maxShare;
    holders.push({
      address: `${Math.random().toString(36).slice(2, 6)}...${Math.random().toString(36).slice(2, 6)}`,
      balance: Math.floor(balance),
    });
    remaining -= balance;
  }

  holders.push({
    address: `${Math.random().toString(36).slice(2, 6)}...${Math.random().toString(36).slice(2, 6)}`,
    balance: Math.floor(remaining),
  });

  return holders.sort((a, b) => b.balance - a.balance);
}

function printHeader() {
  console.log(c('cyan', `
  ╔═══════════════════════════════════════════════════════════════════════════╗
  ║                                                                           ║
  ║   🐧 STRATEGIC PENGUIN RESERVE - AIRDROP BOT SIMULATION 🐧                ║
  ║                                                                           ║
  ║   "Penguins don't fly. They don't sell. They huddle."                     ║
  ║                                                                           ║
  ╚═══════════════════════════════════════════════════════════════════════════╝
  `));
}

function printDivider(title = '') {
  if (title) {
    console.log(c('gray', `\n  ─────────────────── `) + c('white', title) + c('gray', ` ───────────────────\n`));
  }
}

function printMilestone() {
  const milestoneColors = {
    'Pre-Launch': 'gray',
    'Launch': 'green',
    '$10K MC': 'yellow',
    '$25K MC': 'yellow',
    '$50K MC': 'yellow',
    '$100K MC': 'magenta',
    '$250K MC': 'magenta',
    '$500K MC': 'cyan',
    '$750K MC': 'cyan',
    '$1M MC': 'red',
  };

  const color = milestoneColors[state.milestone] || 'white';
  console.log(c(color, `  🎯 MILESTONE: ${state.milestone}`));
  console.log(c('gray', `  ⏱️  Simulated Time: ${state.time} minutes\n`));
}

function printMarketStats() {
  console.log(bold('  📊 MARKET STATS'));
  console.log(c('green', `     Market Cap:    $${formatNum(state.marketCap)}`));
  console.log(c('blue', `     Price:         $${state.price.toFixed(8)}`));
  console.log(c('yellow', `     24h Volume:    $${formatNum(state.volume24h)}`));
  console.log(c('gray', `     Holders:       ${state.holders.length}`));
}

function printTreasury() {
  console.log(bold('\n  🏦 TREASURY'));
  console.log(c('yellow', `     SOL Balance:      ${formatSol(state.treasurySol)}`));
  console.log(c('magenta', `     $PENGUIN Balance: ${formatNum(state.treasuryPenguin)}`));
  console.log(c('gray', `     Reserve Policy:   ${CONFIG.swapPercent * 100}% swap / ${CONFIG.treasuryReserve * 100}% hold`));
}

function printAirdropStats() {
  console.log(bold('\n  🪂 AIRDROP STATS'));
  console.log(c('cyan', `     Total Airdrops:        ${state.totalAirdrops}`));
  console.log(c('magenta', `     Total Distributed:     ${formatToken(state.totalPenguinDistributed, CONFIG.penguinToken)}`));

  const eligible = state.holders.filter(h => h.balance >= CONFIG.minHolding);
  console.log(c('green', `     Eligible Holders:      ${eligible.length} / ${state.holders.length} (≥${formatNum(CONFIG.minHolding)} ${CONFIG.tokenName})`));
}

function printTopHolders() {
  console.log(bold('\n  👥 TOP 5 HOLDERS'));
  const top5 = state.holders.slice(0, 5);
  top5.forEach((h, i) => {
    const eligible = h.balance >= CONFIG.minHolding ? c('green', '✓ ELIGIBLE') : c('red', '✗ <100K');
    console.log(c('gray', `     ${i + 1}. ${h.address}  `) + c('white', formatNum(h.balance)) + ` ${eligible}`);
  });
}

const activities = [];

function addActivity(type, message) {
  activities.unshift({ type, message, time: state.time });
  if (activities.length > 20) activities.pop();
}

function printActivity() {
  console.log(bold('\n  📜 RECENT ACTIVITY'));
  activities.slice(0, 5).forEach(a => {
    const icons = {
      claim: '💰',
      swap: '🔄',
      airdrop: '🪂',
      info: 'ℹ️ ',
      milestone: '🎯',
    };
    console.log(c('gray', `     ${icons[a.type] || '•'} ${a.message}`));
  });
}

async function simulateCreatorFee(volume) {
  const fee = volume * (CONFIG.creatorFeePercent / 100);
  const solReceived = fee / 150;

  if (solReceived > 0.01) {
    state.treasurySol += solReceived;
    addActivity('claim', `Claimed ${formatSol(solReceived)} creator fee from pump.fun`);
    return solReceived;
  }
  return 0;
}

async function simulateSwap(solAmount) {
  if (solAmount < 0.05) return;

  const swapAmount = solAmount * CONFIG.swapPercent;
  const reserveAmount = solAmount * CONFIG.treasuryReserve;

  const penguinPerSol = 150000 + Math.random() * 50000;
  const penguinReceived = swapAmount * penguinPerSol;

  state.treasurySol = reserveAmount;
  state.treasuryPenguin += penguinReceived;

  addActivity('swap', `Swapped ${formatSol(swapAmount)} → ${formatNum(penguinReceived)} $PENGUIN via Jupiter`);
  addActivity('info', `Reserved ${formatSol(reserveAmount)} in treasury (30%)`);

  return penguinReceived;
}

async function simulateAirdrop() {
  if (state.treasuryPenguin < 1000) return;

  const eligible = state.holders.filter(h => h.balance >= CONFIG.minHolding);
  if (eligible.length === 0) return;

  const totalEligibleBalance = eligible.reduce((sum, h) => sum + h.balance, 0);
  const toDistribute = state.treasuryPenguin;

  addActivity('info', `Snapshot taken! ${eligible.length} holders eligible (≥100K $SPR)`);

  const distributions = eligible.map(h => ({
    address: h.address,
    amount: (h.balance / totalEligibleBalance) * toDistribute,
  }));

  distributions.slice(0, 3).forEach(d => {
    addActivity('airdrop', `→ ${d.address}: ${formatNum(d.amount)} $PENGUIN`);
  });

  if (eligible.length > 3) {
    addActivity('airdrop', `→ ...and ${eligible.length - 3} more recipients`);
  }

  state.treasuryPenguin = 0;
  state.totalAirdrops++;
  state.totalPenguinDistributed += toDistribute;

  addActivity('airdrop', `🎉 Airdrop #${state.totalAirdrops} complete! ${formatNum(toDistribute)} $PENGUIN → ${eligible.length} holders`);
}

function render(phase) {
  console.clear();
  printHeader();
  printDivider(phase);
  printMilestone();
  printMarketStats();
  printTreasury();
  printAirdropStats();
  printTopHolders();
  printActivity();
}

async function runSimulation() {
  console.clear();
  printHeader();
  console.log(c('yellow', '\n  Starting simulation in 3 seconds...\n'));
  console.log(c('gray', '  This demo shows the full lifecycle of the SPR Airdrop Bot:\n'));
  console.log(c('white', '  1.') + c('gray', ' Token launches on pump.fun'));
  console.log(c('white', '  2.') + c('gray', ' Creator earns 1% fee on all trades'));
  console.log(c('white', '  3.') + c('gray', ' SOL flows into bot treasury'));
  console.log(c('white', '  4.') + c('gray', ' Bot swaps 70% to $PENGUIN, keeps 30% SOL'));
  console.log(c('white', '  5.') + c('gray', ' Every 10 min: snapshot holders with ≥100K $SPR'));
  console.log(c('white', '  6.') + c('gray', ' Airdrop $PENGUIN pro-rata based on holdings'));
  console.log(c('white', '  7.') + c('gray', ' Watch token grow from launch to $1M MC!'));
  await sleep(3000);

  // Phase 1: Pre-Launch
  console.clear();
  printHeader();
  printDivider('PHASE 1: PRE-LAUNCH');
  console.log(c('yellow', '  🥚 Token being created on pump.fun...\n'));
  console.log(c('gray', '     Name:            Strategic Penguin Reserve ($SPR)'));
  console.log(c('gray', '     Total Supply:    1,000,000,000'));
  console.log(c('gray', '     Creator Fee:     1% of all trades'));
  console.log(c('gray', '     Airdrop Token:   $PENGUIN'));
  console.log(c('gray', '     Airdrop Cycle:   Every 10 minutes'));
  console.log(c('gray', '     Min Holding:     100,000 $SPR to qualify'));
  console.log(c('gray', '     Treasury Split:  70% swap / 30% reserve'));
  await sleep(3000);

  // Phase 2: Launch
  state.milestone = 'Launch';
  state.marketCap = 5000;
  state.price = 0.000005;
  state.volume24h = 2000;
  state.holders = generateHolders(15, 1000000000);
  state.time = 0;

  console.clear();
  printHeader();
  printDivider('PHASE 2: LAUNCH');
  console.log(c('green', bold('  🚀 TOKEN LAUNCHED ON PUMP.FUN!\n')));
  printMilestone();
  printMarketStats();
  printTopHolders();
  addActivity('milestone', 'Token launched! $SPR is live on pump.fun');
  await sleep(3000);

  // Growth phases
  const phases = [
    { mc: 10000, milestone: '$10K MC', holders: 25, volume: 8000 },
    { mc: 25000, milestone: '$25K MC', holders: 45, volume: 20000 },
    { mc: 50000, milestone: '$50K MC', holders: 80, volume: 45000 },
    { mc: 100000, milestone: '$100K MC', holders: 150, volume: 100000 },
    { mc: 250000, milestone: '$250K MC', holders: 300, volume: 250000 },
    { mc: 500000, milestone: '$500K MC', holders: 500, volume: 400000 },
    { mc: 750000, milestone: '$750K MC', holders: 700, volume: 600000 },
    { mc: 1000000, milestone: '$1M MC', holders: 1000, volume: 800000 },
  ];

  for (const phase of phases) {
    state.time += 10;
    state.marketCap = phase.mc;
    state.milestone = phase.milestone;
    state.price = phase.mc / 1000000000;
    state.volume24h = phase.volume;
    state.holders = generateHolders(phase.holders, 1000000000);

    addActivity('milestone', `Reached ${phase.milestone}! Volume: $${formatNum(phase.volume)}`);
    render(`GROWTH: ${phase.milestone}`);
    await sleep(1500);

    // Creator fee
    await simulateCreatorFee(phase.volume);
    render('💰 CREATOR FEE CLAIMED');
    await sleep(1500);

    // Swap
    if (state.treasurySol >= 0.05) {
      await simulateSwap(state.treasurySol);
      render('🔄 SWAP EXECUTED');
      await sleep(1500);
    }

    // Airdrop
    if (state.treasuryPenguin >= 1000) {
      await simulateAirdrop();
      render('🪂 AIRDROP DISTRIBUTED');
      await sleep(2000);
    }
  }

  // Final summary
  console.clear();
  printHeader();
  printDivider('🎉 SIMULATION COMPLETE');

  console.log(c('green', bold(`
  🏆 CONGRATULATIONS! $SPR REACHED $1M MARKET CAP!
  `)));

  console.log(bold('  📊 FINAL STATS'));
  console.log(c('green', `     Final Market Cap:      $${formatNum(state.marketCap)}`));
  console.log(c('blue', `     Final Price:           $${state.price.toFixed(8)}`));
  console.log(c('yellow', `     Total Holders:         ${state.holders.length}`));

  console.log(bold('\n  🪂 AIRDROP SUMMARY'));
  console.log(c('cyan', `     Total Airdrops:        ${state.totalAirdrops}`));
  console.log(c('magenta', `     Total $PENGUIN:        ${formatNum(state.totalPenguinDistributed)}`));

  const eligible = state.holders.filter(h => h.balance >= CONFIG.minHolding);
  console.log(c('green', `     Eligible Holders:      ${eligible.length} (${((eligible.length / state.holders.length) * 100).toFixed(1)}% qualify)`));

  console.log(bold('\n  💡 ECONOMICS RECAP'));
  console.log(c('gray', `     • Every trade on pump.fun → 1% to creator`));
  console.log(c('gray', `     • Creator claims SOL → Bot treasury receives it`));
  console.log(c('gray', `     • 70% swapped to $PENGUIN via Jupiter`));
  console.log(c('gray', `     • 30% stays as SOL (gas reserve)`));
  console.log(c('gray', `     • Every 10 min: $PENGUIN distributed to holders`));
  console.log(c('gray', `     • Pro-rata: More $SPR = More $PENGUIN!`));

  console.log(c('cyan', bold(`

  🐧 "Penguins don't sell. They huddle."

  Run the real bot: npm run dev
  View dashboard: http://localhost:3000

  `)));
}

runSimulation().catch(console.error);
