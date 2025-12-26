'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase';

// Minimal user type for calling purposes
interface CallUser {
  id: string;
  fullName: string;
}

// Call status types match your Supabase 'calls' table
type CallStatus = 'pending' | 'accepted' | 'rejected' | 'ended';

export default function CallPage() {
  const supabase = createClient();
  const router = useRouter();
  
  const [currentUser, setCurrentUser] = useState<{ id: string; fullName: string } | null>(null);
  const [users, setUsers] = useState<CallUser[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  
  const [incomingCall, setIncomingCall] = useState<{
    callerId: string;
    callerName: string;
    callId: string;
  } | null>(null);
  
  const [activeCall, setActiveCall] = useState<{
    peerName: string;
    isCaller: boolean;
  } | null>(null);
  
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize: check auth + load current user + other users
  useEffect(() => {
    const init = async () => {
      const { data: { session }, error: authError } = await supabase.auth.getSession();
      
      if (authError || !session?.user) {
        router.push('/auth');
        return;
      }

      // Fetch current user profile
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('id, full_name')
        .eq('id', session.user.id)
        .single();

      if (profileError || !profile) {
        setError('Failed to load your profile.');
        setIsLoading(false);
        return;
      }

      const currentUserData = {
        id: profile.id,
        fullName: profile.full_name || 'Friend',
      };
      setCurrentUser(currentUserData);

      // Fetch other users (limit for simplicity)
      const { data: otherUsers, error: usersError } = await supabase
        .from('profiles')
        .select('id, full_name')
        .neq('id', session.user.id)
        .limit(20);

      if (!usersError && otherUsers) {
        setUsers(
          otherUsers
            .filter((u: any) => u.full_name) // skip incomplete profiles
            .map((u: any) => ({
              id: u.id,
              fullName: u.full_name,
            }))
        );
      }

      setIsLoading(false);
    };

    init();
  }, [router]);

  // Listen for incoming calls via Supabase Realtime
  useEffect(() => {
    if (!currentUser) return;

    const channel = supabase
      .channel(`private-call-${currentUser.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'calls',
          filter: `callee_id=eq.${currentUser.id},status=eq.pending`,
        },
        (payload) => {
          const newCall = payload.new as {
            id: string;
            caller_id: string;
            callee_id: string;
            status: CallStatus;
          };

          // Find caller's name from loaded users
          const caller = users.find((u) => u.id === newCall.caller_id);
          if (caller) {
            setIncomingCall({
              callerId: newCall.caller_id,
              callerName: caller.fullName,
              callId: newCall.id,
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentUser, users]);

  const acceptCall = async () => {
    if (!incomingCall) return;

    try {
      const { error: updateError } = await supabase
        .from('calls')
        .update({ status: 'accepted' })
        .eq('id', incomingCall.callId);

      if (updateError) throw updateError;

      setActiveCall({
        peerName: incomingCall.callerName,
        isCaller: false,
      });
      setIncomingCall(null);
    } catch (err) {
      console.error('Accept call error:', err);
      setError('Failed to accept call. Please try again.');
    }
  };

  const rejectCall = async () => {
    if (!incomingCall) return;

    try {
      const { error: updateError } = await supabase
        .from('calls')
        .update({ status: 'rejected' })
        .eq('id', incomingCall.callId);

      if (updateError) throw updateError;

      setIncomingCall(null);
    } catch (err) {
      console.error('Reject call error:', err);
      setError('Failed to reject call.');
    }
  };

  const startCall = async () => {
    if (!currentUser || !selectedUserId) return;

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      const { data: newCall, error: insertError } = await supabase
        .from('calls')
        .insert({
          caller_id: currentUser.id,
          callee_id: selectedUserId,
          status: 'pending',
        })
        .select()
        .single();

      if (insertError) throw insertError;

      // Simulate callee accepting after short delay (replace with real signaling in production)
      setTimeout(() => {
        const callee = users.find((u) => u.id === selectedUserId);
        if (callee) {
          setActiveCall({
            peerName: callee.fullName,
            isCaller: true,
          });
        }
      }, 1500);
    } catch (err) {
      console.error('Start call error:', err);
      setError('Unable to start call. User may be offline.');
    }
  };

  const endCall = () => {
    // In real app: update call status + clean up media streams
    setActiveCall(null);
  };

  // ---- UI Rendering ----
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-gray-500 text-lg">Connecting...</div>
      </div>
    );
  }

  if (!currentUser) return null;

  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-50 to-white py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold text-gray-900">One-on-One Support Call</h1>
          <p className="text-gray-600 mt-2">Connect with others who understand</p>
        </div>

        {/* Incoming Call Banner */}
        {incomingCall && (
          <div className="mb-8 p-6 bg-gradient-to-r from-blue-50 to-indigo-50 border border-indigo-200 rounded-2xl shadow-sm animate-pulse">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold text-indigo-800">Incoming Audio Call</h2>
                <p className="text-gray-700">From: {incomingCall.callerName}</p>
              </div>
              <div className="flex space-x-3">
                <button
                  onClick={acceptCall}
                  className="bg-green-500 hover:bg-green-600 text-white font-medium py-2 px-5 rounded-lg flex items-center transition"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Accept
                </button>
                <button
                  onClick={rejectCall}
                  className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium py-2 px-5 rounded-lg transition"
                >
                  Reject
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Active Call View */}
        {activeCall ? (
          <div className="bg-indigo-600 rounded-3xl p-8 text-center text-white shadow-xl">
            <div className="mb-6">
              <div className="w-20 h-20 bg-indigo-300 rounded-full flex items-center justify-center mx-auto text-indigo-800 font-bold text-2xl border-4 border-white">
                {activeCall.peerName.charAt(0).toUpperCase()}
              </div>
              <h2 className="text-2xl font-bold mt-4">
                {activeCall.isCaller ? 'Calling' : 'Connected to'} {activeCall.peerName}
              </h2>
              <p className="text-indigo-200 mt-1">Audio call in progress</p>
            </div>

            <button
              onClick={endCall}
              className="bg-red-500 hover:bg-red-600 text-white font-bold py-3 px-8 rounded-full flex items-center mx-auto transition transform hover:scale-105"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5m6 11.25a3 3 0 01-3-3V4.5m6 0v8.25m0-8.25a3 3 0 00-3-3H6.75" />
              </svg>
              End Call
            </button>
          </div>
        ) : (
          // Dialer UI
          <div className="bg-white rounded-2xl shadow-md p-6 border border-gray-100">
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select someone to call
                </label>
                <select
                  value={selectedUserId}
                  onChange={(e) => setSelectedUserId(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="">— Choose a user —</option>
                  {users.map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.fullName}
                    </option>
                  ))}
                </select>
              </div>

              <button
                onClick={startCall}
                disabled={!selectedUserId}
                className={`w-full py-3 px-4 rounded-lg font-semibold text-white flex items-center justify-center transition ${
                  selectedUserId
                    ? 'bg-indigo-600 hover:bg-indigo-700 shadow'
                    : 'bg-gray-300 cursor-not-allowed'
                }`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
                Start Audio Call
              </button>

              <p className="text-center text-xs text-gray-500 mt-4">
                All calls are anonymous and recorded for community safety.
              </p>
            </div>
          </div>
        )}

        {error && (
          <div className="mt-6 p-4 bg-red-50 text-red-700 rounded-lg text-center border border-red-200">
            {error}
          </div>
        )}
      </div>
    </div>
  );
}