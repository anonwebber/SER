import { WebSocketServer, WebSocket } from 'ws';
import { Server } from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { ElonMood, getRandomThought } from './elon-thoughts.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const STATS_FILE = path.join(__dirname, '../../data/stats.json');

interface PersistedStats {
  totalSolSwapped: number;
  totalAirdrops: number;
  totalTslaxDistributed: number;
  totalSolClaimed: number;
}

export interface BotStatus {
  mood: ElonMood;
  thought: string;
  timestamp: number;

  // Market data (from DexScreener)
  marketCap: number;
  price: number;
  volume24h: number;
  priceChange24h: number;
  phase: string;

  // Treasury stats
  treasurySol: number;
  treasuryTslax: number;

  // Airdrop stats
  lastAirdropTime: number | null;
  lastAirdropAmount: number;
  lastAirdropRecipients: number;
  totalAirdrops: number;
  totalTslaxDistributed: number;
  totalSolSwapped: number;
  totalSolClaimed: number;

  // Holder stats
  eligibleHolders: number;
  totalHolders: number;

  // Next airdrop
  nextAirdropTime: number | null;

  // Activity log
  recentActivity: ActivityLog[];
}

export interface ActivityLog {
  timestamp: number;
  type: 'swap' | 'airdrop' | 'claim' | 'error' | 'info';
  message: string;
  txSignature?: string;
}

class StatusBroadcaster {
  private wss: WebSocketServer | null = null;
  private clients: Set<WebSocket> = new Set();

  constructor() {
    // Load persisted stats on startup
    this.loadPersistedStats();
  }

  private loadPersistedStats() {
    // Initial values - starting fresh for new token launch
    const INITIAL_SOL_SWAPPED = 0;
    const INITIAL_AIRDROPS = 0;
    const INITIAL_TSLAX_DISTRIBUTED = 0;
    const INITIAL_SOL_CLAIMED = 0;

    try {
      if (fs.existsSync(STATS_FILE)) {
        const data = JSON.parse(fs.readFileSync(STATS_FILE, 'utf-8')) as PersistedStats;
        this.status.totalSolSwapped = data.totalSolSwapped || INITIAL_SOL_SWAPPED;
        this.status.totalAirdrops = data.totalAirdrops || INITIAL_AIRDROPS;
        this.status.totalTslaxDistributed = data.totalTslaxDistributed || INITIAL_TSLAX_DISTRIBUTED;
        this.status.totalSolClaimed = data.totalSolClaimed || INITIAL_SOL_CLAIMED;
        console.log(`📊 Loaded persisted stats: ${this.status.totalSolSwapped.toFixed(2)} SOL swapped, ${this.status.totalSolClaimed.toFixed(2)} SOL claimed, ${this.status.totalAirdrops} airdrops`);
      } else {
        // No file yet, use initial values
        this.status.totalSolSwapped = INITIAL_SOL_SWAPPED;
        this.status.totalAirdrops = INITIAL_AIRDROPS;
        this.status.totalTslaxDistributed = INITIAL_TSLAX_DISTRIBUTED;
        this.status.totalSolClaimed = INITIAL_SOL_CLAIMED;
        console.log(`📊 Using initial stats (fresh start)`);
      }
    } catch (e) {
      // Error loading, use initial values
      this.status.totalSolSwapped = INITIAL_SOL_SWAPPED;
      this.status.totalAirdrops = INITIAL_AIRDROPS;
      this.status.totalTslaxDistributed = INITIAL_TSLAX_DISTRIBUTED;
      this.status.totalSolClaimed = INITIAL_SOL_CLAIMED;
      console.log('Using initial stats (load error)');
    }
  }

  private savePersistedStats() {
    try {
      const dir = path.dirname(STATS_FILE);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      const data: PersistedStats = {
        totalSolSwapped: this.status.totalSolSwapped,
        totalAirdrops: this.status.totalAirdrops,
        totalTslaxDistributed: this.status.totalTslaxDistributed,
        totalSolClaimed: this.status.totalSolClaimed,
      };
      fs.writeFileSync(STATS_FILE, JSON.stringify(data, null, 2));
    } catch (e) {
      console.error('Failed to save stats:', e);
    }
  }

  private status: BotStatus = {
    mood: 'idle',
    thought: getRandomThought('idle'),
    timestamp: Date.now(),
    // Market data
    marketCap: 0,
    price: 0,
    volume24h: 0,
    priceChange24h: 0,
    phase: 'PRE-LAUNCH',
    // Treasury
    treasurySol: 0,
    treasuryTslax: 0,
    // Airdrop stats
    lastAirdropTime: null,
    lastAirdropAmount: 0,
    lastAirdropRecipients: 0,
    totalAirdrops: 0,
    totalTslaxDistributed: 0,
    totalSolSwapped: 0,
    totalSolClaimed: 0,
    // Holders
    eligibleHolders: 0,
    totalHolders: 0,
    nextAirdropTime: null,
    recentActivity: []
  };

