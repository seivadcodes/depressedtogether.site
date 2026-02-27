// src/app/cache-cleaner.tsx
'use client';

import { useEffect } from 'react';

export default function CacheCleaner() {
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // ✅ Fixed: Use 'unknown' cast to satisfy ESLint no-explicit-any rule
    const win = window as unknown as { 
      Capacitor?: unknown; 
      webkit?: { messageHandlers?: { bridge?: unknown } }; 
    };

    const isCapacitor = !!win.Capacitor || !!win.webkit?.messageHandlers?.bridge;

    if (!isCapacitor) return;

    console.log('📱 Native App Detected: Aggressively clearing storage...');

    const wipeEverything = async () => {
      try {
        // 1. CLEAR LOCAL STORAGE (The likely culprit)
        localStorage.clear();
        sessionStorage.clear();
        console.log('✅ Local/Session Storage cleared');

        // 2. UNREGISTER SERVICE WORKERS
        if ('serviceWorker' in navigator) {
          const registrations = await navigator.serviceWorker.getRegistrations();
          for (const registration of registrations) {
            await registration.unregister();
          }
          console.log('✅ Service Workers unregistered');
        }

        // 3. CLEAR CACHE API
        if ('caches' in window) {
          const keys = await caches.keys();
          for (const key of keys) {
            await caches.delete(key);
          }
          console.log('✅ Cache API cleared');
        }

        // 4. FORCE RELOAD to ensure fresh state
        setTimeout(() => {
          window.location.reload();
        }, 500);

      } catch (error) {
        console.error('❌ Error during cleanup:', error);
      }
    };

    wipeEverything();
  }, []);

  return null;
}