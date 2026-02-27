import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // ❌ REMOVE output: 'export' (We are not building a static app)
  
  images: {
    // ✅ You can keep remotePatterns for Supabase images
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'ydrrvvnpodbchxzynbkk.supabase.co',
        port: '',
        pathname: '/storage/v1/object/**',
      },
    ],
    // ✅ You can remove unoptimized: true unless you have a specific reason
  },

  webpack(config, { isServer }) {
    if (!isServer) {
      config.resolve ??= {};
      config.resolve.fallback ??= {};
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
      };
    }
    return config;
  },
};

export default nextConfig;