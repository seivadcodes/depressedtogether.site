// next.config.ts
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // ❌ REMOVE THIS LINE:
  // output: 'export', 

  // ✅ You can keep these for image optimization
  images: {
    unoptimized: false, // Re-enable optimization since Vercel handles it
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'ydrrvvnpodbchxzynbkk.supabase.co',
        port: '',
        pathname: '/storage/v1/object/**',
      },
    ],
  },

  webpack(config, { isServer }) {
    if (!isServer) {
      config.resolve ??= {};
      config.resolve.fallback ??= {};
      // Keep these if you have specific node polyfill needs, 
      // but often not needed if running on Vercel
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        crypto: false,
      };
    }
    return config;
  },
};

export default nextConfig;