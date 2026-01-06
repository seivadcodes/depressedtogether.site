// src/hooks/usePresence.ts
import { useEffect } from 'react';
import { createClient } from '@/lib/supabase';

export function usePresence(userId: string | null) {
  useEffect(() => {
    if (!userId) return;

    const supabase = createClient();

    const updateLastSeen = () => {
      supabase
        .from('profiles')
        .update({ last_seen: new Date().toISOString() })
        .eq('id', userId);
    };

    // Update on active session start
    updateLastSeen();

    // Keep updating while user is active
    const interval = setInterval(updateLastSeen, 45_000); // every 45s

    const handleVisibilityChange = () => {
      if (!document.hidden) {
        updateLastSeen();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [userId]);
}