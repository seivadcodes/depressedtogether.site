'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { AlertTriangle, ArrowLeft, Check, Loader2, Shield, Trash2, X } from 'lucide-react';
import Link from 'next/link';

const baseStyles = {
  container: {
    minHeight: '100vh',
    fontFamily: 'system-ui, -apple-system, sans-serif',
    background: 'linear-gradient(135deg, #f0f7ff 0%, #dbeafe 50%, #bfdbfe 100%)',
    padding: '1rem',
    paddingTop: '3.5rem',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: '1rem',
    border: '1px solid #e7e5e4',
    padding: '1.5rem',
    maxWidth: '28rem',
    margin: '0 auto',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
  },
  buttonBase: {
    border: 'none',
    borderRadius: '0.5rem',
    cursor: 'pointer',
    fontWeight: 500,
    transition: 'background-color 0.2s, color 0.2s',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.5rem',
  },
  buttonPrimary: {
    backgroundColor: '#ef4444',
    color: '#fff',
    padding: '0.75rem 1.25rem',
  },
  buttonSecondary: {
    backgroundColor: '#f3f4f6',
    color: '#374151',
    padding: '0.75rem 1.25rem',
  },
  buttonDisabled: {
    backgroundColor: '#d1d5db',
    color: '#9ca3af',
    cursor: 'not-allowed',
  },
  inputBase: {
    padding: '0.75rem',
    border: '1px solid #d6d3d1',
    borderRadius: '0.5rem',
    fontFamily: 'inherit',
    fontSize: '1rem',
    width: '100%',
    boxSizing: 'border-box' as const,
  },
  textCenter: { textAlign: 'center' as const },
  flexCenter: { display: 'flex', justifyContent: 'center', alignItems: 'center' },
} as const;

type Step = 'confirm' | 'processing' | 'success' | 'error';

