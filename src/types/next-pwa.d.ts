// src/types/next-pwa.d.ts

declare module 'next-pwa' {
  interface PWARuntimeCaching {
    urlPattern: string | RegExp;
    handler: string;
    options?: {
      cacheName?: string;
      expiration?: {
        maxEntries?: number;
        maxAgeSeconds?: number;
      };
      networkTimeoutSeconds?: number;
      backgroundSync?: {
        name: string;
        options?: Record<string, unknown>;
      };
      plugins?: Array<unknown>;
    };
  }

  interface PWAOptions {
    dest: string;
    register?: boolean;
    skipWaiting?: boolean;
    disable?: boolean;
    runtimeCaching?: PWARuntimeCaching[];
    fallbacks?: Record<string, string>;
    publicExcludes?: string[];
    buildExcludes?: string[];
    [key: string]: unknown;
  }

  // Use ReturnType or Parameters? No — just reference NextConfig via import type inside
  function withPWA(
    config: import('next').NextConfig & { pwa?: PWAOptions }
  ): import('next').NextConfig;

  export default withPWA;
}