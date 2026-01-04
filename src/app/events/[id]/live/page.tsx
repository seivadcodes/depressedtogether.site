// app/events/[id]/live/page.tsx
'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { 
  LiveKitRoom, 
  ParticipantTile,
  RoomAudioRenderer,
  ControlBar,
  useTracks,
  useParticipants,
  useChat,
  isTrackReference,
} from '@livekit/components-react';
import { Track } from 'livekit-client';

type Event = {
  id: string;
  title: string;
  host_id: string;
};

export default function LiveEventPage() {
  const params = useParams();
  const router = useRouter();
  const eventId = params.id as string;
  const [event, setEvent] = useState<Event | null>(null);
  const [hostName, setHostName] = useState<string>('Loading...');
  const [token, setToken] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeView, setActiveView] = useState<'chat' | 'participants'>('chat');
  const supabase = createClient();

  useEffect(() => {
    const initializeRoom = async () => {
      try {
        const { data: eventData, error: eventError } = await supabase
          .from('events')
          .select('id, title, host_id')
          .eq('id', eventId)
          .single();

        if (eventError) throw new Error('Failed to load event');
        setEvent(eventData);

        const { data: hostData } = await supabase
          .from('profiles')
          .select('full_name')
          .eq('id', eventData.host_id)
          .single();
        setHostName(hostData?.full_name || 'Host');

        const { data: { session } } = await supabase.auth.getSession();
        if (!session) throw new Error('You must be logged in to join');

        const { data: profile } = await supabase
          .from('profiles')
          .select('full_name')
          .eq('id', session.user.id)
          .single();
        
        const userName = profile?.full_name || session.user.email || 'Anonymous';

        const response = await fetch('/api/livekit/token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            room: eventId,
            identity: session.user.id,
            name: userName,
          }),
        });

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || 'Failed to get access token');
        }

        const { token } = await response.json();
        setToken(token);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
        console.error('Initialization error:', err);
      } finally {
        setIsLoading(false);
      }
    };

    initializeRoom();
  }, [eventId, supabase]);

  const handleLeave = () => {
    router.push(`/events/${eventId}`);
  };

  if (isLoading) {
    return (
      <div style={{ paddingTop: '4rem', padding: '1.5rem', textAlign: 'center' }}>
        <div style={{ animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite', fontSize: '1.5rem' }}>
          Joining live event...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ 
        paddingTop: '4rem', 
        padding: '1.5rem', 
        maxWidth: '42rem', 
        margin: '0 auto', 
        textAlign: 'center', 
        color: '#ef4444' 
      }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1rem' }}>Connection Failed</h1>
        <p style={{ fontSize: '1.125rem' }}>{error}</p>
        <button 
          onClick={() => window.location.reload()}
          style={{ 
            marginTop: '1.5rem', 
            padding: '0.5rem 1rem', 
            backgroundColor: '#3b82f6', 
            color: 'white', 
            borderRadius: '0.5rem',
            cursor: 'pointer'
          }}
        >
          Retry Connection
        </button>
      </div>
    );
  }

  if (!event) {
    return (
      <div style={{ paddingTop: '4rem', padding: '1.5rem', textAlign: 'center' }}>
        Event not found
      </div>
    );
  }

  if (!token) {
    return (
      <div style={{ paddingTop: '4rem', padding: '1.5rem', textAlign: 'center' }}>
        Preparing connection...
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#111827' }}>
      <div style={{ paddingTop: '4rem', padding: '1.5rem' }}>
        <div style={{ maxWidth: '80rem', margin: '0 auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <div>
              <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'white' }}>Live: {event.title}</h1>
              <p style={{ color: '#9ca3af', marginTop: '0.25rem' }}>Hosted by: {hostName}</p>
            </div>
            <div style={{ display: 'flex', gap: '1rem' }}>
              <button 
                onClick={() => setActiveView('chat')}
                style={{
                  padding: '0.5rem 1rem',
                  borderRadius: '0.5rem',
                  transition: 'background-color 0.2s',
                  backgroundColor: activeView === 'chat' ? '#2563eb' : '#1f2937',
                  color: activeView === 'chat' ? 'white' : '#d1d5db',
                  cursor: 'pointer'
                }}
              >
                Chat
              </button>
            </div>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: '80rem', margin: '0 auto', padding: '1.5rem', paddingBottom: '2rem' }}>
        <LiveKitRoom
          token={token}
          serverUrl={process.env.NEXT_PUBLIC_LIVEKIT_URL}
          audio={true}
          video={true}
          onDisconnected={() => setError('Disconnected from room')}
          style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 180px)' }}
        >
          <div style={{ display: 'flex', flex: 1, gap: '1.5rem', minHeight: 0, height: '100%' }}>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
              <div style={{ maxHeight: '60vh', backgroundColor: '#1f2937', borderRadius: '0.75rem', overflow: 'hidden', marginBottom: '1rem', flexShrink: 0 }}>
                <MainSpeaker hostId={event.host_id} />
              </div>
              
              <div style={{ maxHeight: '30vh', backgroundColor: '#1f2937', padding: '1rem', overflowY: 'auto', flexShrink: 0 }}>
                <h3 style={{ color: 'white', fontWeight: '600', marginBottom: '0.75rem' }}>Other Participants</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: '1rem', gridAutoRows: 'min-content' }}>
                  <OtherParticipants hostId={event.host_id} />
                </div>
              </div>
            </div>

            <div style={{ width: '24rem', backgroundColor: '#1f2937', borderRadius: '0.75rem', display: 'flex', flexDirection: 'column', overflow: 'hidden', flexShrink: 0 }}>
              <CustomChat />
            </div>
          </div>
          
          <div style={{ marginTop: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'inline-block' }}>
              <ControlBar 
                controls={{ microphone: true, camera: true, screenShare: true }}
                variation='minimal'
                style={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '0.5rem' }}
              />
            </div>
            <button
              onClick={handleLeave}
              style={{
                padding: '0.625rem 1.25rem',
                backgroundColor: '#dc2626',
                color: 'white',
                borderRadius: '0.5rem',
                cursor: 'pointer',
                marginLeft: '0.75rem'
              }}
            >
              Leave Room
            </button>
          </div>
          <RoomAudioRenderer />
        </LiveKitRoom>
      </div>
    </div>
  );
}

