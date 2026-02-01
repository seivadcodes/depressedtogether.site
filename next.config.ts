import type { NextConfig } from 'next';
import withPWA from 'next-pwa';

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'ydrrvvnpodbchxzynbkk.supabase.co',
        port: '',
        pathname: '/storage/v1/object/**',
      },
    ],
  },

  // Keep your webpack config — required for PWA
  webpack(config, { isServer }) {
    if (!isServer) {
      if (!config.resolve) config.resolve = {};
      if (!config.resolve.fallback) config.resolve.fallback = {};
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
      };
    }
    return config;
  },

  // 👇 Add this to silence the Turbopack warning
  turbopack: {},
};

// Wrap with PWA (which injects Webpack plugins)
export default withPWA({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development',
  runtimeCaching: [
    {
      urlPattern: /^https:\/\/depressedtogether\.site\/icons\/.*\.(png|jpg|jpeg|webp)$/i,
      handler: 'CacheFirst',
      options: {
        cacheName: 'app-icons',
        expiration: {
          maxEntries: 20,
          maxAgeSeconds: 7 * 24 * 60 * 60,
        },
      },
    },
    {
      urlPattern: /^https:\/\/depressedtogether\.site\/_next\/static\/.*$/i,
      handler: 'CacheFirst',
      options: {
        cacheName: 'next-static',
        expiration: {
          maxEntries: 50,
          maxAgeSeconds: 30 * 24 * 60 * 60,
        },
      },
    },
    {
      urlPattern: /^https:\/\/.*\.(js|css)$/i,
      handler: 'StaleWhileRevalidate',
      options: {
        cacheName: 'static-assets',
      },
    },
  ],
})(nextConfig);