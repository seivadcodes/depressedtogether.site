'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { Brain, Heart, Users, MessageCircle, ShieldCheck, Mic, HandHeart, LogIn, MessageSquare, PhoneCall, Lock } from 'lucide-react';

const createSession = async () => {
  await new Promise(resolve => setTimeout(resolve, 800));
};

export default function HomePage() {
  const router = useRouter();
  const { user } = useAuth();
  const supabase = createClient();

  const [isConnecting, setIsConnecting] = useState(false);

  // 🔁 Update user's last_online every 45s (if logged in)
  useEffect(() => {
    if (!user) return;

    const updateLastOnline = async () => {
      try {
        await supabase
          .from('profiles')
          .update({ last_online: new Date().toISOString() })
          .eq('id', user.id);
      } catch (err) {
        console.warn('Failed to update last_online:', err);
      }
    };

    updateLastOnline();
    const interval = setInterval(updateLastOnline, 45_000);
    return () => clearInterval(interval);
  }, [user, supabase]);

  // === UI Handlers ===
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

  // === Shared Styles ===
  const baseColors = {
    primary: '#3b82f6',
    accent: '#10b981',
    background: '#f0f7ff',
    surface: '#ffffff',
    border: '#e2e8f0',
    text: { primary: '#1e293b', secondary: '#6b7280' },
  };

  const borderRadius = { md: '0.5rem', lg: '0.75rem', xl: '1rem', full: '9999px' };

  // Feature Data
  const features = [
    {
      icon: <ShieldCheck size={32} style={{ color: baseColors.accent }} />,
      title: "Rigorous Verification",
      description: "We strictly verify all users to eliminate scammers and bad actors, ensuring a safe space for vulnerable individuals."
    },
    {
      icon: <Mic size={32} style={{ color: baseColors.primary }} />,
      title: "Expert Insights",
      description: "Regular talks and sessions led by therapists, doctors, authors, and mental health professionals."
    },
    {
      icon: <HandHeart size={32} style={{ color: '#f59e0b' }} />,
      title: "Genuine Peer Support",
      description: "Connect instantly with others walking a similar path. Find comfort in shared experiences and mutual understanding."
    }
  ];

  // How It Works Data
  const steps = [
    {
      icon: <LogIn size={40} style={{ color: baseColors.primary }} />,
      step: "01",
      title: "Sign In",
      description: "Just like Facebook or X, simply sign in to get started. Your secure profile is your gateway to support."
    },
    {
      icon: <MessageSquare size={40} style={{ color: baseColors.accent }} />,
      step: "02",
      title: "Join & Share",
      description: "Enter communities to share what's going on. Post questions publicly or chat within groups to find immediate empathy."
    },
    {
      icon: <PhoneCall size={40} style={{ color: '#ef4444' }} />,
      step: "03",
      title: "Broadcast & Talk",
      description: "Need to talk now? Unlike complicated platforms, simply broadcast a request. Anyone available can pick up instantly. No searching, no waiting."
    },
    {
      icon: <Lock size={40} style={{ color: '#8b5cf6' }} />,
      step: "04",
      title: "Private & Secure",
      description: "Yes, you can inbox others and even call them privately and securely. Build deeper one-on-one connections in a safe environment."
    }
  ];

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
              2.6M+ people will be available
            </h2>
            <p style={{ color: baseColors.text.secondary, fontSize: '1.125rem' }}>By the end of 2026.</p>
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
            Join thousands growing toward 2.6M+ by the end of 2026
          </span>
        </div>

        {/* Action Buttons */}
        <div
          style={{
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem',
            marginBottom: '4rem',
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

        {/* Why Choose This Platform Section */}
        <div style={{ marginTop: '2rem', marginBottom: '4rem' }}>
          <h3
            style={{
              textAlign: 'center',
              fontSize: '1.75rem',
              fontWeight: '700',
              color: '#1e40af',
              marginBottom: '2rem',
            }}
          >
            Why Choose This Platform
          </h3>
          
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: '1.5rem',
            }}
          >
            {features.map((feature, index) => (
              <div
                key={index}
                style={{
                  background: 'rgba(255, 255, 255, 0.7)',
                  backdropFilter: 'blur(10px)',
                  borderRadius: borderRadius.xl,
                  padding: '1.5rem',
                  border: '1px solid rgba(255, 255, 255, 0.5)',
                  boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)',
                  textAlign: 'center',
                  transition: 'transform 0.2s ease',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'center',
                    marginBottom: '1rem',
                  }}
                >
                  {feature.icon}
                </div>
                <h4
                  style={{
                    fontSize: '1.25rem',
                    fontWeight: '600',
                    color: '#1e293b',
                    marginBottom: '0.75rem',
                  }}
                >
                  {feature.title}
                </h4>
                <p
                  style={{
                    fontSize: '0.95rem',
                    color: baseColors.text.secondary,
                    lineHeight: '1.6',
                  }}
                >
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* How It Works Section */}
        <div style={{ marginTop: '2rem', marginBottom: '5rem' }}>
          <h3
            style={{
              textAlign: 'center',
              fontSize: '1.75rem',
              fontWeight: '700',
              color: '#1e40af',
              marginBottom: '0.5rem',
            }}
          >
            How It Works
          </h3>
          <p
            style={{
              textAlign: 'center',
              color: baseColors.text.secondary,
              marginBottom: '2.5rem',
              fontSize: '1.05rem',
            }}
          >
            Simple, intuitive, and designed for immediate connection.
          </p>
          
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
              gap: '2rem',
              position: 'relative',
            }}
          >
            {steps.map((step, index) => (
              <div
                key={index}
                style={{
                  background: 'rgba(255, 255, 255, 0.6)',
                  backdropFilter: 'blur(12px)',
                  borderRadius: borderRadius.xl,
                  padding: '2rem 1.5rem',
                  border: '1px solid rgba(255, 255, 255, 0.6)',
                  boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.05)',
                  textAlign: 'center',
                  position: 'relative',
                  zIndex: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                }}
              >
                <div
                  style={{
                    background: '#ffffff',
                    width: '80px',
                    height: '80px',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: '1.5rem',
                    boxShadow: '0 4px 6px rgba(0,0,0,0.05)',
                    border: '2px solid #f0f7ff',
                  }}
                >
                  {step.icon}
                </div>
                
                <span
                  style={{
                    position: 'absolute',
                    top: '1rem',
                    right: '1.5rem',
                    fontSize: '3rem',
                    fontWeight: '900',
                    color: 'rgba(59, 130, 246, 0.1)',
                    lineHeight: 1,
                  }}
                >
                  {step.step}
                </span>

                <h4
                  style={{
                    fontSize: '1.35rem',
                    fontWeight: '700',
                    color: '#1e293b',
                    marginBottom: '1rem',
                  }}
                >
                  {step.title}
                </h4>
                <p
                  style={{
                    fontSize: '0.95rem',
                    color: baseColors.text.secondary,
                    lineHeight: '1.7',
                  }}
                >
                  {step.description}
                </p>
              </div>
            ))}
          </div>

          {/* Closing Tagline */}
          <div style={{ textAlign: 'center', marginTop: '4rem', paddingTop: '2rem', borderTop: '1px solid rgba(59, 130, 246, 0.1)' }}>
            <p
              style={{
                fontSize: '1.35rem',
                fontWeight: '600',
                color: '#1e40af',
                fontStyle: 'italic',
                marginBottom: '0.5rem',
              }}
            >
              In other words, you will never be alone again.
            </p>
            <p
              style={{
                fontSize: '1.5rem',
                fontWeight: '800',
                background: 'linear-gradient(135deg, #1e40af 0%, #3b82f6 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                marginTop: '1rem',
              }}
            >
              This is our home. We are the family we have been searching for.
            </p>
          </div>
        </div>
      </div>

      {/* Global styles */}
      <style jsx global>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(1.05); }
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