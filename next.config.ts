import type { NextConfig } from "next";

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
  // Add webpack configuration for service worker support
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
      };
    }
    return config;
  },
  // Optional: Add experimental features if needed
  experimental: {
    // Enable if you're using app directory features
    // webVitalsAttribution: ['CLS', 'LCP'],
  },
};

export default nextConfig;