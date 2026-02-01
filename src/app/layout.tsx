// src/app/layout.tsx
import { Inter } from 'next/font/google';
import './globals.css';
import { getCurrentUser } from '@/lib/auth-server';
import ClientLayout from './client-layout';
import { Analytics } from '@vercel/analytics/next';
import { SpeedInsights } from '@vercel/speed-insights/next';
import PWAInstaller from '@/components/PWAInstaller';
import ServiceWorkerRegister from '@/components/ServiceWorkerRegister'; // ✅

const inter = Inter({ subsets: ['latin'] });

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

        {/* ✅ Proper client-side service worker registration */}
        <ServiceWorkerRegister />
        
        <ClientLayout user={user}>{children}</ClientLayout>
        
        <PWAInstaller />
      </body>
    </html>
  );
}