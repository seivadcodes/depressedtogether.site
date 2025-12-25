// src/app/auth/page.tsx
'use client';

import { useState } from 'react';

export default function AuthPage() {
  const [authMode, setAuthMode] = useState<'sign-in' | 'sign-up'>('sign-in');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log(`${authMode}:`, { email, password });
    // Replace this with real auth (e.g., fetch, Firebase, etc.)
    alert(`${authMode} attempted with ${email}`);
  };

  return (
    <div style={{ padding: '2rem', maxWidth: '400px', margin: '0 auto' }}>
      <h1>{authMode === 'sign-in' ? 'Sign In' : 'Sign Up'}</h1>
      <form onSubmit={handleSubmit}>
        <div>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            required
            style={{ width: '100%', padding: '8px', margin: '8px 0' }}
          />
        </div>
        <div>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            required
            style={{ width: '100%', padding: '8px', margin: '8px 0' }}
          />
        </div>
        <button
          type="submit"
          style={{ width: '100%', padding: '10px', background: '#0070f3', color: 'white', border: 'none', borderRadius: '4px' }}
        >
          {authMode === 'sign-in' ? 'Sign In' : 'Create Account'}
        </button>
      </form>
      <button
        onClick={() => setAuthMode(authMode === 'sign-in' ? 'sign-up' : 'sign-in')}
        style={{ marginTop: '16px', background: 'none', border: 'none', color: '#0070f3', cursor: 'pointer' }}
      >
        {authMode === 'sign-in' ? 'Need an account?' : 'Already have one?'}
      </button>
    </div>
  );
}