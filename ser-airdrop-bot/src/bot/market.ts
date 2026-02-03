// DexScreener API Integration for $SER Market Data
import { CONFIG } from './config.js';

export interface MarketData {
  price: number;           // USD price per token
  marketCap: number;       // Total market cap in USD
  volume24h: number;       // 24h trading volume in USD
  priceChange24h: number;  // 24h price change percentage
  liquidity: number;       // Liquidity in USD
  pairAddress: string;     // DEX pair address
  dexId: string;           // Which DEX (raydium, orca, etc.)
  lastUpdated: number;     // Timestamp
}

interface DexScreenerPair {
  chainId: string;
  dexId: string;
  url: string;
  pairAddress: string;
  baseToken: {
    address: string;
    name: string;
    symbol: string;
  };
  quoteToken: {
    address: string;
    name: string;
    symbol: string;
  };
  priceNative: string;
  priceUsd: string;
  txns: {
    h24: { buys: number; sells: number };
  };
  volume: {
    h24: number;
  };
  priceChange: {
    h24: number;
  };
  liquidity: {
    usd: number;
  };
  fdv: number;  // Fully diluted valuation (market cap)
}

interface DexScreenerResponse {
  schemaVersion: string;
  pairs: DexScreenerPair[] | null;
}

const DEXSCREENER_API = 'https://api.dexscreener.com/latest/dex/tokens';

// Cache to avoid rate limiting
let marketCache: MarketData | null = null;
let lastFetchTime = 0;
const CACHE_DURATION = 30000; // 30 seconds cache

export async function fetchMarketData(): Promise<MarketData | null> {
  // Return cached data if fresh
  if (marketCache && Date.now() - lastFetchTime < CACHE_DURATION) {
    return marketCache;
  }

  // Need SER mint address to fetch data
  if (!CONFIG.serMint || CONFIG.serMint === 'YOUR_SER_MINT_ADDRESS_HERE') {
    return null;
  }

  try {
    const response = await fetch(`${DEXSCREENER_API}/${CONFIG.serMint}`, {
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      console.error(`DexScreener API error: ${response.status}`);
      return marketCache; // Return stale cache on error
    }

    const data: DexScreenerResponse = await response.json();

    if (!data.pairs || data.pairs.length === 0) {
      console.log('No pairs found on DexScreener for $SER');
      return null;
    }

    // Get the pair with highest liquidity (most reliable price)
    const bestPair = data.pairs.reduce((best, current) => {
      return (current.liquidity?.usd || 0) > (best.liquidity?.usd || 0) ? current : best;
    });

    marketCache = {
      price: parseFloat(bestPair.priceUsd) || 0,
      marketCap: bestPair.fdv || 0,
      volume24h: bestPair.volume?.h24 || 0,
      priceChange24h: bestPair.priceChange?.h24 || 0,
      liquidity: bestPair.liquidity?.usd || 0,
      pairAddress: bestPair.pairAddress,
      dexId: bestPair.dexId,
      lastUpdated: Date.now(),
    };

    lastFetchTime = Date.now();
    return marketCache;

  } catch (error) {
    console.error('Failed to fetch market data:', error instanceof Error ? error.message : String(error));
    return marketCache; // Return stale cache on error
  }
}

export function getMarketPhase(marketCap: number): string {
  if (marketCap >= 1000000) return '$1M+ 🚀';
  if (marketCap >= 750000) return '$750K';
  if (marketCap >= 500000) return '$500K';
  if (marketCap >= 250000) return '$250K';
  if (marketCap >= 100000) return '$100K';
  if (marketCap >= 50000) return '$50K';
  if (marketCap >= 25000) return '$25K';
  if (marketCap >= 10000) return '$10K';
  if (marketCap >= 5000) return 'LAUNCHED';
  return 'PRE-LAUNCH';
}

export function formatPrice(price: number): string {
  if (price === 0) return '$0.00';
  if (price < 0.00000001) return `$${price.toExponential(2)}`;
  if (price < 0.0001) return `$${price.toFixed(8)}`;
  if (price < 0.01) return `$${price.toFixed(6)}`;
  if (price < 1) return `$${price.toFixed(4)}`;
  return `$${price.toFixed(2)}`;
}

export function formatMarketCap(mc: number): string {
  if (mc >= 1000000) return `$${(mc / 1000000).toFixed(2)}M`;
  if (mc >= 1000) return `$${(mc / 1000).toFixed(1)}K`;
  return `$${mc.toFixed(0)}`;
}
