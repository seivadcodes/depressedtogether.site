'use client';

import { useParams } from 'next/navigation';
import { useEffect, useState, useRef } from 'react';
import { createClient } from '@/lib/supabase';

type CommunityMessage = {
  id: string;
  sender_id: string;
  content: string;
  created_at: string;
  community_id: string;
};

type Member = {
  user_id: string;
  full_name: string | null;
  avatar_url: string | null;
  last_online: string | null;
  is_anonymous: boolean;
};

export default function CommunityChatTest() {
  const params = useParams();
  const communityId = params.communityId as string;
  const [messages, setMessages] = useState<CommunityMessage[]>([]);
  const [input, setInput] = useState('');
  const wsRef = useRef<WebSocket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const existingMessageIds = useRef<Set<string>>(new Set());

  const supabase = createClient();
  const [userId, setUserId] = useState<string | null>(null);
  const [username, setUsername] = useState('Anonymous');
  const [onlineMembers, setOnlineMembers] = useState<Member[]>([]);

  // --- FETCH CURRENT USER ---
  useEffect(() => {
    const fetchUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setUserId(session.user.id);
        const { data } = await supabase
          .from('profiles')
          .select('full_name')
          .eq('id', session.user.id)
          .single();
        setUsername(data?.full_name || 'Anonymous');
      }
    };
    fetchUser();
  }, [supabase]);

  // --- LOAD EXISTING MESSAGES ---
  useEffect(() => {
    const loadMessages = async () => {
      const { data, error } = await supabase
        .from('community_messages')
        .select('*')
        .eq('community_id', communityId)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Failed to load messages:', error);
      } else {
        setMessages(data || []);
        existingMessageIds.current = new Set(data?.map(m => m.id) || []);
      }
    };

    if (communityId) loadMessages();
  }, [communityId, supabase]);

  // --- FETCH ONLINE MEMBERS (every 30s) — MATCHES MAIN PAGE LOGIC ---
  useEffect(() => {
    const fetchOnlineMembers = async () => {
      const { data, error } = await supabase
        .from('community_members')
        .select(`
          user_id,
          user:profiles!inner (
            id,
            full_name,
            avatar_url,
            last_online,
            is_anonymous
          )
        `)
        .eq('community_id', communityId);

      if (error) {
        console.error('Failed to fetch members:', error);
        return;
      }

      const membersWithProfiles = data.map((row) => {
        const profile = Array.isArray(row.user) ? row.user[0] ?? null : row.user;
        return {
          user_id: row.user_id,
          full_name: profile?.full_name ?? null,
          avatar_url: profile?.avatar_url ?? null,
          last_online: profile?.last_online ?? null,
          is_anonymous: profile?.is_anonymous ?? false,
        };
      });

      // 🔥 CRITICAL: Use 60 seconds (same as your WebSocket & online_counts view)
      const now = new Date();
      const online = membersWithProfiles.filter((m) => {
        if (!m.last_online) return false;
        const lastSeen = new Date(m.last_online);
        return (now.getTime() - lastSeen.getTime()) < 60_000; // 60 seconds
      });

      setOnlineMembers(online);
    };

    if (communityId) {
      fetchOnlineMembers();
      const interval = setInterval(fetchOnlineMembers, 30_000);
      return () => clearInterval(interval);
    }
  }, [communityId, supabase]);

  // --- WEBSOCKET FOR REAL-TIME MESSAGES ---
  useEffect(() => {
    if (!userId || !communityId) return;

    const wsUrl = `wss://livekit.survivingdeathloss.site/notify?userId=${userId}&communityId=${encodeURIComponent(communityId)}`;
    const ws = new WebSocket(wsUrl);

    ws.onopen = () => console.log('✅ Connected to community chat');
    ws.onmessage = async (event) => {
      try {
        const data = JSON.parse(event.data.toString());
        if (data.type === 'new_community_message') {
          const msg = data.message;
          if (existingMessageIds.current.has(msg.id)) {
            console.log('💡 Message already exists, skipping:', msg.id);
            return;
          }
          setMessages(prev => [...prev, msg]);
          existingMessageIds.current.add(msg.id);
        }
      } catch (e) {
        console.error('Invalid WS message:', e);
      }
    };
    ws.onerror = (err) => console.error('WebSocket error:', err);
    ws.onclose = () => console.log('WebSocket closed');

    wsRef.current = ws;
    return () => ws.close();
  }, [userId, communityId]);

  // --- AUTO-SCROLL TO BOTTOM ---
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // --- SEND MESSAGE ---
  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !userId || !communityId) return;

    const { data: newMessage, error } = await supabase
      .from('community_messages')
      .insert({
        sender_id: userId,
        content: input.trim(),
        community_id: communityId,
      })
      .select()
      .single();

    if (error) {
      console.error('DB insert failed:', error);
      return;
    }

    setMessages(prev => [...prev, newMessage]);
    existingMessageIds.current.add(newMessage.id);
    setInput('');

    try {
      await fetch('/api/notify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'new_community_message',
          communityId,
          message: newMessage,
        }),
      });
    } catch (err) {
      console.error('Broadcast failed:', err);
    }
  };

  // --- RENDER ---
  return (
    <div style={{ display: 'flex', gap: '24px', padding: '20px', maxWidth: '900px', margin: '0 auto' }}>
      {/* Chat Area */}
      <div style={{ flex: 1 }}>
        <h1>Community Chat Test</h1>
        <p>Community: <code>{communityId}</code></p>

        <div
          style={{
            height: '400px',
            border: '1px solid #ccc',
            borderRadius: '8px',
            padding: '10px',
            overflowY: 'auto',
            marginBottom: '16px',
            backgroundColor: '#f9f9f9',
          }}
        >
          {messages.length === 0 ? (
            <p style={{ color: '#999' }}>No messages yet...</p>
          ) : (
            messages.map((msg, i) => (
              <div key={`${msg.id}-${i}`} style={{ marginBottom: '12px' }}>
                <strong>{username}</strong>: {msg.content}
                <div style={{ fontSize: '0.8em', color: '#666' }}>
                  {new Date(msg.created_at).toLocaleTimeString()}
                </div>
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>

        <form onSubmit={handleSend}>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type a message..."
            style={{
              width: '70%',
              padding: '8px',
              marginRight: '8px',
              border: '1px solid #ddd',
              borderRadius: '4px',
            }}
          />
          <button
            type="submit"
            disabled={!input.trim()}
            style={{
              padding: '8px 16px',
              backgroundColor: '#4f46e5',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
            }}
          >
            Send
          </button>
        </form>
      </div>

      {/* Online Members Sidebar — ACCURATE */}
      <div style={{ width: '200px' }}>
        <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '8px' }}>
          👥 Online ({onlineMembers.length})
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {onlineMembers.length === 0 ? (
            <p style={{ fontSize: '0.875rem', color: '#666' }}>No one online</p>
          ) : (
            onlineMembers.map((member) => (
              <div
                key={member.user_id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '6px',
                  borderRadius: '6px',
                  backgroundColor: '#f1f5f9',
                }}
              >
                <div
                  style={{
                    width: '24px',
                    height: '24px',
                    borderRadius: '50%',
                    backgroundColor: member.avatar_url ? 'transparent' : '#cbd5e1',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '0.75rem',
                    color: '#4b5563',
                  }}
                >
                  {member.avatar_url ? (
                    <img
                      src={member.avatar_url}
                      alt={member.full_name || 'User'}
                      style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }}
                    />
                  ) : (
                    (member.full_name || 'U')[0].toUpperCase()
                  )}
                </div>
                <span style={{ fontSize: '0.875rem', fontWeight: 500 }}>
                  {member.is_anonymous ? 'Anonymous' : member.full_name || 'Anonymous'}
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}