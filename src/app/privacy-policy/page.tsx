'use client';

import Link from 'next/link';
import { ArrowLeft, Shield, Lock, Trash2, Activity } from 'lucide-react';

export default function PrivacyPolicyPage() {
  return (
    <div style={{
      minHeight: '100vh',
      fontFamily: 'system-ui, -apple-system, sans-serif',
      background: 'linear-gradient(135deg, #f0f7ff 0%, #dbeafe 50%, #bfdbfe 100%)',
      padding: '2rem',
      display: 'flex',
      justifyContent: 'center',
    }}>
      <div style={{
        backgroundColor: '#fff',
        borderRadius: '1rem',
        padding: '3rem',
        maxWidth: '48rem',
        width: '100%',
        boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)',
        border: '1px solid #e7e5e4',
        lineHeight: '1.7',
        color: '#334155',
      }}>
        
        {/* Header */}
        <div style={{ marginBottom: '2rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '1rem' }}>
          <h1 style={{
            fontSize: '2rem',
            fontWeight: 800,
            color: '#1e40af',
            margin: '0 0 0.5rem 0',
          }}>
            Privacy Policy
          </h1>
          <p style={{ color: '#64748b', margin: 0 }}>
            Last updated: February 16, 2026
          </p>
        </div>

        {/* Intro */}
        <p style={{ marginBottom: '1.5rem' }}>
          Welcome to <strong>Depressed Together</strong>. We are committed to protecting your privacy and ensuring you have a positive experience when using our app. This policy outlines how we collect, use, and protect your information.
        </p>

        {/* 1. Information We Collect */}
        <section style={{ marginBottom: '2rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
            <Shield size={24} color="#3b82f6" />
            <h2 style={{ fontSize: '1.5rem', color: '#1e293b', margin: 0 }}>1. Information We Collect</h2>
          </div>
          
          <ul style={{ paddingLeft: '1.5rem', marginTop: '0.5rem' }}>
            <li style={{ marginBottom: '0.5rem' }}>
              <strong>Personal Information:</strong> When you register, we collect your name, email address, and profile photo to create your account.
            </li>
            <li style={{ marginBottom: '0.5rem' }}>
              <strong>User Content:</strong> We store the posts, messages, and community interactions you create within the app.
            </li>
            <li style={{ marginBottom: '0.5rem' }}>
              <strong>Device Information:</strong> We automatically collect non-personal information about your device (device model) to ensure app compatibility and security.
            </li>
          </ul>
        </section>

        {/* 2. How We Use Information */}
        <section style={{ marginBottom: '2rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
            <Activity size={24} color="#10b981" />
            <h2 style={{ fontSize: '1.5rem', color: '#1e293b', margin: 0 }}>2. How We Use Your Information</h2>
          </div>
          <p>
            We use the collected information to:
          </p>
          <ul style={{ paddingLeft: '1.5rem' }}>
            <li>Provide, maintain, and improve our services.</li>
            <li>Connect you with other users in communities and support sessions.</li>
            <li>Send you technical notices and support messages.</li>
            <li>Respond to your comments and questions.</li>
          </ul>
        </section>

        {/* 3. Data Sharing & Analytics */}
        <section style={{ marginBottom: '2rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
            <Lock size={24} color="#8b5cf6" />
            <h2 style={{ fontSize: '1.5rem', color: '#1e293b', margin: 0 }}>3. Third-Party Services & Analytics</h2>
          </div>
          <p style={{ marginBottom: '1rem' }}>
            We do not sell your personal data. However, we use third-party services to help us operate our app:
          </p>
          
        </section>

        {/* 4. Data Deletion */}
        <section style={{ marginBottom: '2rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
            <Trash2 size={24} color="#ef4444" />
            <h2 style={{ fontSize: '1.5rem', color: '#1e293b', margin: 0 }}>4. Account Deletion & Data Removal</h2>
          </div>
          <p style={{ marginBottom: '1rem' }}>
            You have the right to delete your account and all associated personal data at any time.
          </p>
          <p>
            To request permanent deletion of your account, please visit our dedicated page: 
            <br />
            <Link href="/account-deletion" style={{ color: '#2563eb', textDecoration: 'underline', fontWeight: 600 }}>
              Account Deletion Request Page
            </Link>
          </p>
        </section>

        {/* 5. Contact */}
        <section style={{ marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '1.5rem', color: '#1e293b', margin: '0 0 1rem 0' }}>5. Contact Us</h2>
          <p>
            If you have any questions about this Privacy Policy, please contact us at:
            <br />
            <a href="mailto:seivadyoung@gmail.com" style={{ color: '#2563eb', textDecoration: 'none' }}>
              support@depressedtogether.com
            </a>
          </p>
        </section>

        {/* Back Button */}
        <div style={{ marginTop: '3rem', paddingTop: '2rem', borderTop: '1px solid #e2e8f0' }}>
          <Link
            href="/"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              color: '#64748b',
              textDecoration: 'none',
              fontSize: '0.95rem',
              fontWeight: 500,
            }}
          >
            <ArrowLeft size={16} />
            Back to Home
          </Link>
        </div>

      </div>
    </div>
  );
}