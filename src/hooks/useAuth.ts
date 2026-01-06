// src/hooks/useAuth.ts
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { User } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase';

// Helper to ensure profile exists and has full_name + last_seen
async function ensureProfileExists(user: User) {
  if (!user?.id) return;

  const supabase = createClient();

  const { data: existingProfile, error: fetchError } = await supabase
    .from('profiles')
    .select('id')
    .eq('id', user.id)
    .single();

  const now = new Date().toISOString();
  const metadata = user.user_metadata;
  const fullName =
    (typeof metadata?.full_name === 'string' ? metadata.full_name : null) ||
    user.email?.split('@')[0] ||
    'Friend';

  if (fetchError?.code === 'PGRST116') {
    // Profile doesn't exist → create it with last_seen
    const { error: insertError } = await supabase
      .from('profiles')
      .insert({
        id: user.id,
        email: user.email,
        full_name: fullName,
        last_seen: now, // ✅ Set on signup
        created_at: now,
        // Add default values for other required fields if needed
        grief_types: [],
        accepts_calls: true,
        accepts_video_calls: false,
        is_anonymous: false,
        accept_from_genders: ['any'],
        accept_from_countries: [],
        accept_from_languages: [],
      });

    if (insertError && insertError.code !== '23505') {
      console.error('Failed to create profile:', insertError);
    }
  } else if (existingProfile) {
    // Profile exists → update last_seen on every auth event
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ last_seen: now })
      .eq('id', user.id);

    if (updateError) {
      console.warn('Failed to update last_seen:', updateError);
    }
  }
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [sessionChecked, setSessionChecked] = useState(false);
  const router = useRouter();

  const signIn = useCallback(async (email: string, password: string) => {
    const supabase = createClient();
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
    return data;
  }, []);

  const signUp = useCallback(
    async (email: string, password: string, fullName?: string) => {
      const supabase = createClient();
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: fullName },
          emailRedirectTo: typeof window !== 'undefined'
            ? `${window.location.origin}/auth/callback`
            : undefined,
        },
      });
      if (error) throw error;
      return data;
    },
    []
  );

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

    const clearStaleSession = () => {
      try {
        if (typeof window !== 'undefined') {
          Object.keys(localStorage).forEach((key) => {
            if (
              key.startsWith('supabase.auth.token') ||
              key.startsWith('supabase.session') ||
              key.startsWith('sb-')
            ) {
              localStorage.removeItem(key);
            }
          });
        }
      } catch (e) {
        console.warn('Unable to clear stale session data:', e);
      }
    };

    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (error) {
        console.error('Session error:', error);
        if (isSubscribed) {
          setLoading(false);
          setSessionChecked(true);
        }
        return;
      }

      if (isSubscribed && session?.user) {
        ensureProfileExists(session.user); // ✅ Updates last_seen
        setUser(session.user);
      } else if (isSubscribed) {
        setUser(null);
      }

      if (isSubscribed) {
        setLoading(false);
        setSessionChecked(true);
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (!isSubscribed) return;

      if (event === 'SIGNED_OUT') {
        setUser(null);
        setLoading(false);
        setSessionChecked(true);
        const currentPath = window.location.pathname;
        if (
          !currentPath.startsWith('/auth') &&
          !currentPath.startsWith('/onboarding')
        ) {
          router.push('/auth');
        }
      } else if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED') {
        if (session?.user) {
          ensureProfileExists(session.user); // ✅ Always refresh last_seen on auth events
          setUser(session.user);
        }
        setLoading(false);
        setSessionChecked(true);
      }
    });

    clearStaleSession();

    return () => {
      isSubscribed = false;
      subscription.unsubscribe();
    };
  }, [router]);

  return {
    user,
    loading,
    sessionChecked,
    signIn,
    signUp,
    signOut,
  };
}