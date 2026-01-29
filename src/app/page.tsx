'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Brain, Heart, Users, MessageCircle } from 'lucide-react';

const createSession = async () => {
  await new Promise(resolve => setTimeout(resolve, 800));
};

// Smart formatter: never shows exact numbers above 300
const formatOnlineCount = (count: number): string => {
  if (count < 100) return count.toString();
  if (count < 300) return `${Math.floor(count / 10) * 10}+`;
  if (count < 330) return '300+';
  if (count < 370) return '350+';
  if (count < 410) return '400+';
  if (count < 460) return '450+';
  return '450+';
};

// Deterministic, time-based count — same for all users in the same 45-min window
const getStableOnlineCount = (): number => {
  const intervalMinutes = 45;
  const intervalMs = intervalMinutes * 60 * 1000;
  const seed = Math.floor(Date.now() / intervalMs);
  const hash = (seed * 1664525 + 1013904223) % 2147483647;
  const normalized = hash / 2147483647;
  return Math.floor(300 + normalized * 151); // 300 to 450 inclusive
};

// ✅ Pure, no side effects, no state
const useSimulatedOnlineCount = () => {
  return useMemo(() => getStableOnlineCount(), []);
};

// ✅ Clean animated display hook (no require)
const useAnimatedDisplay = (target: number) => {
  const [display, setDisplay] = useState(target);
  const lastTargetRef = useRef(target);

  useEffect(() => {
    if (target === lastTargetRef.current) return;

    const start = Date.now();
    const startVal = display;
    const endVal = target;
    const duration = 1000;

    const animate = () => {
      const elapsed = Date.now() - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = progress < 0.5 
        ? 2 * progress * progress 
        : 1 - Math.pow(-2 * progress + 2, 2) / 2;
      
      setDisplay(Math.round(startVal + (endVal - startVal) * eased));
      if (progress < 1) requestAnimationFrame(animate);
    };

    animate();
    lastTargetRef.current = target;
  }, [target, display]);

  return display;
};

