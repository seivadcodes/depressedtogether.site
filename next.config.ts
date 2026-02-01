import type { NextConfig } from "next";
import withPWA from "next-pwa";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "ydrrvvnpodbchxzynbkk.supabase.co",
        port: "",
        pathname: "/storage/v1/object/**",
      },
    ],
  },
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
      };
    }
    return config;
  },
  experimental: {
    // webVitalsAttribution: ['CLS', 'LCP'],
  },
};

// Wrap with next-pwa for automatic service worker + caching
export default withPWA({
  dest: "public", // outputs sw.js to /public/sw.js
  register: true, // auto-injects SW registration script
  skipWaiting: true, // activate new SW immediately
  disable: process.env.NODE_ENV === "development", // no SW in dev mode
  // Optional: cache strategies for better offline support
  runtimeCaching: [
    {
      urlPattern: /^https:\/\/depressedtogether\.site\/icons\/.*\.(png|jpg|jpeg|webp)$/i,
      handler: "CacheFirst",
      options: {
        cacheName: "app-icons",
        expiration: {
          maxEntries: 20,
          maxAgeSeconds: 7 * 24 * 60 * 60, // 7 days
        },
      },
    },
    {
      urlPattern: /^https:\/\/depressedtogether\.site\/_next\/static\/.*$/i,
      handler: "CacheFirst",
      options: {
        cacheName: "next-static",
        expiration: {
          maxEntries: 50,
          maxAgeSeconds: 30 * 24 * 60 * 60, // 30 days
        },
      },
    },
    {
      urlPattern: /^https:\/\/.*\.(js|css)$/i,
      handler: "StaleWhileRevalidate",
      options: {
        cacheName: "static-assets",
      },
    },
  ],
})(nextConfig);