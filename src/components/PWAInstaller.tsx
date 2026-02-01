'use client';

import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';

// Define proper event types
interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
  prompt(): Promise<void>;
}

// Helper: safely detect iOS without `any`
const isIOSDevice = () => {
  if (typeof window === 'undefined') return false;
  const ua = window.navigator.userAgent;
  // MSStream check for IE on Windows Phone (legacy)
  const hasMSStream = Object.prototype.hasOwnProperty.call(window, 'MSStream');
  return /iPad|iPhone|iPod/.test(ua) && !hasMSStream;
};

// Helper: check if app is already installed (standalone mode)
const isStandaloneMode = () => {
  if (typeof window === 'undefined') return false;

  // Standard PWA standalone mode (via manifest)
  if (window.matchMedia('(display-mode: standalone)').matches) {
    return true;
  }

  // Safari iOS: check for non-standard 'standalone' property safely
  const nav = window.navigator;
  if ('standalone' in nav) {
    // Type assertion only on the known property
    return (nav as { standalone: boolean }).standalone === true;
  }
  return false;
};
export default function PWAInstaller() {
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);

  // These values never change after mount → compute once
  const isIOS = isIOSDevice();
  const isStandalone = isStandaloneMode();

  useEffect(() => {
    if (isStandalone || !isIOS) return; // No need to listen if already installed or not iOS

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      const typedEvent = e as BeforeInstallPromptEvent;
      setDeferredPrompt(typedEvent);
      setShowInstallPrompt(true);
      toast('📱 App available! Tap "Install" to add to home screen', {
        duration: 8000,
        icon: '📲',
      });
    };

    const handleAppInstalled = () => {
      setDeferredPrompt(null);
      setShowInstallPrompt(false);
      toast.success('App installed successfully! 🎉');
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, [isIOS, isStandalone]); // Safe: these are constants after mount

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === 'accepted') {
      console.log('User accepted the install prompt');
    }

    setDeferredPrompt(null);
    setShowInstallPrompt(false);
  };

  // Don't show anything if already installed or not on mobile/iOS
  if (isStandalone || !isIOS) {
    return null;
  }

  return (
    <>
      {/* iOS Install Guide */}
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
          onClick={() => setShowInstallPrompt(false)}
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

      {/* Android Install Button (won’t show on iOS anyway, but safe) */}
      {showInstallPrompt && deferredPrompt && (
        <div
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
          }}
          onClick={handleInstallClick}
        >
          <div style={{ fontSize: '20px' }}>📲</div>
          <span style={{ fontWeight: '600' }}>Install App</span>
        </div>
      )}
    </>
  );
}