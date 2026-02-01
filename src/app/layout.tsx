// src/app/layout.tsx
import { Inter } from 'next/font/google';
import './globals.css';
import { getCurrentUser } from '@/lib/auth-server';
import ClientLayout from './client-layout';
import PWAInstaller from '@/components/PWAInstaller';
import ServiceWorkerRegister from '@/components/ServiceWorkerRegister';

// Only import Vercel components dynamically or conditionally
const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'Healing Shoulder',
  description: 'A compassionate space for grief support and connection.',
  manifest: '/manifest.json',
  themeColor: '#4f46e5',
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
        {/* ✅ Only load Vercel analytics in production */}
        {process.env.NODE_ENV === 'production' && (
          <>
            <Analytics />
            <SpeedInsights />
          </>
        )}

        <ServiceWorkerRegister />
        <ClientLayout user={user}>{children}</ClientLayout>
        <PWAInstaller />
      </body>
    </html>
  );
}

// Re-import Vercel components only if used
import { Analytics } from '@vercel/analytics/next';
import { SpeedInsights } from '@vercel/speed-insights/next';