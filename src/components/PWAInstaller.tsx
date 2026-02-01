'use client';

import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
  prompt(): Promise<void>;
}

const isIOSDevice = () => {
  if (typeof window === 'undefined') return false;
  const ua = navigator.userAgent;
  return /iPad|iPhone|iPod/.test(ua);
};

const isStandaloneMode = () => {
  if (typeof window === 'undefined') return false;
  if (window.matchMedia('(display-mode: standalone)').matches) return true;
// @ts-expect-error – 'standalone' is a non-standard Safari property not in Navigator interface
return navigator.standalone === true;
};

export default function PWAInstaller() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showIosTip, setShowIosTip] = useState(false);

  const isIOS = isIOSDevice();
  const isStandalone = isStandaloneMode();

  useEffect(() => {
    if (isStandalone) return; // Already installed → do nothing

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      const typedEvent = e as BeforeInstallPromptEvent;
      setDeferredPrompt(typedEvent);
      toast('📲 Install Healing Shoulder for quick access!', {
        duration: 6000,
        icon: '📱',
      });
    };

    const handleAppInstalled = () => {
      setDeferredPrompt(null);
      toast.success('App installed! 🎉');
    };

    // Listen for installability (works on Android/Chrome)
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    // On iOS, show tip after delay (since no beforeinstallprompt)
    let iosTimer: NodeJS.Timeout | null = null;
    if (isIOS) {
      iosTimer = setTimeout(() => {
        // Don’t show if already dismissed
        if (typeof localStorage !== 'undefined' && !localStorage.getItem('pwaIosDismissed')) {
          setShowIosTip(true);
        }
      }, 6000);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
      if (iosTimer) clearTimeout(iosTimer);
    };
  }, [isIOS, isStandalone]);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    setDeferredPrompt(null);
  };

  const dismissIosTip = () => {
    setShowIosTip(false);
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('pwaIosDismissed', 'true');
    }
  };

  // If already installed, show nothing
  if (isStandalone) return null;

  return (
    <>
      {/* Android: Show install button when prompt is available */}
      {deferredPrompt && !isIOS && (
        <div
          onClick={handleInstallClick}
          style={{
            position: 'fixed',
            bottom: '20px',
            left: '50%',
            transform: 'translateX(-50%)',
            backgroundColor: '#4f46e5',
            color: 'white',
            borderRadius: '12px',
            padding: '14px 28px',
            boxShadow: '0 4px 15px rgba(79, 70, 229, 0.3)',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            zIndex: 1000,
            cursor: 'pointer',
            maxWidth: '90%',
            fontWeight: '600',
            fontSize: '14px',
          }}
        >
          📲 Install App
        </div>
      )}

      {/* iOS: Show instructional banner */}
      {showIosTip && isIOS && (
        <div
          style={{
            position: 'fixed',
            bottom: '20px',
            left: '50%',
            transform: 'translateX(-50%)',
            backgroundColor: 'white',
            borderRadius: '12px',
            padding: '16px 24px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            zIndex: 1000,
            maxWidth: '90%',
            border: '1px solid #e2e8f0',
          }}
        >
          <div style={{ fontSize: '24px' }}>👆</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: '600', fontSize: '14px', color: '#1e293b', marginBottom: '4px' }}>
              Install Healing Shoulder
            </div>
            <div style={{ fontSize: '12px', color: '#64748b' }}>
              Tap <strong>Share</strong> then <strong>Add to Home Screen</strong>
            </div>
          </div>
          <button
            onClick={dismissIosTip}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '20px',
              color: '#94a3b8',
              cursor: 'pointer',
              padding: '4px',
            }}
          >
            ✕
          </button>
        </div>
      )}
    </>
  );
}