// src/app/layout.tsx
import { Inter } from 'next/font/google';
import './globals.css';
import { getCurrentUser } from '@/lib/auth-server';
import ClientLayout from './client-layout';

const inter = Inter({ subsets: ['latin'] });

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();

  return (
    <html lang="en" className="h-full">
      <head>
        {/* Capacitor Offline Handler */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if (window.Capacitor) {
                // Check connectivity immediately on load
                if (!navigator.onLine && !window.location.href.includes('offline.html')) {
                  window.location.href = 'offline.html';
                }

                // Listen for connection loss
                window.addEventListener('offline', function() {
                  if (!window.location.href.includes('offline.html')) {
                    window.location.href = 'offline.html';
                  }
                });

                // Listen for connection restore
                window.addEventListener('online', function() {
                  if (window.location.href.includes('offline.html')) {
                    // Reload the main site when back online
                    window.location.href = 'https://depressedtogether.com';
                  }
                });
              }
            `,
          }}
        />
      </head>
      <body className={`${inter.className} flex flex-col h-full bg-gradient-to-b from-amber-50 via-stone-50 to-stone-100 text-stone-900`}>
        <ClientLayout user={user}>{children}</ClientLayout>
      </body>
    </html>
  );
}