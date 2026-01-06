// src/app/presence/page.tsx
'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase';
import { GriefType } from '../dashboard/useDashboardLogic';
import Image from 'next/image';

interface OnlineUser {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  grief_types: GriefType[] | null;
  last_seen: string;
  is_online: boolean;
}

export default function PresencePage() {
  const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const supabase = createClient();

  const fetchOnlineUsers = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const cutoff = new Date(Date.now() - 60_000).toISOString();

      const { data, error: fetchError } = await supabase
        .from('profiles')
        .select('id, full_name, avatar_url, grief_types, last_seen')
        .gte('last_seen', cutoff)
        .order('last_seen', { ascending: false });

      if (fetchError) throw fetchError;

      const enriched = data.map((user) => ({
        ...user,
        is_online: new Date(user.last_seen) > new Date(Date.now() - 60_000),
      }));

      setOnlineUsers(enriched);
      setLastUpdated(new Date());
    } catch (err) {
      console.error('Failed to fetch online users:', err);
      setError('Unable to load online users. Please try again later.');
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    fetchOnlineUsers();
    const interval = setInterval(fetchOnlineUsers, 30_000);
    return () => clearInterval(interval);
  }, [fetchOnlineUsers]);

  const formatLastSeen = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  if (loading && onlineUsers.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <p className="text-gray-600">Checking who’s online...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6">
      <div className="max-w-3xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Active Users</h1>
          {lastUpdated && (
            <p className="text-sm text-gray-500 mt-1">
              Last updated: {lastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </p>
          )}
        </div>

        {error ? (
          <div className="bg-red-50 text-red-700 p-4 rounded-lg">{error}</div>
        ) : onlineUsers.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-6 text-center">
            <p className="text-gray-600">No users are currently active.</p>
          </div>
        ) : (
          <ul className="space-y-4">
            {onlineUsers.map((user) => (
              <li
                key={user.id}
                className="bg-white rounded-lg shadow p-4 flex items-center gap-4"
              >
                <div className="relative">
                  {user.avatar_url ? (
                    <div className="w-12 h-12 rounded-full border-2 border-green-400 overflow-hidden">
                      <Image
                        src={user.avatar_url}
                        alt={user.full_name || 'User'}
                        width={48}
                        height={48}
                        className="object-cover"
                      />
                    </div>
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center border-2 border-green-400">
                      <span className="text-gray-600 font-medium">
                        {user.full_name?.charAt(0)?.toUpperCase() || '?'}
                      </span>
                    </div>
                  )}
                  <span className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-white rounded-full"></span>
                </div>
                <div className="flex-1 min-w-0">
                  <h2 className="text-lg font-semibold text-gray-900 truncate">
                    {user.full_name || 'Anonymous'}
                  </h2>
                  {user.grief_types && user.grief_types.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1">
                      {user.grief_types.slice(0, 3).map((type) => (
                        <span
                          key={type}
                          className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800"
                        >
                          {type}
                        </span>
                      ))}
                      {user.grief_types.length > 3 && (
                        <span className="text-xs text-gray-500">
                          +{user.grief_types.length - 3}
                        </span>
                      )}
                    </div>
                  )}
                  <p className="text-sm text-gray-500 mt-1">
                    Active at {formatLastSeen(user.last_seen)}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}

        <div className="mt-8 text-center text-sm text-gray-500">
          <p>
            Users are marked online if active in the last 60 seconds.
            <br />
            Page refreshes every 30 seconds.
          </p>
        </div>
      </div>
    </div>
  );
}