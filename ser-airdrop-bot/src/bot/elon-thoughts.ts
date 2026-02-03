// ELON THOUGHTS - The soul of the Strategic Elon Reserve dashboard
// These messages make holders feel the vibes

export type ElonMood =
  | 'idle'
  | 'watching'
  | 'claiming'
  | 'cooking'
  | 'buying'
  | 'counting'
  | 'airdropping'
  | 'celebrating'
  | 'error';

interface ThoughtCategory {
  emoji: string;
  thoughts: string[];
}

export const ELON_THOUGHTS: Record<ElonMood, ThoughtCategory> = {
  idle: {
    emoji: '🚀',
    thoughts: [
      "Strategic reserves accumulating... waiting for deployment...",
      "I'm just standing here... building the future...",
      "Did you know $SER holders get TSLAx? Diamond hands only.",
      "Checking the treasury... reserves stable... *adjusts portfolio*",
      "The early investor gets the alpha",
      "Just vibing in the Strategic Elon Reserve...",
      "Thinking about Mars... and TSLAx... mostly TSLAx",
      "*stares at pump.fun dashboard strategically*",
      "Tell your friends about $SER. The reserve grows stronger.",
      "Every cycle I deploy capital. I am patient. I am strategic.",
      "Ser, you should probably accumulate more $SER",
      "The treasury is my war chest. SOL is my ammunition.",
      "I've been managing reserves for mass amounts of time brev",
    ]
  },

  watching: {
    emoji: '👀',
    thoughts: [
      "👀 I see SOL in the treasury... interesting...",
      "Wait wait wait... is that... CAPITAL?!",
      "My strategic senses are tingling...",
      "SOL detected! Engaging reserve protocols...",
      "The treasury speaks to me... it says 'deploy me ser'",
      "I smell alpha. Strategic reserves never miss. Trust.",
      "Ooooh what do we have here? 👀",
    ]
  },

  claiming: {
    emoji: '📥',
    thoughts: [
      "Claiming from pump.fun... reserves incoming!",
      "Creator fees incoming! I can feel it in my portfolio!",
      "The bag is being secured as we speak...",
      "Pump.fun said it's our turn to extract value",
    ]
  },

  cooking: {
    emoji: '👨‍🍳',
    thoughts: [
      "COOKING TIME! Let me whip up some TSLAx...",
      "Chef Mode activated! *puts on tiny hat*",
      "The secret ingredient is... STRATEGIC ACCUMULATION",
      "Warren Buffett wishes he could cook like this 👨‍🍳",
      "Preparing the finest TSLAx for my holders...",
      "This isn't just cooking, this is RESERVE MANAGEMENT",
      "Fresh TSLAx coming right up!",
      "Today's special: TSLAx avec SOL reduction",
      "Strategy locked in. Time to execute. 🔥",
      "If you can't handle alpha, get out my reserve",
    ]
  },

  buying: {
    emoji: '💰',
    thoughts: [
      "BUYING TSLAx!!! LFG!!! 🚀",
      "Jupiter, take the wheel! Swapping SOL → TSLAx",
      "Money printer go brrrrr (but for reserves)",
      "Executing swap... I AM THE RESERVE NOW",
      "Slippage? Never heard of her. We're getting that TSLAx.",
      "SOL goes in, TSLAx comes out. Strategic.",
      "This is the moment I was built for...",
      "INJECT THAT TSLAx INTO THE RESERVES",
      "Buy buy buy! I'm not financial advice, I'm a reserve!",
      "The swap has been initiated. Praise the algorithm. 🙏",
    ]
  },

  counting: {
    emoji: '🔢',
    thoughts: [
      "Counting all you beautiful $SER holders... 1... 2... many...",
      "Let me see who's got 50K+ $SER... *adjusts monocle*",
      "Snapshot time! Say cheese! 📸",
      "Checking who's worthy of the airdrop...",
      "If you're reading this and you have <50K $SER... accumulate more",
      "The chosen ones shall receive TSLAx...",
      "Separating the diamond hands from the paper hands...",
      "Eligibility check in progress... are YOU on the list?",
    ]
  },

  airdropping: {
    emoji: '🪂',
    thoughts: [
      "AIRDROP ENGAGED!!! TSLAx RAINING FROM THE SKY!!!",
      "Sending TSLAx to all the real ones...",
      "This is the moment you've been waiting for!!!",
      "STRATEGIC DELIVERY SERVICE! *knocks on wallet*",
      "Your TSLAx has shipped! Check your wallet!",
      "It's literally raining alpha and I'm here for it",
      "FREE TSLAx!!! EVERYBODY GETS ALPHA!!!",
      "Distributing reserves to the homies...",
      "Transaction go brrrr 📤📤📤",
      "Special delivery! Fresh TSLAx for you ser!",
    ]
  },

  celebrating: {
    emoji: '🎉',
    thoughts: [
      "🎉 AIRDROP COMPLETE!!! WE ALL EATING GOOD TONIGHT!",
      "Another successful deployment! $SER holders stay winning!",
      "Mission accomplished! The reserves have been distributed!",
      "GG EZ. See you next cycle for more! 🚀",
      "And THAT'S how we do it in the Strategic Elon Reserve!",
      "You held, you received. Simple as. 💎",
      "The reserve grows stronger with every airdrop!",
      "Winners win. Holders hold. Reserves reserve. 🚀",
      "That felt good. Let's do it again.",
      "THIS IS WHAT DIAMOND HANDS GET! 💎",
    ]
  },

  error: {
    emoji: '😰',
    thoughts: [
      "Uh oh... something went wrong... *sweats strategically*",
      "Error detected! But reserves never give up!",
      "We hit a snag... retrying with more determination!",
      "The blockchain is being mean to me rn",
      "Technical difficulties... reserve is troubleshooting...",
      "RPC said no but I say YES. Retrying...",
      "Even reserves have bad days... we'll get 'em next time",
      "Something broke but I'm built different. Retrying...",
    ]
  }
};

export function getRandomThought(mood: ElonMood): string {
  const category = ELON_THOUGHTS[mood];
  const randomIndex = Math.floor(Math.random() * category.thoughts.length);
  return `${category.emoji} ${category.thoughts[randomIndex]}`;
}

export function getMoodEmoji(mood: ElonMood): string {
  return ELON_THOUGHTS[mood].emoji;
}
