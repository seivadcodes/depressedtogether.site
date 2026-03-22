'use client';

import Link from 'next/link';
import { ArrowLeft, Shield, Trash2, Mail } from 'lucide-react';

export default function AccountDeletionInfo() {
  return (
    <div style={{
      minHeight: '100vh',
      fontFamily: 'system-ui, -apple-system, sans-serif',
      background: 'linear-gradient(135deg, #f0f7ff 0%, #dbeafe 50%, #bfdbfe 100%)',
      padding: '2rem',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
    }}>
      <div style={{
        backgroundColor: '#fff',
        borderRadius: '1rem',
        padding: '2.5rem',
        maxWidth: '32rem',
        width: '100%',
        boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)',
        border: '1px solid #e7e5e4',
      }}>
        {/* Header with App Name - CRITICAL for Google Play */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <h1 style={{
            fontSize: '1.75rem',
            fontWeight: 700,
            color: '#1e40af',
            margin: '0 0 0.5rem 0',
          }}>
            Depressed Together
          </h1>
          <p style={{ color: '#64748b', fontSize: '0.95rem', margin: 0 }}>
            Account Deletion Request
          </p>
        </div>

        {/* Instructions */}
        <div style={{ marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 600, color: '#334155', marginBottom: '1rem' }}>
            How to Delete Your Account
          </h2>
          <p style={{ color: '#475569', lineHeight: 1.6, marginBottom: '1.5rem' }}>
            To permanently delete your account and personal data from <strong>Depressed Together</strong>, please follow these steps:
          </p>
          
          <ol style={{ 
            paddingLeft: '1.25rem', 
            color: '#334155', 
            lineHeight: 1.8,
            margin: 0 
          }}>
            <li style={{ marginBottom: '0.5rem' }}>
              <strong>Log in</strong> to your account using the button below.
            </li>
            <li style={{ marginBottom: '0.5rem' }}>
              Navigate to your <strong>Profile</strong> page.
            </li>
            <li style={{ marginBottom: '0.5rem' }}>
              Click the <strong>⋮ (menu)</strong> icon in the top-right corner of your profile card.
            </li>
            <li style={{ marginBottom: '0.5rem' }}>
              Select <strong>"Delete Account"</strong>.
            </li>
            <li>
              Confirm your email address to finalize the permanent deletion.
            </li>
          </ol>
        </div>

        {/* What Gets Deleted */}
        <div style={{
  backgroundColor: '#f8fafc',
  border: '1px solid #e2e8f0',
  borderRadius: '0.75rem',
  padding: '1rem',
  marginBottom: '1.5rem',
}}>
  <h3 style={{ fontWeight: 600, color: '#1e40af', marginBottom: '0.75rem', fontSize: '1rem' }}>
    This will permanently:
  </h3>
  <ul style={{ margin: 0, paddingLeft: '1.25rem', color: '#4b5563', fontSize: '0.875rem', lineHeight: 1.7 }}>
    <li>Revoke your access and login credentials</li>
    <li>Blacklist your email from future signups</li>
    <li>Remove your personal settings and private data</li>
    <li style={{ color: '#64748b', fontStyle: 'italic' }}>
      Note: Your name and photo on past posts remain to preserve community history.
    </li>
  </ul>
</div>

        {/* Action Button */}
        <Link
          href="/auth"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.5rem',
            width: '100%',
            padding: '0.875rem',
            backgroundColor: '#ef4444',
            color: '#fff',
            textDecoration: 'none',
            borderRadius: '0.5rem',
            fontWeight: 600,
            fontSize: '1rem',
            marginBottom: '1.5rem',
            transition: 'background-color 0.2s',
          }}
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#dc2626'}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#ef4444'}
        >
          <Trash2 size={20} />
          Log In to Delete Account
        </Link>

        {/* Support Contact */}
        <div style={{
          borderTop: '1px solid #e7e5e4',
          paddingTop: '1.5rem',
          textAlign: 'center',
        }}>
          {/*<p style={{ color: '#64748b', fontSize: '0.875rem', marginBottom: '0.5rem' }}>
            Having trouble? Contact our support team.
          </p>
          <a
            href="mailto:seivadyoung@gmail.com"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              color: '#3b82f6',
              textDecoration: 'none',
              fontWeight: 500,
              fontSize: '0.9rem',
            }}
          >
            <Mail size={16} />
            seivadyoung@gmail.com
          </a>*/}
        </div>
        
        <div style={{ marginTop: '2rem', textAlign: 'center' }}>
          <Link
            href="/"
            style={{
              color: '#94a3b8',
              textDecoration: 'none',
              fontSize: '0.875rem',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.25rem',
            }}
          >
            <ArrowLeft size={14} />
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}