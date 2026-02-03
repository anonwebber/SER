# 🐧 Strategic Penguin Reserve - Airdrop Bot

Automated $PENGUIN airdrop bot for $SPR token holders on Solana.

## How It Works

```
┌─────────────────────────────────────────────────────────────┐
│                    THE PENGUIN PIPELINE                      │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│   1. You claim creator fees from pump.fun (manual)          │
│   2. Bot detects SOL → swaps to $PENGUIN (auto)             │
│   3. Every 15 min: airdrop to holders ≥100K $SPR (auto)     │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

## Setup

### 1. Install dependencies

```bash
cd spr-airdrop-bot
npm install
```

### 2. Configure environment

```bash
cp .env.example .env
```

Edit `.env` with your values:

```env
# Your treasury wallet private key (base58)
TREASURY_PRIVATE_KEY=your_private_key_here

# Get free API key from helius.dev
HELIUS_API_KEY=your_helius_api_key
RPC_URL=https://mainnet.helius-rpc.com/?api-key=YOUR_KEY

# Fill in after launching $SPR on pump.fun
SPR_MINT=your_spr_mint_address

# $PENGUIN token address
PENGUIN_MINT=8Jx8AAHj86wbQgUTjGuj6GTTL5Ps3cqxKRTvpaJApump

# Settings
MIN_SPR_HOLDING=100000
AIRDROP_INTERVAL_MINUTES=15
CREATOR_CUT=0.15
```

### 3. Get a Helius API Key (Free)

1. Go to https://helius.dev
2. Sign up for free
3. Create a new project
4. Copy your API key

### 4. Run the bot

```bash
npm run dev
```

## Dashboard

Open http://localhost:3000 to see:

- 🐧 Live penguin with mood animations
- 💭 Funny status messages
- 📊 Treasury balances
- ⏰ Countdown to next airdrop
- 📜 Real-time activity log

## Token Economics

| Allocation | % | Purpose |
|------------|---|---------|
| Buy $PENGUIN | 80% | Distributed to holders |
| Creator cut | 15% | Your earnings |
| Gas reserve | 5% | Transaction fees |

## Eligibility

- Must hold ≥100,000 $SPR
- Distribution is pro-rata based on holdings
- Airdrops run every 15 minutes

## Commands

```bash
npm run dev          # Run bot + dashboard (development)
npm run bot:dev      # Run bot only
npm run dashboard:dev # Run dashboard only
npm run build        # Build for production
npm start            # Run production build
```

## The Flow

1. **You**: Claim fees from pump.fun dashboard
2. **Bot**: Detects SOL deposit → Shows "cooking" animation
3. **Bot**: Swaps SOL to $PENGUIN via Jupiter
4. **Bot**: Every 15 min, snapshots eligible holders
5. **Bot**: Airdrops $PENGUIN pro-rata
6. **Dashboard**: Shows celebration animation 🎉

## Troubleshooting

### "Invalid private key format"
- Make sure your private key is base58 encoded
- Export from Phantom: Settings → Security → Export Private Key

### "No eligible holders"
- Ensure SPR_MINT is correct
- Holders need ≥100K $SPR

### "Swap failed"
- Check RPC_URL is valid
- Ensure treasury has enough SOL for gas

## Security Notes

- ⚠️ Keep your `.env` file secret
- ⚠️ Never commit private keys
- ⚠️ Use a dedicated treasury wallet

---

**"Penguins don't fly. They don't sell. They huddle."** 🐧
