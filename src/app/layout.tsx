// src/app/layout.tsx
import { Inter } from 'next/font/google';
import './globals.css';
import { getCurrentUser } from '@/lib/auth-server';
import ClientLayout from './client-layout';
import { Analytics } from '@vercel/analytics/next';
import { SpeedInsights } from '@vercel/speed-insights/next';
import PWAInstaller from '@/components/PWAInstaller';
import ServiceWorkerRegister from '@/components/ServiceWorkerRegister';

const inter = Inter({ subsets: ['latin'] });

// ✅ Add PWA & SEO metadata here (App Router way)
export const metadata = {
  title: 'Healing Shoulder',
  description: 'A compassionate space for grief support and connection.',
  manifest: '/manifest.json', // 👈 This links your PWA manifest
  themeColor: '#4f46e5',      // 👈 Required for PWA address bar color
  // Optional but recommended for iOS
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Healing Shoulder',
  },
  icons: {
    icon: '/icons/icon-96x96.png',
    apple: [
      { url: '/icons/icon-152x152.png', sizes: '152x152' },
      { url: '/icons/icon-180x180.png', sizes: '180x180' },
      { url: '/icons/icon-192x192.png', sizes: '192x192' },
    ],
  },
};

// Optional: customize viewport (helps with mobile PWA)
export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();

  return (
    <html lang="en" className="h-full">
      <body className={`${inter.className} flex flex-col h-full bg-gradient-to-b from-amber-50 via-stone-50 to-stone-100 text-stone-900`}>
        <Analytics />
        <SpeedInsights />

        {/* Service worker registration (client-side only) */}
        <ServiceWorkerRegister />
        
        <ClientLayout user={user}>{children}</ClientLayout>
        
        <PWAInstaller />
      </body>
    </html>
  );
}