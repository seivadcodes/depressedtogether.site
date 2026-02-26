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
    const random = Math.random();
    if (random < 0.01) return 1.00;
    const crashPoint = Math.max(1.00, (0.99 / (1 - random)));
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
    
    requestAnimationFrame(() => {
      startTimeRef.current = performance.now();

      const animate = (timestamp: number) => {
        const elapsed = (timestamp - startTimeRef.current) / 1000;
        const newMultiplier = Math.pow(Math.E, 0.06 * elapsed);
        
        setMultiplier(newMultiplier);

        if (useAutoCashout && newMultiplier >= autoCashout && currentBet > 0) {
          cashOut();
          return;
        }

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

  const getPlanePosition = () => {
    const progress = Math.min((multiplier - 1) / 10, 1);
    return {
      x: progress * 80,
      y: 100 - (progress * 80)
    };
  };

  const position = getPlanePosition();

  // Inline styles
  const pageStyle: React.CSSProperties = {
    minHeight: '100vh',
    backgroundColor: '#111827', // gray-900
    color: 'white',
    padding: '1rem',
    fontFamily: 'sans-serif'
  };

  const containerStyle: React.CSSProperties = {
    maxWidth: '64rem',
    margin: '0 auto'
  };

  const headerStyle: React.CSSProperties = {
    textAlign: 'center',
    marginBottom: '1.5rem'
  };

  const titleStyle: React.CSSProperties = {
    fontSize: '1.875rem',
    fontWeight: 'bold',
    color: '#ef4444' // red-500
  };

  const subtitleStyle: React.CSSProperties = {
    color: '#9ca3af', // gray-400
    fontSize: '0.875rem',
    marginTop: '0.5rem'
  };

  const cardStyle: React.CSSProperties = {
    backgroundColor: '#1f2937', // gray-800
    borderRadius: '0.5rem',
    padding: '1rem',
    marginBottom: '1rem'
  };

  const flexBetweenStyle: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  };

  const labelStyle: React.CSSProperties = {
    color: '#9ca3af' // gray-400
  };

  const balanceTextStyle: React.CSSProperties = {
    fontSize: '1.5rem',
    fontWeight: 'bold',
    color: '#4ade80' // green-400
  };

  const betTextStyle: React.CSSProperties = {
    fontSize: '1.5rem',
    fontWeight: 'bold',
    color: '#fbbf24' // yellow-400
  };

  const gameAreaStyle: React.CSSProperties = {
    backgroundColor: '#1f2937',
    borderRadius: '0.5rem',
    padding: '1.5rem',
    marginBottom: '1rem',
    position: 'relative',
    overflow: 'hidden',
    height: '300px'
  };

  const multiplierStyle: React.CSSProperties = {
    position: 'absolute',
    top: '1rem',
    left: '50%',
    transform: 'translateX(-50%)',
    textAlign: 'center'
  };

  const multiplierTextStyle = (crashed: boolean): React.CSSProperties => ({
    fontSize: '3.75rem',
    fontWeight: 'bold',
    color: crashed ? '#ef4444' : 'white',
    margin: 0
  });

  const crashedTextStyle: React.CSSProperties = {
    color: '#ef4444',
    fontSize: '1.25rem',
    fontWeight: 'bold',
    marginTop: '0.5rem'
  };

  const planeStyle: React.CSSProperties = {
    position: 'absolute',
    left: `${position.x}%`,
    bottom: `${position.y}%`,
    transition: 'all 0.1s ease',
    fontSize: '2.25rem' // text-4xl
  };

  const gridStyle: React.CSSProperties = {
    position: 'absolute',
    inset: 0,
    opacity: 0.1,
    pointerEvents: 'none'
  };

  const historyContainerStyle: React.CSSProperties = {
    display: 'flex',
    gap: '0.5rem',
    flexWrap: 'wrap'
  };

  const historyItemStyle = (value: number): React.CSSProperties => {
    let bgColor = '#dc2626'; // red-600
    if (value >= 2) bgColor = '#16a34a'; // green-600
    else if (value >= 1.5) bgColor = '#ca8a04'; // yellow-600
    return {
      padding: '0.25rem 0.75rem',
      borderRadius: '0.25rem',
      backgroundColor: bgColor,
      color: 'white'
    };
  };

  const gridLineStyle: React.CSSProperties = {
    position: 'absolute',
    borderTop: '1px solid white',
    width: '100%',
    left: 0
  };

  const inputStyle: React.CSSProperties = {
    width: '100%',
    backgroundColor: '#374151', // gray-700
    borderRadius: '0.25rem',
    padding: '0.5rem 1rem',
    color: 'white',
    border: 'none',
    outline: 'none'
  };

  const inputDisabledStyle: React.CSSProperties = {
    opacity: 0.5,
    cursor: 'not-allowed'
  };

  const buttonGridStyle: React.CSSProperties = {
    display: 'flex',
    gap: '0.5rem',
    marginTop: '0.5rem'
  };

  const smallButtonStyle: React.CSSProperties = {
    flex: 1,
    backgroundColor: '#374151',
    borderRadius: '0.25rem',
    padding: '0.25rem 0.5rem',
    fontSize: '0.875rem',
    color: 'white',
    border: 'none',
    cursor: 'pointer'
  };

  const checkboxContainerStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    marginBottom: '0.5rem'
  };

  const mainButtonStyle = (isFlying: boolean): React.CSSProperties => ({
    width: '100%',
    padding: '1rem 0',
    borderRadius: '0.5rem',
    fontWeight: 'bold',
    fontSize: '1.25rem',
    border: 'none',
    cursor: 'pointer',
    backgroundColor: isFlying ? '#16a34a' : '#dc2626',
    color: 'white',
    transition: 'background-color 0.2s'
  });

  const mainButtonDisabledStyle: React.CSSProperties = {
    opacity: 0.5,
    cursor: 'not-allowed'
  };

  const infoListStyle: React.CSSProperties = {
    color: '#9ca3af',
    fontSize: '0.875rem',
    margin: 0,
    paddingLeft: '1.5rem',
    lineHeight: 1.8
  };

  const warningStyle: React.CSSProperties = {
    color: '#f87171', // red-400
    fontSize: '0.875rem',
    marginTop: '1rem',
    fontWeight: 'bold'
  };

  return (
    <div style={pageStyle}>
      <div style={containerStyle}>
        {/* Header */}
        <div style={headerStyle}>
          <h1 style={titleStyle}>✈️ AVIATOR DEMO</h1>
          <p style={subtitleStyle}>
            Educational Purpose Only - No Real Money
          </p>
        </div>

        {/* Balance Display */}
        <div style={{ ...cardStyle, ...flexBetweenStyle }}>
          <div>
            <div style={labelStyle}>Balance</div>
            <div style={balanceTextStyle}>${balance.toFixed(2)}</div>
          </div>
          {currentBet > 0 && (
            <div>
              <div style={labelStyle}>Current Bet</div>
              <div style={betTextStyle}>${currentBet.toFixed(2)}</div>
            </div>
          )}
          {winnings > 0 && (
            <div>
              <div style={labelStyle}>Won</div>
              <div style={balanceTextStyle}>+${winnings.toFixed(2)}</div>
            </div>
          )}
        </div>

        {/* Game Area */}
        <div style={gameAreaStyle}>
          {/* Multiplier Display */}
          <div style={multiplierStyle}>
            <p style={multiplierTextStyle(crashed)}>
              {multiplier.toFixed(2)}x
            </p>
            {crashed && (
              <p style={crashedTextStyle}>FLEW AWAY!</p>
            )}
          </div>

          {/* Plane Animation */}
          {isFlying && (
            <div style={planeStyle}>
              <span>✈️</span>
            </div>
          )}

          {/* Grid Lines */}
          <div style={gridStyle}>
            {[...Array(5)].map((_, i) => (
              <div
                key={i}
                style={{ ...gridLineStyle, bottom: `${(i + 1) * 20}%` }}
              />
            ))}
          </div>
        </div>

        {/* History */}
        <div style={cardStyle}>
          <div style={labelStyle}>Recent Crashes</div>
          <div style={historyContainerStyle}>
            {history.map((value, index) => (
              <span key={index} style={historyItemStyle(value)}>
                {value.toFixed(2)}x
              </span>
            ))}
          </div>
        </div>

        {/* Controls */}
        <div style={cardStyle}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
            {/* Bet Amount */}
            <div>
              <label style={labelStyle}>Bet Amount</label>
              <input
                type="number"
                value={betAmount}
                onChange={(e) => setBetAmount(Math.max(1, Number(e.target.value)))}
                disabled={isFlying}
                style={{ ...inputStyle, ...(isFlying ? inputDisabledStyle : {}) }}
              />
              <div style={buttonGridStyle}>
                {[10, 50, 100, 500].map(amount => (
                  <button
                    key={amount}
                    onClick={() => setBetAmount(amount)}
                    disabled={isFlying}
                    style={{ ...smallButtonStyle, ...(isFlying ? inputDisabledStyle : {}) }}
                  >
                    ${amount}
                  </button>
                ))}
              </div>
            </div>

            {/* Auto Cashout */}
            <div>
              <label style={labelStyle}>Auto Cashout</label>
              <div style={checkboxContainerStyle}>
                <input
                  type="checkbox"
                  checked={useAutoCashout}
                  onChange={(e) => setUseAutoCashout(e.target.checked)}
                  disabled={isFlying}
                  style={{ width: '1rem', height: '1rem' }}
                />
                <span>Enable</span>
              </div>
              <input
                type="number"
                value={autoCashout}
                onChange={(e) => setAutoCashout(Math.max(1.01, Number(e.target.value)))}
                disabled={isFlying || !useAutoCashout}
                style={{ ...inputStyle, ...(isFlying || !useAutoCashout ? inputDisabledStyle : {}) }}
                step="0.1"
                min="1.01"
              />
            </div>
          </div>

          <button
            onClick={isFlying ? cashOut : startGame}
            disabled={balance < betAmount && !isFlying}
            style={{
              ...mainButtonStyle(isFlying),
              ...((balance < betAmount && !isFlying) ? mainButtonDisabledStyle : {})
            }}
          >
            {isFlying ? `CASH OUT ($${(currentBet * multiplier).toFixed(2)})` : 'PLACE BET'}
          </button>
        </div>

        {/* How It Works */}
        <div style={cardStyle}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>
            📚 How Aviator Works
          </h2>
          <ul style={infoListStyle}>
            <li>• Place your bet before the round starts</li>
            <li>• Multiplier increases as the plane flies</li>
            <li>• Cash out before the plane crashes to win</li>
            <li>• Crash point is determined at round start (provably fair)</li>
            <li>• If you don&apos;t cash out in time, you lose your bet</li>
            <li>• House edge built into the algorithm (most crashes early)</li>
          </ul>
          <p style={warningStyle}>
            ⚠️ Gambling involves risk. This demo is for educational purposes only.
          </p>
        </div>
      </div>
    </div>
  );
}