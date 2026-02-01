'use client';

import { useState, useEffect } from 'react';

// Proper type for the beforeinstallprompt event
interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
  prompt(): Promise<void>;
}

export default function InstallPage() {
  // Detect values **during render** (no useEffect needed for initial read)
  const isIOS = /iPad|iPhone|iPod/.test(typeof navigator !== 'undefined' ? navigator.userAgent : '');
  
  const isStandalone =
    typeof window !== 'undefined' &&
    (window.matchMedia('(display-mode: standalone)').matches ||
      // Safari iOS uses non-standard `standalone` property
      (navigator as Navigator & { standalone?: boolean }).standalone === true);

  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [canInstall, setCanInstall] = useState(false);

  useEffect(() => {
    if (isStandalone) return;

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setCanInstall(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
  }, [isStandalone]);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    console.log(`User ${outcome} the install prompt`);
    setCanInstall(false);
  };

  return (
    <div style={{ padding: '2rem', maxWidth: '600px', margin: '0 auto', fontFamily: 'system-ui' }}>
      <h1 style={{ fontSize: '1.8rem', fontWeight: '700', marginBottom: '1.5rem' }}>
        📲 Install Healing Shoulder
      </h1>

      {isStandalone ? (
        <p style={{ background: '#dcfce7', padding: '1rem', borderRadius: '8px' }}>
          ✅ This app is already installed!
        </p>
      ) : isIOS ? (
        <div style={{ background: '#fffbeb', padding: '1.2rem', borderRadius: '12px', border: '1px solid #fde68a' }}>
          <h3 style={{ margin: '0 0 0.75rem', fontWeight: '600' }}>📱 iOS Installation</h3>
          <ol style={{ paddingLeft: '1.2rem', lineHeight: 1.6 }}>
            <li>Tap the <strong>Share</strong> button (bottom toolbar)</li>
            <li>Scroll down and tap <strong>Add to Home Screen</strong></li>
            <li>Tap <strong>Add</strong></li>
          </ol>
        </div>
      ) : canInstall ? (
        <button
          onClick={handleInstall}
          style={{
            background: '#4f46e5',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            padding: '12px 24px',
            fontSize: '1.1rem',
            cursor: 'pointer',
          }}
        >
          📲 Install App
        </button>
      ) : (
        <p>
          Waiting for installability... Visit this page twice with a few minutes between visits.
        </p>
      )}
    </div>
  );
}