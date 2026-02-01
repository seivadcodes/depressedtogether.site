// src/types/next-pwa.d.ts
declare module 'next-pwa' {
  // Reference NextConfig globally without importing
  type NextConfig = import('next').NextConfig;

  type PWAConfig = {
    dest: string;
    register?: boolean;
    skipWaiting?: boolean;
    disable?: boolean;
    runtimeCaching?: Array<{
      urlPattern: RegExp | string;
      handler: string;
      options?: {
        cacheName?: string;
        expiration?: {
          maxEntries?: number;
          maxAgeSeconds?: number;
        };
        [key: string]: unknown;
      };
    }>;
    [key: string]: unknown;
  };

  const withPWA: (config: PWAConfig) => (nextConfig: NextConfig) => NextConfig;
  export default withPWA;
}