// $SER - Strategic Elon Reserve - Hedge Fund Aesthetic x Meme Energy
import React, { useState, useEffect, useRef } from 'react';

function App() {
  // Animated metrics - meme numbers
  const [aum, setAum] = useState(69420000);
  const [trades, setTrades] = useState(1337000);
  const [elonTweets, setElonTweets] = useState(0);

  // PFP Generator state
  const [pfpImage, setPfpImage] = useState(null);
  const [pfpOptions, setPfpOptions] = useState({
    frame: true,
  });
  const canvasRef = useRef(null);
  const frameImageRef = useRef(null);

  // Preload frame image
  useEffect(() => {
    const frameImg = new Image();
    frameImg.src = '/media/frame.png';
    frameImg.onload = () => {
      frameImageRef.current = frameImg;
    };
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setAum(prev => prev + Math.floor(Math.random() * 42069));
      setTrades(prev => prev + Math.floor(Math.random() * 420));
      setElonTweets(prev => (prev + 1) % 100);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  // PFP Generator - render canvas (CIRCULAR for X/Twitter)
  useEffect(() => {
    if (!pfpImage || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const size = 400;
    const center = size / 2;
    const radius = size / 2;
    canvas.width = size;
    canvas.height = size;

    const img = new Image();
    img.onload = () => {
      // Clear canvas
      ctx.clearRect(0, 0, size, size);

      // Clip to circle for the base image
      ctx.save();
      ctx.beginPath();
      ctx.arc(center, center, radius - (pfpOptions.frame ? 12 : 0), 0, Math.PI * 2);
      ctx.closePath();
      ctx.clip();

      // Draw base image (cropped to square, will be clipped to circle)
      const minDim = Math.min(img.width, img.height);
      const sx = (img.width - minDim) / 2;
      const sy = (img.height - minDim) / 2;
      ctx.drawImage(img, sx, sy, minDim, minDim, 0, 0, size, size);
      ctx.restore();

      // Custom frame overlay
      if (pfpOptions.frame && frameImageRef.current) {
        ctx.drawImage(frameImageRef.current, 0, 0, size, size);
      }
    };
    img.src = pfpImage;
  }, [pfpImage, pfpOptions]);

  const handlePfpUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => setPfpImage(e.target.result);
      reader.readAsDataURL(file);
    }
  };

  const downloadPfp = () => {
    if (!canvasRef.current) return;
    const link = document.createElement('a');
    link.download = 'SER-pfp.png';
    link.href = canvasRef.current.toDataURL('image/png');
    link.click();
  };

  const togglePfpOption = (option) => {
    setPfpOptions(prev => ({ ...prev, [option]: !prev[option] }));
  };

  const formatNumber = (num) => {
    if (num >= 1000000000) return `$${(num / 1000000000).toFixed(2)}B`;
    if (num >= 1000000) return `$${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  // Marquee messages
  const tickerMessages = [
    "BREAKING: Elon liked a tweet about $SER (unconfirmed)",
    "LP locked until heat death of universe",
    "Rug risk: literally impossible (trust us bro)",
    "DOGE board member Kabosu approves this message",
    "SEC? Never heard of her",
    "This is financial advice (it's not)",
  ];

  return (
    <div className="bg-[#0a0f1a] text-white min-h-screen font-sans">

      {/* Breaking News Ticker */}
      <div className="bg-amber-600 text-black py-2 overflow-hidden">
        <div className="animate-marquee whitespace-nowrap">
          {[...tickerMessages, ...tickerMessages].map((msg, i) => (
            <span key={i} className="mx-8 font-medium text-sm">
              {msg} <span className="text-amber-900">●</span>
            </span>
          ))}
        </div>
      </div>

      {/* Navigation - Sticky, Minimal */}
      <nav className="sticky top-0 z-50 bg-[#0a0f1a]/95 backdrop-blur-sm border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-3 md:py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-amber-500 to-amber-700 rounded flex items-center justify-center font-serif font-bold text-lg animate-pulse">
              S
            </div>
            <span className="font-serif text-base md:text-xl tracking-wide hidden sm:inline">Strategic Elon Reserve</span>
            <span className="font-serif text-base tracking-wide sm:hidden">$SER</span>
            <span className="hidden sm:inline-block text-xs bg-green-500/20 text-green-400 px-2 py-1 rounded-full border border-green-500/30">
              SAFU ✓
            </span>
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm text-gray-400">
            <a href="#about" className="hover:text-white transition-colors">About</a>
            <a href="#strategy" className="hover:text-white transition-colors">Strategy</a>
                        <a href="#pfp" className="hover:text-white transition-colors">PFP</a>
            <a href="#merch" className="hover:text-white transition-colors">Merch</a>
            <a
              href="https://pump.fun"
              className="bg-gradient-to-r from-amber-600 to-amber-500 text-white px-5 py-2 rounded hover:from-amber-500 hover:to-amber-400 transition-all font-medium"
            >
              APE IN →
            </a>
          </div>
        </div>
      </nav>

      {/* Hero - Authority meets Degen */}
      <header className="pt-10 pb-12 md:pt-16 md:pb-16 px-4 md:px-8 max-w-7xl mx-auto">
        <div className="grid md:grid-cols-2 gap-8 md:gap-12 items-center">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <span className="text-amber-500 text-sm tracking-[0.3em] uppercase font-medium">
                Est. 2026 · Solana
              </span>
              <span className="text-xs bg-red-500/20 text-red-400 px-2 py-1 rounded animate-pulse">
                LIVE
              </span>
            </div>

            {/* Core Branding - $SER */}
            <div className="mb-6">
              <h1 className="font-serif text-6xl md:text-7xl lg:text-8xl font-bold leading-none mb-2">
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-amber-500 to-amber-600 animate-text-glow">
                  $SER
                </span>
              </h1>
              <div className="flex items-center gap-3">
                <div className="h-[2px] w-12 bg-gradient-to-r from-amber-500 to-transparent"></div>
                <h2 className="font-serif text-2xl md:text-3xl text-white/90 tracking-wide">
                  Strategic Elon Reserve
                </h2>
              </div>
            </div>

            <p className="text-xl md:text-2xl text-gray-300 font-light mb-4 max-w-lg leading-relaxed">
              Securing Value Through{' '}
              <span className="text-amber-400 font-medium">Strategic Reserves</span>
            </p>
            <p className="text-gray-500 leading-relaxed mb-4 max-w-lg">
              Systematic fee capture mechanisms to accumulate TSLAx positions,
              redistributing value to stakeholders through automated airdrop protocols.
            </p>
            <p className="text-amber-500 font-medium mb-8 text-sm">
              → Translation: We yoink fees, buy Tesla bags, airdrop to diamond hands. Simple as.
            </p>
            <div className="flex flex-wrap gap-4">
              <a
                href="https://pump.fun"
                className="bg-white text-[#0a0f1a] px-8 py-3 font-bold hover:bg-amber-400 hover:scale-105 transition-all"
              >
                Access Fund
              </a>
              <a
                href="#strategy"
                className="border border-white/20 px-8 py-3 font-medium hover:bg-white/5 hover:border-amber-500/50 transition-all"
              >
                Read the Alpha
              </a>
              <a
                href="https://dexscreener.com"
                className="border border-green-500/30 text-green-400 px-6 py-3 font-medium hover:bg-green-500/10 transition-all flex items-center gap-2"
              >
                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                Chart
              </a>
            </div>
          </div>

          {/* Logo with glow for transparent PNG */}
          <div className="relative flex items-center justify-center min-h-[280px] md:min-h-[350px]">
            {/* Glow effects - layered for depth */}
            <div className="absolute w-96 h-96 bg-amber-500/15 rounded-full blur-[100px]"></div>
            <div className="absolute w-72 h-72 bg-amber-600/25 rounded-full blur-[60px] animate-pulse"></div>
            <div className="absolute w-48 h-48 bg-amber-400/20 rounded-full blur-[40px] animate-pulse" style={{animationDelay: '0.5s'}}></div>

            {/* Main image - NO background, transparent PNG */}
            <img
              src="/media/pfp.png"
              alt="$SER"
              className="relative z-10 w-52 h-52 md:w-72 md:h-72 object-contain drop-shadow-[0_0_60px_rgba(251,191,36,0.4)] hover:scale-110 transition-transform duration-500"
              style={{ background: 'transparent' }}
            />

            {/* Floating badges */}
            <div className="absolute top-4 right-4 z-20 bg-green-500/20 border border-green-500/50 text-green-400 px-3 py-1 rounded-full text-xs font-mono animate-bounce backdrop-blur-sm">
              LP LOCKED 🔒
            </div>
            <div className="absolute bottom-4 left-4 z-20 bg-amber-500/20 border border-amber-500/50 text-amber-400 px-3 py-1 rounded-full text-xs font-mono backdrop-blur-sm" style={{animation: 'bounce 2s infinite', animationDelay: '0.5s'}}>
              0% TAX 💎
            </div>
          </div>
        </div>
      </header>

      {/* Key Metrics Bar - Live updating */}
      <section className="border-y border-white/10 bg-[#0d1320]">
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-6 md:py-8 grid grid-cols-2 md:grid-cols-5 gap-4 md:gap-6">
          <div className="text-center">
            <div className="font-serif text-3xl md:text-4xl text-amber-500 mb-2 tabular-nums">
              {formatNumber(aum)}
            </div>
            <div className="text-xs text-gray-500 tracking-widest uppercase">
              Assets Under Memeagement
            </div>
          </div>
          <div className="text-center">
            <div className="font-serif text-3xl md:text-4xl text-white mb-2">
              0%
            </div>
            <div className="text-xs text-gray-500 tracking-widest uppercase">
              Tax (We're Not Normies)
            </div>
          </div>
          <div className="text-center">
            <div className="font-serif text-3xl md:text-4xl text-white mb-2 tabular-nums">
              {formatNumber(trades)}
            </div>
            <div className="text-xs text-gray-500 tracking-widest uppercase">
              Fees Yoinked
            </div>
          </div>
          <div className="text-center">
            <div className="font-serif text-3xl md:text-4xl text-green-500 mb-2">
              ∞
            </div>
            <div className="text-xs text-gray-500 tracking-widest uppercase">
              TSLAx Airdrops
            </div>
          </div>
          <div className="text-center">
            <div className="font-serif text-3xl md:text-4xl text-white mb-2">
              {elonTweets}%
            </div>
            <div className="text-xs text-gray-500 tracking-widest uppercase">
              Chance Elon Notices
            </div>
          </div>
        </div>
      </section>

      {/* About Section - Serious meets Silly */}
      <section id="about" className="py-10 md:py-14 px-4 md:px-8 max-w-7xl mx-auto">
        <div className="grid md:grid-cols-2 gap-6 md:gap-10">
          <div>
            <p className="text-amber-500 text-sm tracking-[0.3em] uppercase mb-4">
              About the Fund
            </p>
            <h2 className="font-serif text-4xl mb-6">
              A New Paradigm in Digital Asset Reserves
            </h2>
            <p className="text-gray-600 text-sm italic mb-4">
              (That's fancy talk for "number go up technology")
            </p>
          </div>
          <div className="text-gray-400 leading-relaxed space-y-4">
            <p>
              The Strategic Elon Reserve represents a paradigm shift in memetic finance.
              While traditional funds chase alpha through conventional means, $SER implements
              a proprietary fee-yoinking mechanism that systematically captures value from
              pump.fun transaction flows.
            </p>
            <p>
              These captured fees are algorithmically converted to TSLAx—tokenized Tesla
              equity—and distributed to $SER stakeholders through our automated airdrop
              infrastructure. This creates a unique hedge: exposure to both memetic upside
              and real-world equity appreciation.
            </p>
            <div className="bg-amber-500/10 border border-amber-500/30 p-4 rounded">
              <p className="text-amber-400 font-medium">
                TL;DR: Hold $SER → Get free TSLAx → Elon pumps TSLA → We all make it 🚀
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Trust Badges - Satirical */}
      <section className="py-6 md:py-8 px-4 md:px-8 bg-[#0d1320] border-y border-white/5">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-wrap justify-center items-center gap-4 md:gap-8 text-gray-500 text-xs md:text-sm">
            <div className="flex items-center gap-2">
              <span className="text-green-500">✓</span> Audited by Trust Me Bro LLC
            </div>
            <div className="flex items-center gap-2">
              <span className="text-green-500">✓</span> Featured on Elon's For You Page (soon)
            </div>
            <div className="flex items-center gap-2">
              <span className="text-green-500">✓</span> Certified Not a Rug™
            </div>
            <div className="flex items-center gap-2">
              <span className="text-green-500">✓</span> WAGMI Compliant
            </div>
          </div>
        </div>
      </section>

      {/* Strategy & Tokenomics - Side by Side */}
      <section id="strategy" className="py-10 md:py-14 px-4 md:px-8 bg-[#0d1320]">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-8 md:gap-10">
            {/* Investment Strategy */}
            <div>
              <p className="text-amber-500 text-sm tracking-[0.3em] uppercase mb-4">
                Investment Strategy
              </p>
              <h2 className="font-serif text-3xl mb-2">
                The $SER Methodology
              </h2>
              <p className="text-gray-500 mb-4 md:mb-6">Three steps to generational wealth</p>

              <div className="space-y-4">
                <div className="bg-[#0a0f1a] p-6 border border-white/5 hover:border-amber-500/30 transition-colors group">
                  <div className="flex items-start gap-4">
                    <div className="text-amber-500 text-3xl font-serif group-hover:scale-110 transition-transform">01</div>
                    <div>
                      <h3 className="font-serif text-lg mb-2">Fee Capture Protocol</h3>
                      <p className="text-gray-400 text-sm leading-relaxed">
                        Systematic extraction of transaction fees from pump.fun activity via proprietary "yoinking" algorithm.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-[#0a0f1a] p-6 border border-white/5 hover:border-amber-500/30 transition-colors group">
                  <div className="flex items-start gap-4">
                    <div className="text-amber-500 text-3xl font-serif group-hover:scale-110 transition-transform">02</div>
                    <div>
                      <h3 className="font-serif text-lg mb-2">TSLAx Accumulation</h3>
                      <p className="text-gray-400 text-sm leading-relaxed">
                        Captured SOL converts to TSLAx through Jupiter, building tokenized Tesla equity reserves.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-[#0a0f1a] p-6 border border-white/5 hover:border-amber-500/30 transition-colors group">
                  <div className="flex items-start gap-4">
                    <div className="text-amber-500 text-3xl font-serif group-hover:scale-110 transition-transform">03</div>
                    <div>
                      <h3 className="font-serif text-lg mb-2">Stakeholder Distribution</h3>
                      <p className="text-gray-400 text-sm leading-relaxed">
                        TSLAx airdropped to $SER holders via on-chain snapshots. No claims. Just Tesla in your wallet.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Fund Structure / Tokenomics */}
            <div>
              <p className="text-amber-500 text-sm tracking-[0.3em] uppercase mb-4">
                Fund Structure
              </p>
              <h2 className="font-serif text-3xl mb-2">
                Tokenomics & Mechanics
              </h2>
              <p className="text-gray-500 mb-4 md:mb-6">The numbers that matter</p>

              <div className="border border-white/10 divide-y divide-white/10 bg-[#0a0f1a]">
                <div className="grid grid-cols-2 p-5 hover:bg-white/5 transition-colors">
                  <span className="text-gray-500">Total Supply</span>
                  <span className="text-right font-mono">1,000,000,000 $SER</span>
                </div>
                <div className="grid grid-cols-2 p-5 hover:bg-white/5 transition-colors">
                  <span className="text-gray-500">Transaction Tax</span>
                  <span className="text-right font-mono text-green-400">0% (Buy & Sell) 🎉</span>
                </div>
                <div className="grid grid-cols-2 p-5 hover:bg-white/5 transition-colors">
                  <span className="text-gray-500">Revenue Source</span>
                  <span className="text-right font-mono">Pump.fun Fee Yoinking</span>
                </div>
                <div className="grid grid-cols-2 p-5 hover:bg-white/5 transition-colors">
                  <span className="text-gray-500">Distribution Asset</span>
                  <span className="text-right font-mono">TSLAx (Real Tesla)</span>
                </div>
                <div className="grid grid-cols-2 p-5 hover:bg-white/5 transition-colors">
                  <span className="text-gray-500">Liquidity</span>
                  <span className="text-right font-mono text-green-400">Locked Forever 🔒</span>
                </div>
                <div className="grid grid-cols-2 p-5 hover:bg-white/5 transition-colors">
                  <span className="text-gray-500">Rug Probability</span>
                  <span className="text-right font-mono text-green-400">0.00%</span>
                </div>
                <div className="grid grid-cols-2 p-5 hover:bg-white/5 transition-colors">
                  <span className="text-gray-500">Contract</span>
                  <span className="text-right font-mono text-amber-500">[CA COMING SOON]</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Leadership - Full Meme Mode */}
      <section id="leadership" className="py-10 md:py-14 px-4 md:px-8 bg-[#0d1320]">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-8 md:mb-10">
            <p className="text-amber-500 text-sm tracking-[0.3em] uppercase mb-4">
              Leadership
            </p>
            <h2 className="font-serif text-4xl mb-2">
              Board of Directors
            </h2>
            <p className="text-gray-500">The most qualified team in memetic finance</p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
            <div className="text-center group">
              <div className="w-20 h-20 md:w-28 md:h-28 mx-auto mb-3 bg-gradient-to-br from-amber-500/20 to-amber-900/20 rounded-full overflow-hidden border border-amber-500/30 group-hover:scale-110 group-hover:border-amber-500 transition-all">
                <img src="/media/elon_musk_royal_society.jpg" alt="E. Musk" className="w-full h-full object-cover" />
              </div>
              <h3 className="font-serif text-lg">E. Musk</h3>
              <p className="text-amber-500 text-sm font-medium">Chief Yoinking Officer</p>
              <p className="text-gray-600 text-xs mt-2">Spiritual Advisor (Unofficial)</p>
            </div>

            <div className="text-center group">
              <div className="w-20 h-20 md:w-28 md:h-28 mx-auto mb-3 bg-gradient-to-br from-amber-500/20 to-amber-900/20 rounded-full overflow-hidden border border-amber-500/30 group-hover:scale-110 group-hover:border-amber-500 transition-all">
                <img src="/media/kabosu1.jpg" alt="Kabosu" className="w-full h-full object-cover" />
              </div>
              <h3 className="font-serif text-lg">Kabosu</h3>
              <p className="text-amber-500 text-sm font-medium">Director of Vibes</p>
              <p className="text-gray-600 text-xs mt-2">Forever in Our Hearts 💛</p>
            </div>

            <div className="text-center group">
              <div className="w-20 h-20 md:w-28 md:h-28 mx-auto mb-3 bg-gradient-to-br from-amber-500/20 to-amber-900/20 rounded-full overflow-hidden border border-amber-500/30 group-hover:scale-110 group-hover:border-amber-500 transition-all">
                <img src="/media/optimus1.png" alt="Optimus" className="w-full h-full object-cover" />
              </div>
              <h3 className="font-serif text-lg">Optimus</h3>
              <p className="text-amber-500 text-sm font-medium">Head of Automation</p>
              <p className="text-gray-600 text-xs mt-2">Tesla Bot Division</p>
            </div>

            <div className="text-center group">
              <div className="w-20 h-20 md:w-28 md:h-28 mx-auto mb-3 bg-gradient-to-br from-green-500/20 to-green-900/20 rounded-full flex items-center justify-center text-3xl md:text-4xl border border-green-500/30 group-hover:scale-110 group-hover:border-green-500 transition-all">
                🫵
              </div>
              <h3 className="font-serif text-lg">You, Anon</h3>
              <p className="text-green-500 text-sm font-medium">Chief Degen</p>
              <p className="text-gray-600 text-xs mt-2">Yes, literally you. Ape in.</p>
            </div>
          </div>
        </div>
      </section>


      {/* Merchandise - Investor Apparel Collection */}
      <section id="merch" className="py-10 md:py-14 px-4 md:px-8 bg-[#0d1320]">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-8 md:mb-10">
            <p className="text-amber-500 text-sm tracking-[0.3em] uppercase mb-4">
              Investor Relations
            </p>
            <h2 className="font-serif text-4xl mb-2">
              Official Apparel Collection
            </h2>
            <p className="text-gray-500">Flex your portfolio IRL. Not financial advice, but definitely fashion advice.</p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
            {/* Hoodie */}
            <div className="group bg-[#0a0f1a] border border-white/5 hover:border-amber-500/50 transition-all rounded overflow-hidden">
              <div className="aspect-square bg-gradient-to-br from-gray-800 to-gray-900 overflow-hidden">
                <img
                  src="/media/hoodie.png"
                  alt="Reserve Hoodie"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              </div>
              <div className="p-4">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-medium">Reserve Hoodie</h3>
                  <span className="text-amber-500 font-mono text-sm">$69</span>
                </div>
                <p className="text-gray-500 text-xs mb-3">Premium heavyweight. "Strategic Elon Reserve" embroidered. Black/Gold.</p>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-green-400">In Stock</span>
                  <a href="#" className="text-xs bg-amber-500/20 text-amber-400 px-3 py-1 rounded hover:bg-amber-500/30 transition-colors">
                    Buy →
                  </a>
                </div>
              </div>
            </div>

            {/* T-Shirt */}
            <div className="group bg-[#0a0f1a] border border-white/5 hover:border-amber-500/50 transition-all rounded overflow-hidden">
              <div className="aspect-square bg-gradient-to-br from-gray-800 to-gray-900 overflow-hidden">
                <img
                  src="/media/tee.png"
                  alt="Yoinker Tee"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              </div>
              <div className="p-4">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-medium">Yoinker Tee</h3>
                  <span className="text-amber-500 font-mono text-sm">$42</span>
                </div>
                <p className="text-gray-500 text-xs mb-3">"We Yoink, Therefore We Are" front print. 100% cotton. Soft as gains.</p>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-green-400">In Stock</span>
                  <a href="#" className="text-xs bg-amber-500/20 text-amber-400 px-3 py-1 rounded hover:bg-amber-500/30 transition-colors">
                    Buy →
                  </a>
                </div>
              </div>
            </div>

            {/* Hat */}
            <div className="group bg-[#0a0f1a] border border-white/5 hover:border-amber-500/50 transition-all rounded overflow-hidden">
              <div className="aspect-square bg-gradient-to-br from-gray-800 to-gray-900 overflow-hidden">
                <img
                  src="/media/cap.png"
                  alt="Diamond Hands Cap"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              </div>
              <div className="p-4">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-medium">Diamond Hands Cap</h3>
                  <span className="text-amber-500 font-mono text-sm">$35</span>
                </div>
                <p className="text-gray-500 text-xs mb-3">Structured snapback. $SER logo. For when you're touching grass.</p>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-green-400">In Stock</span>
                  <a href="#" className="text-xs bg-amber-500/20 text-amber-400 px-3 py-1 rounded hover:bg-amber-500/30 transition-colors">
                    Buy →
                  </a>
                </div>
              </div>
            </div>

            {/* Special Item */}
            <div className="group bg-[#0a0f1a] border border-amber-500/30 hover:border-amber-500 transition-all rounded overflow-hidden relative">
              <div className="absolute top-2 right-2 bg-amber-500 text-black text-xs px-2 py-1 rounded font-bold z-10">
                LIMITED
              </div>
              <div className="aspect-square bg-gradient-to-br from-amber-900/30 to-gray-900 overflow-hidden">
                <img
                  src="/media/jacket.png"
                  alt="Founder's Jacket"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              </div>
              <div className="p-4">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-medium">Founder's Jacket</h3>
                  <span className="text-amber-500 font-mono text-sm">$420</span>
                </div>
                <p className="text-gray-500 text-xs mb-3">Leather bomber. Gold embroidery. Only 69 ever made. Flex god status.</p>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-amber-400">23/69 Left</span>
                  <a href="#" className="text-xs bg-amber-500 text-black px-3 py-1 rounded hover:bg-amber-400 transition-colors font-medium">
                    Buy →
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* Merch Benefits */}
          <div className="mt-6 md:mt-8 grid grid-cols-3 gap-2 md:gap-4 text-center">
            <div className="p-4">
              <div className="text-2xl mb-2">🚀</div>
              <h4 className="font-medium text-sm mb-1">Holder Discount</h4>
              <p className="text-gray-500 text-xs">Hold 1M+ $SER = 20% off all merch</p>
            </div>
            <div className="p-4">
              <div className="text-2xl mb-2">📦</div>
              <h4 className="font-medium text-sm mb-1">Worldwide Shipping</h4>
              <p className="text-gray-500 text-xs">We ship to any country (except the moon, for now)</p>
            </div>
            <div className="p-4">
              <div className="text-2xl mb-2">💎</div>
              <h4 className="font-medium text-sm mb-1">Pay with SOL</h4>
              <p className="text-gray-500 text-xs">Crypto payments accepted. Fiat too, if you must.</p>
            </div>
          </div>
        </div>
      </section>

      {/* PFP Generator */}
      <section id="pfp" className="py-10 md:py-14 px-4 md:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-6 md:mb-8">
            <p className="text-amber-500 text-sm tracking-[0.3em] uppercase mb-4">
              Identity Protocol
            </p>
            <h2 className="font-serif text-4xl mb-2">
              PFP Generator
            </h2>
            <p className="text-gray-500">Rep the reserve. Make your X profile go hard.</p>
          </div>

          <div className="grid md:grid-cols-2 gap-4 md:gap-6 items-start">
            {/* Upload & Preview */}
            <div className="bg-[#0d1320] border border-white/10 rounded-lg p-6">
              {!pfpImage ? (
                <label className="flex flex-col items-center justify-center aspect-square border-2 border-dashed border-white/20 rounded-lg cursor-pointer hover:border-amber-500/50 transition-colors">
                  <div className="text-4xl mb-4">📸</div>
                  <span className="text-gray-400 text-sm mb-2">Drop your pic or click to upload</span>
                  <span className="text-gray-600 text-xs">Square works best</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handlePfpUpload}
                    className="hidden"
                  />
                </label>
              ) : (
                <div className="space-y-4">
                  <canvas
                    ref={canvasRef}
                    className="w-full aspect-square rounded-full"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={downloadPfp}
                      className="flex-1 bg-amber-500 text-black py-3 rounded font-bold hover:bg-amber-400 transition-colors"
                    >
                      Download PFP 📥
                    </button>
                    <button
                      onClick={() => setPfpImage(null)}
                      className="px-4 bg-white/10 text-white py-3 rounded hover:bg-white/20 transition-colors"
                    >
                      Reset
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Options */}
            <div className="space-y-4">
              <h3 className="font-medium text-lg mb-4">Customize Your PFP</h3>

              <button
                onClick={() => togglePfpOption('frame')}
                className={`w-full p-4 rounded-lg border transition-all flex items-center justify-between ${
                  pfpOptions.frame
                    ? 'bg-amber-500/20 border-amber-500 text-white'
                    : 'bg-white/5 border-white/10 text-gray-400 hover:border-white/30'
                }`}
              >
                <span className="flex items-center gap-3">
                  <span className="text-xl">🖼️</span>
                  <span>$SER Frame</span>
                </span>
                <span>{pfpOptions.frame ? '✓' : ''}</span>
              </button>

              {!pfpImage && (
                <p className="text-gray-600 text-sm text-center mt-6">
                  Upload an image to start customizing
                </p>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* How to Invest - Degen Guide */}
      <section className="py-10 md:py-14 px-4 md:px-8 bg-[#0d1320]">
        <div className="max-w-3xl mx-auto text-center">
          <p className="text-amber-500 text-sm tracking-[0.3em] uppercase mb-4">
            Investor Onboarding
          </p>
          <h2 className="font-serif text-4xl mb-2">
            How to Gain Exposure
          </h2>
          <p className="text-gray-500 mb-6 md:mb-8">(Even your grandma could do this)</p>

          <div className="grid md:grid-cols-3 gap-4 md:gap-6 text-left mb-6 md:mb-8">
            <div className="bg-[#0a0f1a] p-6 border border-white/5 hover:border-amber-500/30 transition-colors">
              <div className="text-amber-500 font-serif text-3xl mb-3">I.</div>
              <h3 className="font-medium mb-2">Get a Wallet</h3>
              <p className="text-gray-400 text-sm">
                Download Phantom or Solflare. MetaMask? NGMI. This is Solana territory.
              </p>
            </div>
            <div className="bg-[#0a0f1a] p-6 border border-white/5 hover:border-amber-500/30 transition-colors">
              <div className="text-amber-500 font-serif text-3xl mb-3">II.</div>
              <h3 className="font-medium mb-2">Find $SER</h3>
              <p className="text-gray-400 text-sm">
                Go to pump.fun or Jupiter. Search $SER. Swap SOL. Don't overthink it.
              </p>
            </div>
            <div className="bg-[#0a0f1a] p-6 border border-white/5 hover:border-amber-500/30 transition-colors">
              <div className="text-amber-500 font-serif text-3xl mb-3">III.</div>
              <h3 className="font-medium mb-2">Diamond Hand</h3>
              <p className="text-gray-400 text-sm">
                Hold. Receive TSLAx airdrops. Watch Elon tweet. Repeat until rich.
              </p>
            </div>
          </div>

          <a
            href="https://pump.fun"
            className="inline-block bg-gradient-to-r from-amber-600 to-amber-500 text-white px-12 py-4 font-bold hover:from-amber-500 hover:to-amber-400 hover:scale-105 transition-all text-lg"
          >
            APE IN NOW 🦍
          </a>
          <p className="text-gray-600 text-xs mt-4">
            NFA. DYOR. But also... what are you waiting for?
          </p>
        </div>
      </section>

      {/* Footer - Compliance Parody */}
      <footer className="py-8 md:py-12 px-4 md:px-8 border-t border-white/5">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8 mb-8">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 bg-gradient-to-br from-amber-500 to-amber-700 rounded flex items-center justify-center font-serif font-bold text-sm">
                  S
                </div>
                <span className="font-serif">Strategic Elon Reserve</span>
              </div>
              <p className="text-gray-600 text-sm mb-4">
                Yoinking fees. Stacking TSLAx. Backing the Empire. WAGMI.
              </p>
              <div className="flex gap-3">
                <a href="https://x.com" className="w-8 h-8 bg-white/5 rounded flex items-center justify-center hover:bg-amber-500/20 transition-colors">
                  𝕏
                </a>
                <a href="#" className="w-8 h-8 bg-white/5 rounded flex items-center justify-center hover:bg-amber-500/20 transition-colors text-lg">
                  📱
                </a>
              </div>
            </div>

            <div>
              <h4 className="text-sm font-medium mb-4">Fund</h4>
              <ul className="space-y-2 text-sm text-gray-500">
                <li><a href="#about" className="hover:text-white transition-colors">About</a></li>
                <li><a href="#strategy" className="hover:text-white transition-colors">Strategy</a></li>
                <li><a href="#metrics" className="hover:text-white transition-colors">Performance</a></li>
                <li><a href="#leadership" className="hover:text-white transition-colors">Team</a></li>
                <li><a href="#merch" className="hover:text-white transition-colors">Merch</a></li>
              </ul>
            </div>

            <div>
              <h4 className="text-sm font-medium mb-4">Resources</h4>
              <ul className="space-y-2 text-sm text-gray-500">
                <li><a href="#" className="hover:text-white transition-colors">Whitepaper (vibes only)</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Audit Report</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Brand Assets</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Meme Folder</a></li>
              </ul>
            </div>

            <div>
              <h4 className="text-sm font-medium mb-4">Links</h4>
              <ul className="space-y-2 text-sm text-gray-500">
                <li><a href="https://x.com" className="hover:text-white transition-colors">X (Twitter)</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Telegram</a></li>
                <li><a href="#" className="hover:text-white transition-colors">DexScreener</a></li>
                <li><a href="#" className="hover:text-white transition-colors">pump.fun</a></li>
              </ul>
            </div>
          </div>

          {/* Legal Disclaimers - The Hedge Fund Touch with Meme Energy */}
          <div className="border-t border-white/5 pt-8">
            <p className="text-gray-600 text-xs leading-relaxed mb-4">
              <strong className="text-gray-500">IMPORTANT DISCLOSURES:</strong> $SER ("Strategic Elon Reserve") is a memetic digital asset
              on the Solana blockchain. This is absolutely not financial advice—it's financial entertainment. Past performance of memes
              is not indicative of future results, but have you SEEN how memes perform? The term "hedge fund" is used satirically because
              our lawyers (we don't have lawyers) told us to say that. We are not a registered investment advisor, broker-dealer, or
              affiliated with any regulatory body (they haven't caught us yet). "TSLAx airdrops" are subject to market conditions, vibes,
              planetary alignment, and whether Mercury is in retrograde.
            </p>
            <p className="text-gray-600 text-xs leading-relaxed mb-4">
              DYOR. NFA. WAGMI. The value of $SER may go to zero, the moon, or somewhere in between—probably the moon though (NFA).
              By purchasing $SER, you acknowledge that you are a consenting degen of legal age in your jurisdiction and that you
              understand this is all one big beautiful meme. Elon Musk has no official affiliation with this project (YET—manifesting).
              All "Board of Directors" listings are satirical. No Shiba Inus were harmed in the making of this fund. Side effects may
              include: diamond hands, decreased paper hand tendencies, excessive chart checking, and telling everyone at parties about your bags.
            </p>
            <div className="flex flex-wrap gap-4 text-xs text-gray-600">
              <span>© 2026 Strategic Elon Reserve</span>
              <span>·</span>
              <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
              <span>·</span>
              <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
              <span>·</span>
              <a href="#" className="hover:text-white transition-colors">Cookie Policy</a>
              <span>·</span>
              <span className="text-amber-500/50">WAGMI Compliance Framework v4.20.69</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
