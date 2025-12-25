// src/hooks/useAuth.ts
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { User } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [sessionChecked, setSessionChecked] = useState(false);
  const router = useRouter();

  const signIn = useCallback(async (email: string, password: string) => {
    const supabase = createClient();
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return data;
  }, []);

  const signUp = useCallback(async (email: string, password: string) => {
    const supabase = createClient();
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: typeof window !== 'undefined' 
          ? `${window.location.origin}/auth/callback` 
          : undefined,
      },
    });
    if (error) throw error;
    return data;
  }, []);

  const signOut = useCallback(async () => {
    const supabase = createClient();
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    setUser(null);
    router.push('/auth');
  }, [router]);

  useEffect(() => {
    let isSubscribed = true;
    const supabase = createClient();

    // Clear any existing session data in localStorage that might be causing conflicts
    const clearStaleSession = () => {
      try {
        // This helps prevent redirect loops from stale session data
        if (typeof window !== 'undefined') {
          Object.keys(localStorage).forEach(key => {
            if (key.startsWith('supabase.auth.token') || 
                key.startsWith('supabase.session') || 
                key.startsWith('sb-')) {
              localStorage.removeItem(key);
            }
          });
        }
      } catch (e) {
        console.warn('Unable to clear stale session data:', e);
      }
    };

    // Initial session check
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (error) {
        console.error('Session error:', error);
        setLoading(false);
        setSessionChecked(true);
        return;
      }

      if (isSubscribed) {
        setUser(session?.user || null);
        setLoading(false);
        setSessionChecked(true);
      }
    });

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!isSubscribed) return;

      console.log('Auth state changed:', event);
      
      if (event === 'SIGNED_OUT') {
        setUser(null);
        setLoading(false);
        setSessionChecked(true);
        // Only redirect if we're currently on an auth-protected page
        const currentPath = window.location.pathname;
        if (!currentPath.startsWith('/auth') && !currentPath.startsWith('/onboarding')) {
          router.push('/auth');
        }
      } else if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        setUser(session?.user || null);
        setLoading(false);
        setSessionChecked(true);
      } else if (event === 'USER_UPDATED') {
        setUser(session?.user || null);
      }
      
      setLoading(false);
      setSessionChecked(true);
    });

    // Clear stale session data on initial load to prevent redirect loops
    clearStaleSession();

    return () => {
      isSubscribed = false;
      subscription.unsubscribe();
    };
  }, [router]);

  return { 
    user, 
    loading, 
    sessionChecked, // Added this to track when session has been fully checked
    signIn, 
    signUp, 
    signOut 
  };
}