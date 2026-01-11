'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';

interface Profile {
  id: string;
  full_name: string;
  email?: string | null;
}

interface WebSocketMessage {
  type: string;
  message?: string;
  [key: string]: unknown; // allows other optional fields safely
}

export default function TestWebSocketPage() {
  const { user, loading: authLoading } = useAuth();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [log, setLog] = useState<string[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [sending, setSending] = useState(false);
  const router = useRouter();

  const addLog = (msg: string) => {
    console.log('[TEST-WSS]', msg);
    setLog((prev) => [...prev, `${new Date().toLocaleTimeString()} - ${msg}`]);
  };

  // Fetch user list (for dropdown)
  useEffect(() => {
    if (authLoading || !user) return;

    const fetchProfiles = async () => {
      try {
        const supabase = createClient();
        const { data, error } = await supabase
          .from('profiles')
          .select('id, full_name, email')
          .order('full_name', { ascending: true });

        if (error) throw error;
        setProfiles(data || []);
      } catch (err) {
        addLog('❌ Failed to load user list');
      } finally {
        setLoadingUsers(false);
      }
    };

    fetchProfiles();
  }, [user, authLoading]);

  // Connect WebSocket
  useEffect(() => {
    if (authLoading || !user) return;

    const wsUrl = `ws://178.128.210.229:8084/?userId=${user.id}`;
    const socket = new WebSocket(wsUrl);

    socket.onopen = () => {
      addLog(`✅ Connected to signaling server as: ${user.id}`);
    };

    socket.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data.toString()) as WebSocketMessage;
        addLog(`📩 Received: ${JSON.stringify(msg)}`);
        if (msg.type === 'chat_hello' && typeof msg.message === 'string') {
          alert(`💬 ${msg.message}`);
        }
      } catch {
        addLog(`❌ Invalid message format: ${event.data}`);
      }
    };

    socket.onerror = () => {
      addLog('🔥 WebSocket error — check server or network');
    };

    socket.onclose = (closeEvent) => {
      addLog(`📴 WS closed (code: ${closeEvent.code})`);
    };

    return () => {
      if (socket.readyState === WebSocket.OPEN) {
        socket.close();
      }
    };
  }, [user, authLoading]);

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      router.replace('/auth');
    }
  }, [authLoading, user, router]);

  const handleSendHello = async () => {
    if (!user || !selectedUserId) {
      addLog('⚠️ Please select a user');
      return;
    }

    setSending(true);
    addLog(`📤 Sending hello to user: ${selectedUserId}`);

    try {
      const res = await fetch('/api/notify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'chat_hello',
          toUserId: selectedUserId,
          fromUserId: user.id,
          message: `${user.user_metadata.full_name || user.email} says hello!`,
        }),
      });

      const result = await res.json();
      if (res.ok) {
        addLog('✅ Message sent successfully');
      } else {
        addLog(`❌ API error: ${result.error || 'unknown'}`);
      }
    } catch (error) {
      const errMsg = error instanceof Error ? error.message : 'Network error';
      addLog(`💥 Send failed: ${errMsg}`);
    } finally {
      setSending(false);
    }
  };

  if (authLoading || loadingUsers) {
    return <div style={{ padding: '2rem' }}>Loading...</div>;
  }

  if (!user) return null;

  return (
    <div style={{ padding: '1.5rem', maxWidth: '600px', margin: '0 auto', fontFamily: 'sans-serif' }}>
      <h2>WebSocket Test with User List</h2>
      <p>Your ID: <code>{user.id}</code></p>

      <div style={{ marginTop: '1rem' }}>
        <label>Select a user:</label>
        <select
          value={selectedUserId}
          onChange={(e) => setSelectedUserId(e.target.value)}
          style={{
            width: '100%',
            padding: '0.5rem',
            marginTop: '0.5rem',
            borderRadius: '4px',
            border: '1px solid #ccc',
          }}
        >
          <option value="">-- Choose a user --</option>
          {profiles.map((profile) => (
            <option key={profile.id} value={profile.id}>
              {profile.full_name} {profile.email ? `(${profile.email})` : ''}
            </option>
          ))}
        </select>
      </div>

      <button
        onClick={handleSendHello}
        disabled={sending || !selectedUserId}
        style={{
          marginTop: '1rem',
          padding: '0.5rem 1rem',
          backgroundColor: sending ? '#ccc' : '#0070f3',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: sending ? 'not-allowed' : 'pointer',
        }}
      >
        {sending ? 'Sending...' : 'Send Hello'}
      </button>

      <h3 style={{ marginTop: '2rem' }}>Live Log:</h3>
      <div
        style={{
          height: '300px',
          overflowY: 'auto',
          padding: '0.75rem',
          backgroundColor: '#f9f9f9',
          border: '1px solid #eee',
          borderRadius: '4px',
          whiteSpace: 'pre-wrap',
          fontSize: '0.9rem',
        }}
      >
        {log.length === 0 ? 'Waiting for events...' : log.map((line, i) => <div key={i}>{line}</div>)}
      </div>
    </div>
  );
}