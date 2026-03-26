// src/lib/supabase.ts
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { Preferences } from '@capacitor/preferences';

// Extend Window type to include Capacitor (from @capacitor/core)
declare global {
  interface Window {
    Capacitor?: {
      isNativePlatform?: () => boolean;
      // Add other Capacitor properties if needed
    };
  }
}

// Helper to detect Capacitor native environment
const isCapacitor = (): boolean => {
  if (typeof window === 'undefined') return false;
  return !!window.Capacitor;
};

// Create a storage adapter that works in both Capacitor and browser
const getStorage = () => {
  if (isCapacitor()) {
    // Capacitor native storage using Preferences
    return {
      getItem: async (key: string) => {
        try {
          const { value } = await Preferences.get({ key });
          return value;
        } catch (err) {
          console.warn('Preferences.get failed:', err);
          return null;
        }
      },
      setItem: async (key: string, value: string) => {
        try {
          await Preferences.set({ key, value });
        } catch (err) {
          console.warn('Preferences.set failed:', err);
        }
      },
      removeItem: async (key: string) => {
        try {
          await Preferences.remove({ key });
        } catch (err) {
          console.warn('Preferences.remove failed:', err);
        }
      },
    };
  } else {
    // Browser localStorage
    return {
      getItem: (key: string) => {
        try {
          return localStorage.getItem(key);
        } catch (err) {
          console.warn('localStorage.getItem failed:', err);
          return null;
        }
      },
      setItem: (key: string, value: string) => {
        try {
          localStorage.setItem(key, value);
        } catch (err) {
          console.warn('localStorage.setItem failed:', err);
        }
      },
      removeItem: (key: string) => {
        try {
          localStorage.removeItem(key);
        } catch (err) {
          console.warn('localStorage.removeItem failed:', err);
        }
      },
    };
  }
};

export const createClient = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      'Missing Supabase environment variables. Ensure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are set.'
    );
  }

  const storage = getStorage();

  return createSupabaseClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      storage,
      persistSession: true,
      autoRefreshToken: true,
    },
  });
};