export default function DeleteAccountPage() {
  const supabase = useMemo(() => createClient(), []);
  const router = useRouter();
  
  const [step, setStep] = useState<Step>('confirm');
  const [emailInput, setEmailInput] = useState('');
  const [userEmail, setUserEmail] = useState<string>('');
  const [userId, setUserId] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isChecked, setIsChecked] = useState(false);

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        router.push('/auth');
        return;
      }
      setUserEmail(session.user.email || '');
      setEmailInput(session.user.email || '');
      setUserId(session.user.id);
    };
    fetchUser();
  }, [router, supabase]);

  const handleDeleteAccount = async () => {
    if (!isChecked) {
      setError('Please confirm you understand the consequences.');
      return;
    }
    if (emailInput.trim().toLowerCase() !== userEmail.toLowerCase()) {
      setError('Please enter your correct email address to confirm.');
      return;
    }

    setIsLoading(true);
    setError(null);
    setStep('processing');

    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !session?.user) {
        throw new Error('Not authenticated');
      }

      // Call your SQL function via RPC
      const { error: rpcError } = await supabase.rpc('request_account_deletion');

      if (rpcError) {
        console.error('RPC Error:', rpcError);
        throw new Error(rpcError.message || 'Failed to process deletion request');
      }

      // Sign out the user
      await supabase.auth.signOut();

      setStep('success');
      
      setTimeout(() => {
        router.push(`/profile/${userId}`);
      }, 3000);
      
    } catch (err) {
      console.error('Account deletion error:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete account. Please contact support.');
      setStep('error');
    } finally {
      setIsLoading(false);
    }
  };

  if (step === 'success') {
    return (
      <div style={baseStyles.container}>
        <div style={baseStyles.card}>
          <div style={{ ...baseStyles.flexCenter, marginBottom: '1.5rem' }}>
            <div style={{
              width: '4rem',
              height: '4rem',
              borderRadius: '9999px',
              backgroundColor: '#dcfce7',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <Check size={32} style={{ color: '#16a34a' }} />
            </div>
          </div>
          <h1 style={{ ...baseStyles.textCenter, fontSize: '1.5rem', fontWeight: 600, color: '#1e40af', marginBottom: '0.5rem' }}>
            Account Deleted
          </h1>
          <p style={{ ...baseStyles.textCenter, color: '#4b5563', marginBottom: '1.5rem' }}>
            Your personal data has been permanently deleted.
          </p>
          <p style={{ ...baseStyles.textCenter, fontSize: '0.875rem', color: '#6b7280' }}>
            Redirecting to your profile...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={baseStyles.container}>
      <div style={{ maxWidth: '28rem', margin: '0 auto', marginBottom: '1rem' }}>
        <Link
          href={`/profile/${userId}`}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
            color: '#3b82f6',
            textDecoration: 'none',
            fontSize: '0.875rem',
            fontWeight: 500,
          }}
        >
          <ArrowLeft size={16} />
          Back to Profile
        </Link>
      </div>

      <div style={baseStyles.card}>
        <div style={{ ...baseStyles.flexCenter, marginBottom: '1rem' }}>
          <div style={{
            width: '3.5rem',
            height: '3.5rem',
            borderRadius: '9999px',
            backgroundColor: '#fef2f2',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <Trash2 size={24} style={{ color: '#ef4444' }} />
          </div>
        </div>
        
        <h1 style={{ ...baseStyles.textCenter, fontSize: '1.5rem', fontWeight: 600, color: '#1e40af', marginBottom: '0.5rem' }}>
          Delete Account
        </h1>
        <p style={{ ...baseStyles.textCenter, color: '#4b5563', fontSize: '0.875rem', marginBottom: '1.5rem' }}>
          This action is permanent and cannot be undone.
        </p>

        {error && (
          <div style={{
            marginBottom: '1rem',
            padding: '0.75rem',
            backgroundColor: '#fef2f2',
            color: '#dc2626',
            borderRadius: '0.5rem',
            fontSize: '0.875rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
          }}>
            <AlertTriangle size={16} />
            {error}
          </div>
        )}

        <div style={{
          backgroundColor: '#f8fafc',
          border: '1px solid #e2e8f0',
          borderRadius: '0.75rem',
          padding: '1rem',
          marginBottom: '1.5rem',
        }}>
          <h3 style={{ fontWeight: 600, color: '#1e40af', marginBottom: '0.75rem', fontSize: '1rem' }}>
            This will permanently delete:
          </h3>
          <ul style={{ margin: 0, paddingLeft: '1.25rem', color: '#4b5563', fontSize: '0.875rem', lineHeight: 1.7 }}>
            <li>Your profile and personal information</li>
            <li>Your account credentials and access</li>
            <li>Your preferences and settings</li>
          </ul>
        </div>

        {step === 'confirm' && (
          <>
            <label style={{
              display: 'block',
              fontWeight: 500,
              color: '#3f3f46',
              fontSize: '0.875rem',
              marginBottom: '0.5rem',
            }}>
              Confirm your email address:
            </label>
            <input
              type="email"
              value={emailInput}
              onChange={(e) => {
                setEmailInput(e.target.value);
                setError(null);
              }}
              placeholder="Enter your email"
              style={{ ...baseStyles.inputBase, marginBottom: '1rem' }}
              disabled={isLoading}
            />

            <label style={{
              display: 'flex',
              gap: '0.75rem',
              alignItems: 'flex-start',
              marginBottom: '1.5rem',
              cursor: 'pointer',
            }}>
              <input
                type="checkbox"
                checked={isChecked}
                onChange={(e) => {
                  setIsChecked(e.target.checked);
                  setError(null);
                }}
                style={{
                  height: '1.25rem',
                  width: '1.25rem',
                  accentColor: '#ef4444',
                  marginTop: '0.25rem',
                  flexShrink: 0,
                }}
                disabled={isLoading}
              />
              <span style={{ fontSize: '0.875rem', color: '#4b5563', lineHeight: 1.5 }}>
                I understand this is permanent and my email cannot be used to create a new account.
              </span>
            </label>

            <div style={{ display: 'flex', flexDirection: 'column' as const, gap: '0.75rem' }}>
              <button
                onClick={handleDeleteAccount}
                disabled={isLoading || !isChecked}
                style={{
                  ...baseStyles.buttonBase,
                  ...(isLoading || !isChecked ? baseStyles.buttonDisabled : baseStyles.buttonPrimary),
                  width: '100%',
                }}
              >
                {isLoading ? (
                  <>
                    <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} />
                    Processing...
                  </>
                ) : (
                  <>
                    <Trash2 size={18} />
                    Permanently Delete Account
                  </>
                )}
              </button>
              
              <button
                onClick={() => router.push(`/profile/${userId}`)}
                disabled={isLoading}
                style={{
                  ...baseStyles.buttonBase,
                  ...baseStyles.buttonSecondary,
                  width: '100%',
                }}
              >
                <X size={18} />
                Cancel
              </button>
            </div>
          </>
        )}

        {step === 'processing' && (
          <div style={{ ...baseStyles.flexCenter, flexDirection: 'column' as const, padding: '2rem' }}>
            <Loader2 size={40} style={{ color: '#3b82f6', animation: 'spin 1s linear infinite', marginBottom: '1rem' }} />
            <p style={{ color: '#4b5563', textAlign: 'center' }}>
              Processing your request...
            </p>
          </div>
        )}

        {step === 'error' && (
          <div style={{ display: 'flex', flexDirection: 'column' as const, gap: '0.75rem' }}>
            <button
              onClick={() => {
                setStep('confirm');
                setError(null);
              }}
              style={{
                ...baseStyles.buttonBase,
                ...baseStyles.buttonSecondary,
                width: '100%',
              }}
            >
              <ArrowLeft size={18} />
              Try Again
            </button>
            <button
              onClick={() => router.push(`/profile/${userId}`)}
              style={{
                ...baseStyles.buttonBase,
                backgroundColor: '#3b82f6',
                color: '#fff',
                width: '100%',
              }}
            >
              <Shield size={18} />
              Back to Profile
            </button>
          </div>
        )}

        <div style={{
          marginTop: '1.5rem',
          paddingTop: '1rem',
          borderTop: '1px solid #e7e5e4',
          textAlign: 'center',
        }}>
          <p style={{ fontSize: '0.75rem', color: '#78716c' }}>
            <Shield size={12} style={{ verticalAlign: 'middle', marginRight: '0.25rem' }} />
            This action is verified and irreversible.
          </p>
        </div>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}