  // Idle thought rotation
  private idleInterval: NodeJS.Timeout | null = null;

  init(server: Server) {
    // Attach WebSocket to existing HTTP server (same port)
    this.wss = new WebSocketServer({ server });

    this.wss.on('connection', (ws) => {
      this.clients.add(ws);
      // Send current status immediately
      ws.send(JSON.stringify({ type: 'status', data: this.status }));

      ws.on('close', () => {
        this.clients.delete(ws);
      });
    });

    // Rotate idle thoughts every 10 seconds when idle
    this.idleInterval = setInterval(() => {
      if (this.status.mood === 'idle') {
        this.updateThought('idle');
      }
    }, 10000);

    console.log(`🚀 WebSocket attached to HTTP server`);
  }

  private broadcast(data: Record<string, unknown>) {
    const message = JSON.stringify(data);
    this.clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    });
  }

  updateMood(mood: ElonMood) {
    this.status.mood = mood;
    this.status.thought = getRandomThought(mood);
    this.status.timestamp = Date.now();
    this.broadcast({ type: 'status', data: this.status });
  }

  updateThought(mood: ElonMood) {
    this.status.thought = getRandomThought(mood);
    this.status.timestamp = Date.now();
    this.broadcast({ type: 'thought', data: { thought: this.status.thought } });
  }

  updateTreasury(sol: number, tslax: number) {
    this.status.treasurySol = sol;
    this.status.treasuryTslax = tslax;
    this.broadcast({ type: 'treasury', data: { sol, tslax } });
  }

  updateMarket(marketCap: number, price: number, volume24h: number, priceChange24h: number, phase: string) {
    this.status.marketCap = marketCap;
    this.status.price = price;
    this.status.volume24h = volume24h;
    this.status.priceChange24h = priceChange24h;
    this.status.phase = phase;
    this.broadcast({ type: 'market', data: { marketCap, price, volume24h, priceChange24h, phase } });
  }

  updateHolders(eligible: number, total: number) {
    this.status.eligibleHolders = eligible;
    this.status.totalHolders = total;
    this.broadcast({ type: 'holders', data: { eligible, total } });
  }

  recordSwap(solAmount: number) {
    this.status.totalSolSwapped += solAmount;
    this.savePersistedStats();
    this.broadcast({ type: 'swap_recorded', data: {
      solAmount,
      totalSolSwapped: this.status.totalSolSwapped
    }});
  }

  recordClaim(solAmount: number) {
    this.status.totalSolClaimed += solAmount;
    this.savePersistedStats();
    this.broadcast({ type: 'claim_recorded', data: {
      solAmount,
      totalSolClaimed: this.status.totalSolClaimed,
      reserveAmount: this.getReserveAmount()
    }});
  }

  // 30% of all claimed SOL should NEVER be touched
  getReserveAmount(): number {
    return this.status.totalSolClaimed * 0.30;
  }

  // Calculate how much SOL is available for swapping (respecting 30% reserve)
  getAvailableToSwap(currentBalance: number): number {
    const reserve = this.getReserveAmount();
    const available = currentBalance - reserve;
    return Math.max(0, available);
  }

  getTotalSolClaimed(): number {
    return this.status.totalSolClaimed;
  }

  recordAirdrop(amount: number, recipients: number) {
    this.status.lastAirdropTime = Date.now();
    this.status.lastAirdropAmount = amount;
    this.status.lastAirdropRecipients = recipients;
    this.status.totalAirdrops++;
    this.status.totalTslaxDistributed += amount;
    this.savePersistedStats();
    this.broadcast({ type: 'airdrop', data: {
      amount,
      recipients,
      totalAirdrops: this.status.totalAirdrops,
      totalDistributed: this.status.totalTslaxDistributed
    }});
  }

  setNextAirdrop(timestamp: number) {
    this.status.nextAirdropTime = timestamp;
    this.broadcast({ type: 'nextAirdrop', data: { timestamp } });
  }

  addActivity(type: ActivityLog['type'], message: string, txSignature?: string) {
    const activity: ActivityLog = {
      timestamp: Date.now(),
      type,
      message,
      txSignature
    };

    this.status.recentActivity.unshift(activity);
    // Keep only last 50 activities
    if (this.status.recentActivity.length > 50) {
      this.status.recentActivity = this.status.recentActivity.slice(0, 50);
    }

    this.broadcast({ type: 'activity', data: activity });
  }

  getStatus(): BotStatus {
    return this.status;
  }
}

export const statusBroadcaster = new StatusBroadcaster();