function MainSpeaker({ hostId }: { hostId: string }) {
  const participants = useParticipants();
  const host = participants.find(p => p.identity === hostId);
  const mainParticipant = host || participants[0];

  const cameraTracks = useTracks([Track.Source.Camera]);
  const trackRef = cameraTracks.find(track => 
    isTrackReference(track) && track.participant.identity === mainParticipant?.identity
  );

  if (!mainParticipant) {
    return (
      <div style={{ height: '100%', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#111827' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: '8rem', height: '8rem', margin: '0 auto', borderRadius: '9999px', backgroundColor: '#374151', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem' }}>
            <svg style={{ width: '4rem', height: '4rem', color: '#4b5563' }} fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
            </svg>
          </div>
          <p style={{ color: '#9ca3af' }}>Waiting for host to join...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ height: '100%', width: '100%', position: 'relative', backgroundColor: '#111827' }}>
     {trackRef && isTrackReference(trackRef) && (
  <video
    ref={(el) => {
      if (el && trackRef.publication?.track) {
        el.srcObject = new MediaStream([trackRef.publication.track.mediaStreamTrack]);
        el.play().catch(console.error);
      }
    }}
    style={{
      height: '100%',
      width: '100%',
      objectFit: 'cover',
      objectPosition: 'center',
      display: 'block',
      backgroundColor: '#000'
    }}
  />
)}
      <div style={{ position: 'absolute', bottom: '1rem', left: '1rem', backgroundColor: 'rgba(0,0,0,0.5)', color: 'white', padding: '0.25rem 0.75rem', borderRadius: '0.5rem' }}>
        {mainParticipant.name || mainParticipant.identity}
        {mainParticipant.identity === hostId && (
          <span style={{ marginLeft: '0.5rem', padding: '0.125rem 0.5rem', fontSize: '0.75rem', backgroundColor: '#3b82f6', borderRadius: '0.25rem' }}>Host</span>
        )}
      </div>
    </div>
  );
}

function OtherParticipants({ hostId }: { hostId: string }) {
  const allCameraTracks = useTracks([Track.Source.Camera]);
  
  const otherTracks = allCameraTracks.filter(track => 
    isTrackReference(track) && track.participant.identity !== hostId
  );

  const placeholderCount = Math.max(0, 3 - otherTracks.length);

  return (
    <>
      {otherTracks.map((trackRef) => (
        <div 
          key={trackRef.participant.sid} 
          style={{ 
            aspectRatio: '16 / 9', 
            backgroundColor: '#111827', 
            borderRadius: '0.5rem', 
            overflow: 'hidden', 
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          {isTrackReference(trackRef) && (
            <ParticipantTile
              trackRef={trackRef}
              style={{
                height: '100%',
                width: '100%',
                objectFit: 'contain',
                display: 'block'
              }}
            />
          )}
          <div style={{ 
            position: 'absolute', 
            bottom: '0.25rem', 
            left: '0.25rem', 
            right: '0.25rem', 
            backgroundColor: 'rgba(0,0,0,0.5)', 
            color: 'white', 
            fontSize: '0.75rem', 
            padding: '0.25rem 0.5rem', 
            borderRadius: '0.25rem',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap'
          }}>
            {trackRef.participant.name || trackRef.participant.identity}
          </div>
        </div>
      ))}
      
      {Array.from({ length: placeholderCount }).map((_, i) => (
        <div 
          key={`placeholder-${i}`} 
          style={{ 
            aspectRatio: '16 / 9', 
            backgroundColor: '#111827', 
            borderRadius: '0.5rem', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center' 
          }}
        >
          <svg style={{ width: '2rem', height: '2rem', color: '#374151' }} fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
          </svg>
        </div>
      ))}
    </>
  );
}

function CustomChat() {
  const { chatMessages, send } = useChat();
  const [message, setMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [chatMessages]);

  const handleSend = () => {
    if (message.trim()) {
      send(message);
      setMessage('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ padding: '1rem', borderBottom: '1px solid #374151', flexShrink: 0 }}>
        <h3 style={{ color: 'white', fontWeight: '600' }}>Live Chat</h3>
        <p style={{ color: '#9ca3af', fontSize: '0.875rem' }}>Send messages to everyone</p>
      </div>

      <div style={{ 
        flex: 1, 
        overflowY: 'auto', 
        padding: '1rem', 
        display: 'flex', 
        flexDirection: 'column', 
        gap: '1rem',
        maxHeight: '400px'
      }}>
        {chatMessages.length === 0 ? (
          <div style={{ textAlign: 'center', color: '#6b7280', marginTop: '2rem' }}>
            <svg style={{ width: '3rem', height: '3rem', margin: '0 auto 0.75rem', color: '#4b5563' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            <p>No messages yet. Start the conversation!</p>
          </div>
        ) : (
          <>
            {chatMessages.map((msg, idx) => (
              <div 
                key={idx} 
                style={{
                  padding: '0.75rem',
                  borderRadius: '0.5rem',
                  maxWidth: '85%',
                  marginLeft: msg.from?.isLocal ? 'auto' : '0',
                  backgroundColor: msg.from?.isLocal ? '#2563eb' : '#374151',
                  alignSelf: msg.from?.isLocal ? 'flex-end' : 'flex-start'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                  <span style={{ fontWeight: '600', fontSize: '0.875rem', color: msg.from?.isLocal ? '#dbeafe' : '#d1d5db' }}>
                    {msg.from?.name || 'Anonymous'}
                  </span>
                  <span style={{ fontSize: '0.75rem', opacity: 0.75 }}>
                    {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <p style={{ color: 'white', wordBreak: 'break-word' }}>{msg.message}</p>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      <div style={{ padding: '1rem', borderTop: '1px solid #374151', flexShrink: 0 }}>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyPress}
            placeholder="Type your message..."
            style={{
              flex: 1,
              backgroundColor: '#374151',
              color: 'white',
              borderRadius: '0.5rem',
              padding: '0.75rem 1rem',
              border: 'none',
              outline: 'none',
              resize: 'none',
              minHeight: '2.5rem',
              fontSize: '0.875rem'
            }}
            rows={2}
          />
          <button
            onClick={handleSend}
            disabled={!message.trim()}
            style={{
              alignSelf: 'flex-end',
              padding: '0.75rem 1.5rem',
              backgroundColor: '#2563eb',
              color: 'white',
              borderRadius: '0.5rem',
              border: 'none',
              cursor: message.trim() ? 'pointer' : 'not-allowed',
              opacity: message.trim() ? 1 : 0.5,
              fontSize: '0.875rem'
            }}
          >
            Send
          </button>
        </div>
        <p style={{ color: '#9ca3af', fontSize: '0.75rem', marginTop: '0.5rem' }}>
          Press Enter to send, Shift+Enter for new line
        </p>
      </div>
    </div>
  );
}