'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { Phone, Users, User } from 'lucide-react';
import Link from 'next/link';

interface CallHistoryItem {
  id: string;
  type: 'one-on-one' | 'group';
  room_id: string;
  started_at: string;
  duration_seconds?: number;
  participants: {
    id: string;
    name: string;
  }[];
}

export default function CallHistoryPage() {
  const [calls, setCalls] = useState<CallHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClient();
  const router = useRouter();

  useEffect(() => {
    const fetchCallHistory = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          router.push('/auth');
          return;
        }
        const userId = session.user.id;

        // Fetch 1:1 calls where user was either caller or acceptor AND status = 'completed'
        const { data: oneOnOneCalls, error: oneOnError } = await supabase
          .from('quick_connect_requests')
          .select(`
            room_id,
            user_id,
            acceptor_id,
            call_started_at,
            call_ended_at
          `)
          .or(`user_id.eq.${userId},acceptor_id.eq.${userId}`)
          .eq('status', 'completed')
          .order('call_started_at', { ascending: false });

        if (oneOnError) throw oneOnError;

        // Fetch group calls where user participated
        const { data: groupCalls, error: groupError } = await supabase
          .from('quick_group_requests')
          .select(`
            room_id,
            user_id,
            call_started_at,
            call_ended_at
          `)
          .eq('status', 'completed')
          .order('call_started_at', { ascending: false });

        if (groupError) throw groupError;

        // Get all unique participant IDs for profile lookup
        const participantIds = new Set<string>();
        oneOnOneCalls.forEach(call => {
          participantIds.add(call.user_id);
          participantIds.add(call.acceptor_id);
        });
        groupCalls.forEach(call => {
          participantIds.add(call.user_id); // host
          // Note: full participant list would require joining room_participants
        });

        // Fetch profiles
        const { data: profiles, error: profileError } = await supabase
          .from('profiles')
          .select('id, full_name, email')
          .in('id', Array.from(participantIds));

        if (profileError) throw profileError;

        const profileMap = new Map(
          profiles.map(p => [
            p.id,
            p.full_name || p.email || 'Anonymous'
          ])
        );

        // Build history items
        const historyItems: CallHistoryItem[] = [];

        // Process 1:1 calls
        for (const call of oneOnOneCalls) {
          if (!call.call_started_at) continue;
          const otherId = call.user_id === userId ? call.acceptor_id : call.user_id;
          const otherName = profileMap.get(otherId) || 'Unknown';
          const duration = call.call_ended_at && call.call_started_at
            ? Math.floor(
                (new Date(call.call_ended_at).getTime() - new Date(call.call_started_at).getTime()) / 1000
              )
            : undefined;

          historyItems.push({
            id: call.room_id,
            type: 'one-on-one',
            room_id: call.room_id,
            started_at: call.call_started_at,
            duration_seconds: duration,
            participants: [{ id: otherId, name: otherName }],
          });
        }

        // Process group calls
        for (const call of groupCalls) {
          if (!call.call_started_at) continue;
          const hostName = profileMap.get(call.user_id) || 'Host';
          const duration = call.call_ended_at && call.call_started_at
            ? Math.floor(
                (new Date(call.call_ended_at).getTime() - new Date(call.call_started_at).getTime()) / 1000
              )
            : undefined;

          historyItems.push({
            id: call.room_id,
            type: 'group',
            room_id: call.room_id,
            started_at: call.call_started_at,
            duration_seconds: duration,
            participants: [{ id: call.user_id, name: hostName }],
          });
        }

        // Sort by started_at descending
        historyItems.sort((a, b) =>
          new Date(b.started_at).getTime() - new Date(a.started_at).getTime()
        );

        setCalls(historyItems);
      } catch (err) {
        console.error('Failed to load call history:', err);
        setError('Unable to load call history.');
      } finally {
        setLoading(false);
      }
    };

    fetchCallHistory();
  }, [supabase, router]);

  const formatDuration = (seconds?: number): string => {
    if (seconds == null) return '—';
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    if (h > 0) return `${h}h ${m}m`;
    if (m > 0) return `${m}m ${s}s`;
    return `${s}s`;
  };

  const formatDate = (isoString: string): string => {
    const date = new Date(isoString);
    return date.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 pt-16 px-4 flex items-center justify-center">
        <p className="text-gray-600">Loading call history...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 pt-16 px-4 flex flex-col items-center justify-center">
        <Phone className="w-12 h-12 text-red-500 mb-4" />
        <h2 className="text-xl font-semibold text-gray-800 mb-2">Oops!</h2>
        <p className="text-gray-600 text-center max-w-md">{error}</p>
        <button
          onClick={() => router.refresh()}
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-16 pb-8 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-bold text-gray-900">Call History</h1>
          <p className="text-gray-600 mt-1">Past conversations that mattered</p>
        </div>

        {calls.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm p-6 text-center">
            <Phone className="w-10 h-10 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-500">No calls yet.</p>
            <Link href="/connect" className="text-blue-600 hover:underline mt-2 inline-block">
              Start a new connection
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {calls.map((call) => (
              <div
                key={call.id}
                className="bg-white rounded-xl shadow-sm p-4 flex items-start gap-4 hover:shadow-md transition-shadow"
              >
                <div className="mt-1">
                  {call.type === 'group' ? (
                    <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
                      <Users className="w-5 h-5 text-purple-600" />
                    </div>
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                      <User className="w-5 h-5 text-blue-600" />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline gap-2">
                    <h3 className="font-semibold text-gray-900 truncate">
                      {call.type === 'group' ? 'Group Support Call' : call.participants[0].name}
                    </h3>
                    <span className="text-xs text-gray-500">
                      {call.type === 'group' ? 'Group' : '1:1'}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500 mt-1">
                    {formatDate(call.started_at)}
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-sm font-mono text-gray-700">
                    {formatDuration(call.duration_seconds)}
                  </div>
                  <Link
                    href={`/room/${call.room_id}`}
                    className="text-xs text-blue-600 hover:underline mt-1 inline-block"
                  >
                    Rejoin
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}