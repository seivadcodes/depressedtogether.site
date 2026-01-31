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
};

// Apply PWA wrapper
export default withPWA({
  ...nextConfig,
  pwa: {
    dest: "public",
    register: true,
    skipWaiting: true,
    disable: process.env.NODE_ENV === "development",
    // Optional: customize caching
    runtimeCaching: [
      {
        urlPattern: /^https:\/\/ydrrvvnpodbchxzynbkk\.supabase\.co\/storage\/v1\/object\/.*$/,
        handler: "CacheFirst",
        options: {
          cacheName: "supabase-images",
          expiration: {
            maxEntries: 100,
            maxAgeSeconds: 7 * 24 * 60 * 60, // 7 days
          },
        },
      },
      {
        urlPattern: /\/_next\/static\/.*/,
        handler: "CacheFirst",
        options: {
          cacheName: "next-static",
          expiration: {
            maxEntries: 100,
            maxAgeSeconds: 30 * 24 * 60 * 60, // 30 days
          },
        },
      },
      {
        urlPattern: /\.(png|svg|jpg|jpeg|webp|ico)$/,
        handler: "CacheFirst",
        options: {
          cacheName: "assets",
          expiration: {
            maxEntries: 50,
            maxAgeSeconds: 7 * 24 * 60 * 60,
          },
        },
      },
    ],
  },
});