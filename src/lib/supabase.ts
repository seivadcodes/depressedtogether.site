// src/lib/supabase.ts
import { createBrowserClient } from '@supabase/ssr';
import type { SupabaseClient } from '@supabase/supabase-js';

export const createClient = (): SupabaseClient => {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        // ✅ Use localStorage explicitly for Capacitor WebView persistence
        storage: typeof window !== 'undefined' ? window.localStorage : undefined,
        autoRefreshToken: true,
        persistSession: true,
        // ✅ Critical for Capacitor: prevent Supabase from parsing auth callbacks from URL hash
        detectSessionInUrl: false,
        // ✅ Add a small delay to avoid race conditions on app resume
        flowType: 'pkce',
      },
      // ✅ Add timeout for network requests in mobile environments
      global: {
        fetch: async (url, options = {}) => {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 15000); // 15s timeout
          try {
            return await fetch(url, { ...options, signal: controller.signal });
          } finally {
            clearTimeout(timeoutId);
          }
        },
      },
    }
  );
};