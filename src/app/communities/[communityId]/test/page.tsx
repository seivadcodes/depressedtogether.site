// app/communities/[communityId]/test/page.tsx
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

export default function CommunityChatTest() {
  const params = useParams();
  const communityId = params.communityId as string;
  const [messages, setMessages] = useState<CommunityMessage[]>([]);
  const [input, setInput] = useState('');
  const wsRef = useRef<WebSocket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const existingMessageIds = useRef<Set<string>>(new Set()); // 👈 Track known IDs

  const supabase = createClient();
  const [userId, setUserId] = useState<string | null>(null);
  const [username, setUsername] = useState('Anonymous');

  // Fetch current user
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

  // Load existing messages
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
        // Initialize known IDs
        existingMessageIds.current = new Set(data?.map(m => m.id) || []);
      }
    };

    if (communityId) loadMessages();
  }, [communityId, supabase]);

  // Connect WebSocket
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

          // 🔥 PREVENT DUPLICATE: check if already exists
          if (existingMessageIds.current.has(msg.id)) {
            console.log('💡 Message already exists, skipping:', msg.id);
            return;
          }

          // Add to state and track ID
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

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !userId || !communityId) return;

    // Insert into Supabase
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

    // 🔥 Add to UI and track ID
    setMessages(prev => [...prev, newMessage]);
    existingMessageIds.current.add(newMessage.id); // 👈 Mark as known

    setInput('');

    // Broadcast via signaling server
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

  return (
    <div style={{ padding: '20px', maxWidth: '600px', margin: '0 auto' }}>
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
            // ✅ Use composite key to guarantee uniqueness
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
  );
}