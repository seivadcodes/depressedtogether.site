// app/test/page.tsx
'use client';

import { useState, useEffect, useRef } from 'react';

export default function AviatorDemo() {
  const [multiplier, setMultiplier] = useState<number>(1.00);
  const [isFlying, setIsFlying] = useState<boolean>(false);
  const [crashed, setCrashed] = useState<boolean>(false);
  const [betAmount, setBetAmount] = useState<number>(10);
  const [balance, setBalance] = useState<number>(1000);
  const [currentBet, setCurrentBet] = useState<number>(0);
  const [winnings, setWinnings] = useState<number>(0);
  const [history, setHistory] = useState<number[]>([]);
  const [autoCashout, setAutoCashout] = useState<number>(2.00);
  const [useAutoCashout, setUseAutoCashout] = useState<boolean>(false);
  
  const crashPointRef = useRef<number>(1.00);
  const animationRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(0);

  // Generate crash point (simplified algorithm - real ones use provably fair systems)
  const generateCrashPoint = (): number => {
    // This simulates the house edge - most crashes happen early
    const random = Math.random();
    // 1% chance of instant crash at 1.00
    if (random < 0.01) return 1.00;
    
    // Exponential distribution with house edge
    const crashPoint = Math.max(1.00, (0.99 / (1 - random)));
    
    // Cap at reasonable maximum for demo
    return Math.min(crashPoint, 100);
  };

  const startGame = () => {
    if (balance < betAmount || isFlying) return;

    setBalance(prev => prev - betAmount);
    setCurrentBet(betAmount);
    setWinnings(0);
    setCrashed(false);
    setIsFlying(true);
    setMultiplier(1.00);
    
    crashPointRef.current = generateCrashPoint();
    
    // Use callback to ensure this runs after render, avoiding purity rule
    requestAnimationFrame(() => {
      startTimeRef.current = performance.now();

      // Animation loop
      const animate = (timestamp: number) => {
        const elapsed = (timestamp - startTimeRef.current) / 1000;
        // Exponential growth formula
        const newMultiplier = Math.pow(Math.E, 0.06 * elapsed);
        
        setMultiplier(newMultiplier);

        // Auto cashout check
        if (useAutoCashout && newMultiplier >= autoCashout && currentBet > 0) {
          cashOut();
          return;
        }

        // Check if crashed
        if (newMultiplier >= crashPointRef.current) {
          setMultiplier(crashPointRef.current);
          setCrashed(true);
          setIsFlying(false);
          setCurrentBet(0);
          setHistory(prev => [crashPointRef.current, ...prev.slice(0, 9)]);
          return;
        }

        animationRef.current = requestAnimationFrame(animate);
      };

      animationRef.current = requestAnimationFrame(animate);
    });
  };

  const cashOut = () => {
    if (!isFlying || currentBet === 0) return;

    const winAmount = currentBet * multiplier;
    setWinnings(winAmount);
    setBalance(prev => prev + winAmount);
    setCurrentBet(0);
    setIsFlying(false);
    
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }
  };

  useEffect(() => {
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  // Calculate plane position based on multiplier
  const getPlanePosition = () => {
    const progress = Math.min((multiplier - 1) / 10, 1);
    return {
      x: progress * 80,
      y: 100 - (progress * 80)
    };
  };

  const position = getPlanePosition();

  return (
    <div className="min-h-screen bg-gray-900 text-white p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold text-red-500">✈️ AVIATOR DEMO</h1>
          <p className="text-gray-400 text-sm mt-2">
            Educational Purpose Only - No Real Money
          </p>
        </div>

        {/* Balance Display */}
        <div className="bg-gray-800 rounded-lg p-4 mb-4">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-gray-400">Balance</p>
              <p className="text-2xl font-bold text-green-400">${balance.toFixed(2)}</p>
            </div>
            {currentBet > 0 && (
              <div>
                <p className="text-gray-400">Current Bet</p>
                <p className="text-2xl font-bold text-yellow-400">${currentBet.toFixed(2)}</p>
              </div>
            )}
            {winnings > 0 && (
              <div>
                <p className="text-gray-400">Won</p>
                <p className="text-2xl font-bold text-green-400">+${winnings.toFixed(2)}</p>
              </div>
            )}
          </div>
        </div>

        {/* Game Area */}
        <div className="bg-gray-800 rounded-lg p-6 mb-4 relative overflow-hidden" style={{ height: '300px' }}>
          {/* Multiplier Display */}
          <div className="absolute top-4 left-1/2 transform -translate-x-1/2">
            <p className={`text-6xl font-bold ${crashed ? 'text-red-500' : 'text-white'}`}>
              {multiplier.toFixed(2)}x
            </p>
            {crashed && (
              <p className="text-red-500 text-xl font-bold mt-2">FLEW AWAY!</p>
            )}
          </div>

          {/* Plane Animation */}
          {isFlying && (
            <div 
              className="absolute transition-all duration-100"
              style={{
                left: `${position.x}%`,
                bottom: `${position.y}%`,
              }}
            >
              <span className="text-4xl">✈️</span>
            </div>
          )}

          {/* Grid Lines */}
          <div className="absolute inset-0 opacity-10">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="absolute border-t border-white w-full" style={{ bottom: `${(i + 1) * 20}%` }} />
            ))}
          </div>
        </div>

        {/* History */}
        <div className="bg-gray-800 rounded-lg p-4 mb-4">
          <p className="text-gray-400 mb-2">Recent Crashes</p>
          <div className="flex gap-2 flex-wrap">
            {history.map((value, index) => (
              <span 
                key={index}
                className={`px-3 py-1 rounded ${
                  value >= 2 ? 'bg-green-600' : value >= 1.5 ? 'bg-yellow-600' : 'bg-red-600'
                }`}
              >
                {value.toFixed(2)}x
              </span>
            ))}
          </div>
        </div>

        {/* Controls */}
        <div className="bg-gray-800 rounded-lg p-4">
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-gray-400 mb-2">Bet Amount</label>
              <input
                type="number"
                value={betAmount}
                onChange={(e) => setBetAmount(Math.max(1, Number(e.target.value)))}
                disabled={isFlying}
                className="w-full bg-gray-700 rounded px-4 py-2 text-white disabled:opacity-50"
              />
              <div className="flex gap-2 mt-2">
                {[10, 50, 100, 500].map(amount => (
                  <button
                    key={amount}
                    onClick={() => setBetAmount(amount)}
                    disabled={isFlying}
                    className="flex-1 bg-gray-700 hover:bg-gray-600 rounded px-2 py-1 text-sm disabled:opacity-50"
                  >
                    ${amount}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-gray-400 mb-2">Auto Cashout</label>
              <div className="flex items-center gap-2 mb-2">
                <input
                  type="checkbox"
                  checked={useAutoCashout}
                  onChange={(e) => setUseAutoCashout(e.target.checked)}
                  disabled={isFlying}
                  className="w-4 h-4"
                />
                <span>Enable</span>
              </div>
              <input
                type="number"
                value={autoCashout}
                onChange={(e) => setAutoCashout(Math.max(1.01, Number(e.target.value)))}
                disabled={isFlying || !useAutoCashout}
                className="w-full bg-gray-700 rounded px-4 py-2 text-white disabled:opacity-50"
                step="0.1"
                min="1.01"
              />
            </div>
          </div>

          <button
            onClick={isFlying ? cashOut : startGame}
            disabled={balance < betAmount && !isFlying}
            className={`w-full py-4 rounded-lg font-bold text-xl ${
              isFlying
                ? 'bg-green-600 hover:bg-green-700'
                : 'bg-red-600 hover:bg-red-700'
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {isFlying ? `CASH OUT (${(currentBet * multiplier).toFixed(2)})` : 'PLACE BET'}
          </button>
        </div>

        {/* How It Works */}
        <div className="bg-gray-800 rounded-lg p-4 mt-4">
          <h2 className="text-xl font-bold mb-2">📚 How Aviator Works</h2>
          <ul className="text-gray-400 space-y-2 text-sm">
            <li>• Place your bet before the round starts</li>
            <li>• Multiplier increases as the plane flies</li>
            <li>• Cash out before the plane crashes to win</li>
            <li>• Crash point is determined at round start (provably fair)</li>
            <li>• If you don&apos;t cash out in time, you lose your bet</li>
            <li>• House edge built into the algorithm (most crashes early)</li>
          </ul>
          <p className="text-red-400 text-sm mt-4 font-bold">
            ⚠️ Gambling involves risk. This demo is for educational purposes only.
          </p>
        </div>
      </div>
    </div>
  );
}