// Vercel Serverless Function - Demo Status API
const thoughts = {
  idle: [
    "Waddle waddle... waiting for SOL to drop...",
    "I'm just standing here... menacingly...",
    "Did you know penguins can't fly? But $SPR can moon",
    "The early penguin gets the $PENGUIN",
    "Just vibing in the Antarctic of Solana...",
    "Bro go buy some $SPR, I'm getting bored here",
    "Penguins don't sell. They huddle.",
  ],
  cooking: [
    "COOKING TIME! Let me whip up some $PENGUIN...",
    "Chef Penguin in the kitchen!",
    "The secret ingredient is... MORE PENGUIN",
    "SOL in the pan, $PENGUIN coming out!",
  ],
  counting: [
    "Hmm... counting all the $SPR holders...",
    "*adjusts monocle* Let me see who's eligible...",
    "Detective Penguin on the case! Who hodling?",
    "Taking snapshot of all the diamond flippers!",
  ],
  airdropping: [
    "AIRDROP ENGAGED!!! $PENGUIN RAINING FROM THE SKY!!!",
    "FREE PENGUIN!!! EVERYBODY GETS A PENGUIN!!!",
    "Sending $PENGUIN to all the real ones...",
    "Parachutes deployed! $PENGUIN inbound!",
  ],
  celebrating: [
    "AIRDROP COMPLETE!!! WE ALL EATING GOOD TONIGHT!",
    "THIS IS WHAT DIAMOND FLIPPERS GET!",
    "GG EZ. See you in 10 minutes for more!",
    "Mission accomplished! Time to huddle!",
  ],
};

const moods = ['idle', 'idle', 'cooking', 'cooking', 'counting', 'airdropping', 'celebrating'];

function getRandomThought(mood) {
  const list = thoughts[mood] || thoughts.idle;
  return list[Math.floor(Math.random() * list.length)];
}

export default function handler(req, res) {
  // Cycle through moods based on time (changes every 5 seconds)
  const cycleIndex = Math.floor(Date.now() / 5000) % moods.length;
  const mood = moods[cycleIndex];

  const demoStatus = {
    mood: mood,
    thought: getRandomThought(mood),
    timestamp: Date.now(),
    treasurySol: mood === 'cooking' ? (Math.random() * 2 + 0.5).toFixed(4) : 0,
    treasuryPenguin: ['cooking', 'counting', 'airdropping'].includes(mood) ? Math.floor(Math.random() * 500000 + 100000) : 0,
    lastAirdropTime: Date.now() - Math.floor(Math.random() * 900000),
    lastAirdropAmount: Math.floor(Math.random() * 300000 + 50000),
    lastAirdropRecipients: Math.floor(Math.random() * 50 + 10),
    totalAirdrops: Math.floor(Date.now() / 100000) % 100 + 5,
    totalPenguinDistributed: Math.floor(Math.random() * 5000000 + 1000000),
    eligibleHolders: Math.floor(Math.random() * 100 + 30),
    totalHolders: Math.floor(Math.random() * 300 + 100),
    nextAirdropTime: Date.now() + 10 * 60 * 1000 - (Date.now() % (10 * 60 * 1000)),
    recentActivity: [
      { timestamp: Date.now() - 5000, type: 'airdrop', message: 'Airdrop complete! 245,678 $PENGUIN → 47 holders' },
      { timestamp: Date.now() - 30000, type: 'swap', message: 'Swapped 1.5 SOL → 312,456 $PENGUIN' },
      { timestamp: Date.now() - 60000, type: 'claim', message: 'Detected 1.5 SOL deposit!' },
      { timestamp: Date.now() - 120000, type: 'info', message: 'Taking snapshot... Found 52 eligible holders!' },
      { timestamp: Date.now() - 180000, type: 'airdrop', message: 'Airdrop complete! 189,234 $PENGUIN → 38 holders' },
    ]
  };

  // CORS - allow same-origin and Vercel preview URLs
  const origin = req.headers.origin;
  const allowedOrigins = [
    'http://localhost:3000',
    'http://localhost:5173',
  ];

  // Allow Vercel preview URLs
  if (origin && (allowedOrigins.includes(origin) || origin.endsWith('.vercel.app'))) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }

  res.setHeader('Cache-Control', 'no-cache');
  res.status(200).json(demoStatus);
}
