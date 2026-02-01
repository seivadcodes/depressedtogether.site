// src/components/ServiceWorkerRegister.tsx
'use client';

import { useEffect } from 'react';

export default function ServiceWorkerRegister() {
  useEffect(() => {
    if (
      typeof window !== 'undefined' &&
      'serviceWorker' in navigator &&
      // Only register in production (optional but recommended)
      process.env.NODE_ENV === 'production'
    ) {
      navigator.serviceWorker
        .register('/sw.js')
        .then((registration) => {
          console.log('✅ SW registered:', registration.scope);
        })
        .catch((error) => {
          console.error('❌ SW registration failed:', error);
        });
    }
  }, []);

  return null;
}