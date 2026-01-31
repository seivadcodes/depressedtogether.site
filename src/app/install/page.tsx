// app/install/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';

export default function InstallPage() {
  // Detect iOS at module level or during render — no effect needed
  const isIOS = typeof navigator !== 'undefined' && /iPad|iPhone|iPod/.test(navigator.userAgent);

  const [deferredPrompt, setDeferredPrompt] = useState<Event | null>(null);
  const [showAndroidButton, setShowAndroidButton] = useState(false);
  const router = useRouter();

  // Only use effect for event subscription (not for setting static state like isIOS)
  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowAndroidButton(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleAndroidInstall = async () => {
    if (!deferredPrompt) return;

    try {
      // @ts-expect-error — standard web API
      const { outcome } = await deferredPrompt.prompt();
      if (outcome === 'accepted') {
        toast.success('App installed! 🎉');
        setTimeout(() => router.push('/'), 2000);
      }
    } catch {
      // ✅ Removed unused `err` — just ignore or log if needed
      toast.error('Installation failed. Please try manually.');
    }
  };

  return (
    <div style={{ padding: '24px', maxWidth: '600px', margin: '0 auto' }}>
      <h1 style={{ fontSize: '28px', fontWeight: '700', marginBottom: '16px' }}>
        Install Depressed Together
      </h1>
      <p style={{ fontSize: '16px', color: '#475569', marginBottom: '24px' }}>
        Add this app to your home screen for quick access, offline support, and a better experience.
      </p>

      {showAndroidButton && !isIOS ? (
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <button
            onClick={handleAndroidInstall}
            style={{
              background: '#3b82f6',
              color: 'white',
              border: 'none',
              borderRadius: '12px',
              padding: '12px 24px',
              fontSize: '16px',
              fontWeight: '600',
              cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)',
            }}
          >
            ✅ Install App
          </button>
          <p style={{ fontSize: '14px', color: '#64748b', marginTop: '8px' }}>
            (Tap to install directly)
          </p>
        </div>
      ) : (
        <div style={{ marginBottom: '32px' }}>
          <h2 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '12px' }}>
            {isIOS ? 'On iPhone or iPad:' : 'On Android (manual):'}
          </h2>
          <ol style={{ paddingLeft: '20px', lineHeight: '1.6' }}>
            <li>Open this page in **Safari** (iOS) or **Chrome** (Android)</li>
            <li>
              Tap the <strong>{isIOS ? 'Share' : 'Menu'}</strong> button:
              <div style={{ display: 'flex', gap: '12px', margin: '12px 0', justifyContent: 'center' }}>
                {isIOS ? <span>📤</span> : <span>⋮</span>}
              </div>
            </li>
            <li>
              Scroll down and tap <strong>“Add to Home Screen”</strong>
            </li>
            <li>Tap <strong>“Add”</strong> (iOS) or <strong>“Install”</strong> (Android)</li>
          </ol>
        </div>
      )}

      <div style={{ textAlign: 'center', marginTop: '32px' }}>
        <button
          onClick={() => router.back()}
          style={{
            background: 'transparent',
            border: '1px solid #cbd5e1',
            borderRadius: '8px',
            padding: '8px 16px',
            color: '#475569',
            cursor: 'pointer',
          }}
        >
          ← Back to App
        </button>
      </div>
    </div>
  );
}