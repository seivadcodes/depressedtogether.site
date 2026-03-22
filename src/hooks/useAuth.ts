'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { User } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase';

// Helper: Check if profile is marked as deleted
async function isProfileDeleted(userId: string): Promise<boolean> {
  const supabase = createClient();
  const { data } = await supabase
    .from('profiles')
    .select('deleted_at')
    .eq('id', userId)
    .single();
  
  return !!data?.deleted_at;
}

// Helper: Check if email is blacklisted
async function isEmailBanned(email: string): Promise<boolean> {
  const supabase = createClient();
  const { data } = await supabase
    .from('banned_emails')
    .select('email')
    .ilike('email', email.trim().toLowerCase())
    .maybeSingle();
  
  return !!data;
}

// Helper to ensure profile exists and has full_name + last_seen + country
async function ensureProfileExists(user: User) {
  if (!user?.id) return;

  const supabase = createClient();

  // ✅ Block if profile was deleted
  const { data: profileCheck } = await supabase
    .from('profiles')
    .select('deleted_at')
    .eq('id', user.id)
    .single();

  if (profileCheck?.deleted_at) {
    await supabase.auth.signOut();
    if (typeof window !== 'undefined') {
      window.location.href = '/auth?deleted=1';
    }
    return;
  }

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

  const country = typeof metadata?.country === 'string' ? metadata.country : null;

  if (fetchError?.code === 'PGRST116') {
    const { error: insertError } = await supabase
      .from('profiles')
      .insert({
        id: user.id,
        email: user.email,
        full_name: fullName,
        country,
        last_seen: now,
        created_at: now,
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
    
    // ✅ Check blacklist BEFORE attempting sign-in
    const banned = await isEmailBanned(email);
    if (banned) {
      throw new Error('This email address has been permanently disabled.');
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    if (error) throw error;
    
    // ✅ Check if profile was deleted AFTER successful sign-in
    if (data.user) {
      const deleted = await isProfileDeleted(data.user.id);
      if (deleted) {
        await supabase.auth.signOut();
        throw new Error('This account has been permanently deleted.');
      }
    }
    
    return data;
  }, []);

  const signUp = useCallback(
    async (
      email: string,
      password: string,
      fullName?: string,
      country?: string | null
    ) => {
      const supabase = createClient();
      
      // ✅ Check blacklist BEFORE allowing signup
      const banned = await isEmailBanned(email);
      if (banned) {
        throw new Error('This email address has been permanently disabled.');
      }
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            country: country || null,
          },
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
        // ✅ Check if user was deleted before loading profile
        isProfileDeleted(session.user.id).then((deleted) => {
          if (deleted) {
            supabase.auth.signOut();
            if (typeof window !== 'undefined') {
              window.location.href = '/auth?deleted=1';
            }
            return;
          }
          ensureProfileExists(session.user);
          setUser(session.user);
        });
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
    } = supabase.auth.onAuthStateChange(async (event, session) => {
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
      } else if (
        event === 'SIGNED_IN' ||
        event === 'TOKEN_REFRESHED' ||
        event === 'USER_UPDATED'
      ) {
        if (session?.user) {
          // ✅ Re-check deletion status on every auth event
          const deleted = await isProfileDeleted(session.user.id);
          if (deleted) {
            await supabase.auth.signOut();
            if (typeof window !== 'undefined') {
              window.location.href = '/auth?deleted=1';
            }
            return;
          }
          ensureProfileExists(session.user);
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