export default function HomePage() {
  const router = useRouter();
  const [isConnecting, setIsConnecting] = useState(false);

  const rawCount = useSimulatedOnlineCount();
  const animatedCount = useAnimatedDisplay(rawCount);
  const formattedCount = formatOnlineCount(animatedCount);

  const handleQuickConnect = async () => {
    if (isConnecting) return;
    setIsConnecting(true);
    try {
      await createSession();
      router.push('/connect');
    } catch (error) {
      console.error('Connection failed:', error);
      alert('Unable to connect right now. Please try again.');
    } finally {
      setIsConnecting(false);
    }
  };

  const handleFindCommunity = () => {
    router.push('/communities');
  };

  const baseColors = {
    primary: '#3b82f6',
    accent: '#10b981',
    background: '#f0f7ff',
    surface: '#ffffff',
    border: '#e2e8f0',
    text: { primary: '#1e293b', secondary: '#6b7280' },
  };
  const borderRadius = { md: '0.5rem', lg: '0.75rem', xl: '1rem', full: '9999px' };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'flex-start',
        background: 'linear-gradient(135deg, #f0f7ff 0%, #dbeafe 50%, #bfdbfe 100%)',
        padding: '1rem',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Background pattern */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundImage: `radial-gradient(circle at 25% 25%, rgba(59, 130, 246, 0.05) 2px, transparent 2px)`,
          backgroundSize: '40px 40px',
          opacity: 0.5,
          zIndex: 0,
        }}
      />

      <div style={{ position: 'relative', zIndex: 1, width: '100%', maxWidth: '48rem' }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginTop: '3rem', marginBottom: '2rem' }}>
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
            <Brain size={32} style={{ color: baseColors.primary }} />
            <h1
              style={{
                fontSize: '3rem',
                fontWeight: '800',
                background: 'linear-gradient(135deg, #1e40af 0%, #3b82f6 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                margin: 0,
              }}
            >
              Depressed Together
            </h1>
          </div>
          <p
            style={{
              fontSize: '1.25rem',
              color: baseColors.text.secondary,
              maxWidth: '36rem',
              margin: '0 auto',
              lineHeight: '1.6',
            }}
          >
            You&apos;re not alone in this. Connect with others who understand what depression feels like.
          </p>
        </div>

        {/* Main Heartbeat Circle */}
        <div
          style={{
            position: 'relative',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            width: '18rem',
            height: '18rem',
            borderRadius: borderRadius.full,
            background: 'linear-gradient(135deg, rgba(219, 234, 254, 0.9) 0%, rgba(191, 219, 254, 0.9) 100%)',
            border: '2px solid rgba(59, 130, 246, 0.3)',
            boxShadow: `
              0 20px 40px rgba(59, 130, 246, 0.15),
              inset 0 1px 0 rgba(255, 255, 255, 0.5)
            `,
            margin: '3rem auto',
            transition: 'all 1s ease',
            opacity: 1,
            zIndex: 1,
            animation: 'gentlePulse 8s ease-in-out infinite',
            transformOrigin: 'center',
          }}
        >
          <div
            style={{
              position: 'absolute',
              top: '-20px',
              left: '-20px',
              right: '-20px',
              bottom: '-20px',
              borderRadius: borderRadius.full,
              border: '2px solid rgba(59, 130, 246, 0.1)',
              animation: 'pulse 4s infinite',
            }}
          />
          <div style={{ textAlign: 'center', padding: '0 2rem', zIndex: 2 }}>
            <Heart size={48} style={{ color: baseColors.primary, marginBottom: '1rem' }} />
            <h2 style={{ fontSize: '1.75rem', fontWeight: '600', color: '#1e40af', marginBottom: '0.5rem' }}>
              {formattedCount} people understand
            </h2>
            <p style={{ color: baseColors.text.secondary, fontSize: '1.125rem' }}>Right now. Right here.</p>
          </div>
        </div>

        {/* Online Indicator */}
        <div
          style={{
            textAlign: 'center',
            marginBottom: '2.5rem',
            background: 'rgba(255, 255, 255, 0.8)',
            backdropFilter: 'blur(10px)',
            borderRadius: borderRadius.full,
            padding: '0.75rem 1.5rem',
            display: 'inline-block',
            margin: '0 auto 2rem',
            border: '1px solid rgba(59, 130, 246, 0.2)',
          }}
        >
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              fontSize: '0.95rem',
              fontWeight: '600',
              color: '#1e40af',
              gap: '0.5rem',
            }}
          >
            <span
              style={{
                width: '0.75rem',
                height: '0.75rem',
                backgroundColor: baseColors.accent,
                borderRadius: '50%',
                display: 'inline-block',
                animation: 'pulse 2s infinite',
              }}
            ></span>
            {formattedCount} people available to connect
          </span>
        </div>

        {/* Buttons */}
        <div
          style={{
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem',
            marginBottom: '3rem',
            maxWidth: '32rem',
            margin: '0 auto',
          }}
        >
          <button
            onClick={handleQuickConnect}
            disabled={isConnecting}
            style={{
              width: '100%',
              padding: '1.25rem',
              background: isConnecting
                ? 'linear-gradient(135deg, #93c5fd 0%, #60a5fa 100%)'
                : 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
              color: 'white',
              fontWeight: '600',
              fontSize: '1.125rem',
              borderRadius: borderRadius.lg,
              border: 'none',
              cursor: isConnecting ? 'not-allowed' : 'pointer',
              boxShadow: '0 8px 25px rgba(59, 130, 246, 0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.75rem',
            }}
          >
            {isConnecting ? (
              <>
                <svg className="animate-spin" width="24" height="24" viewBox="0 0 24 24">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" fill="none" opacity="0.25" />
                  <path d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" fill="currentColor" />
                </svg>
                Connecting you...
              </>
            ) : (
              <>
                <MessageCircle size={24} />
                Find Support Now
              </>
            )}
          </button>

          <button
            onClick={handleFindCommunity}
            style={{
              width: '100%',
              padding: '1.25rem',
              background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
              color: '#1e40af',
              fontWeight: '600',
              fontSize: '1.125rem',
              borderRadius: borderRadius.lg,
              border: '2px solid rgba(59, 130, 246, 0.3)',
              cursor: 'pointer',
              boxShadow: '0 8px 25px rgba(0, 0, 0, 0.05)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.75rem',
            }}
          >
            <Users size={24} />
            Join Community
          </button>
        </div>

        {/* Footer Note */}
        <div
          style={{
            textAlign: 'center',
            marginTop: '3rem',
            paddingTop: '2rem',
            borderTop: '1px solid rgba(59, 130, 246, 0.1)',
          }}
        >
          <p style={{ color: baseColors.text.secondary, fontSize: '0.95rem', lineHeight: '1.6' }}>
            <strong>Important:</strong> This platform connects people for peer support. It&apos;s not a replacement for professional mental health care. If you&apos;re in crisis, please contact emergency services.
          </p>
          <p style={{ 
            color: baseColors.text.secondary, 
            fontSize: '0.85rem', 
            marginTop: '0.5rem',
            fontStyle: 'italic'
          }}>
            (Simulated count — updates every 45 minutes)
          </p>
        </div>
      </div>

      {/* Global styles */}
      <style jsx global>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.6; transform: scale(1.03); }
        }
        @keyframes gentlePulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.015); }
        }
        .animate-spin {
          animation: spin 1s linear infinite;
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}