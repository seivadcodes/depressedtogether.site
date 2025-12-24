// src/app/call/[id]/page.tsx
'use client';

import { useParams, useRouter } from 'next/navigation';
import { useState, useRef, useEffect } from 'react';
import { Room, RemoteParticipant, Track } from 'livekit-client';
import { Loader2, Mic, MicOff, Video, VideoOff, PhoneOff, Users } from 'lucide-react';
import { createClient } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import Button from '@/components/ui/button';

type SessionType = 'one_on_one' | 'group';

interface Session {
  id: string;
  session_type: SessionType;
  title: string;
  host_id: string;
  status: 'pending' | 'active' | 'ended';
}

export default function CallPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const supabase = createClient();

  const sessionId = params?.id as string;
  const roomRef = useRef<Room | null>(null);
  const audioElementsRef = useRef<Map<string, HTMLAudioElement>>(new Map());
  const videoElementsRef = useRef<Map<string, HTMLVideoElement>>(new Map());

  const [session, setSession] = useState<Session | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [remoteParticipants, setRemoteParticipants] = useState<RemoteParticipant[]>([]);
  const [statusMessage, setStatusMessage] = useState('Connecting to the support space...');
  const [isMicMuted, setIsMicMuted] = useState(false);
  const [isCameraEnabled, setIsCameraEnabled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const log = (msg: string) => {
    console.log('[CallPage]', msg);
    setStatusMessage(msg);
  };

  const cleanupMediaElement = (identity: string, type: 'audio' | 'video') => {
    const ref = type === 'audio' ? audioElementsRef : videoElementsRef;
    const el = ref.current.get(identity);
    if (el) {
      if (type === 'audio' && el instanceof HTMLAudioElement) {
        el.pause();
        el.srcObject = null;
        el.remove();
      } else if (type === 'video' && el instanceof HTMLVideoElement) {
        el.pause();
        el.srcObject = null;
        el.remove();
      }
      ref.current.delete(identity);
    }
  };

  const cleanupAllMedia = () => {
    audioElementsRef.current.forEach((_, identity) => cleanupMediaElement(identity, 'audio'));
    videoElementsRef.current.forEach((_, identity) => cleanupMediaElement(identity, 'video'));
  };

  const fetchSession = async () => {
    if (!sessionId) {
      setError('Invalid session ID');
      return;
    }

    try {
      const { data, error } = await supabase
        .from('sessions')
        .select('*')
        .eq('id', sessionId)
        .single();

      if (error) throw error;
      setSession(data);
    } catch (err) {
      console.error('Failed to fetch session:', err);
      setError('Session not found or inaccessible.');
    } finally {
      setLoading(false);
    }
  };

  const connectToRoom = async () => {
    if (!user || !session) return;

    try {
      log('Requesting LiveKit token...');
      const res = await fetch('/api/livekit/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roomName: sessionId,
          isHost: session.host_id === user.id,
          sessionType: session.session_type,
        }),
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(`Token fetch failed: ${res.status} ${text}`);
      }

      const { token, url } = await res.json();
      if (!token || !url) {
        throw new Error('Missing token or LiveKit URL');
      }

      log('Connecting to LiveKit room...');
      const room = new Room();
      roomRef.current = room;

      // Track participants
      room.on('participantConnected', (participant) => {
        log(`${participant.identity} joined the room.`);
        setRemoteParticipants((prev) =>
          prev.some((p) => p.identity === participant.identity)
            ? prev
            : [...prev, participant]
        );
      });

      room.on('participantDisconnected', (participant) => {
        log(`${participant.identity} left the room.`);
        setRemoteParticipants((prev) =>
          prev.filter((p) => p.identity !== participant.identity)
        );
        cleanupMediaElement(participant.identity, 'audio');
        cleanupMediaElement(participant.identity, 'video');
      });

      // Handle tracks
      room.on('trackSubscribed', (track, publication, participant) => {
        if (publication.kind === 'audio') {
          let audioEl = audioElementsRef.current.get(participant.identity);
          if (!audioEl) {
            audioEl = document.createElement('audio');
            audioEl.setAttribute('playsinline', 'true');
            document.body.appendChild(audioEl);
            audioElementsRef.current.set(participant.identity, audioEl);
          }
          track.attach(audioEl);
          audioEl.play().catch(() => {
            // Autoplay may be blocked—acceptable
          });
        } else if (publication.kind === 'video') {
          let videoEl = videoElementsRef.current.get(participant.identity);
          if (!videoEl) {
            videoEl = document.createElement('video');
            videoEl.setAttribute('playsinline', 'true');
            videoEl.className = 'absolute inset-0 w-full h-full object-cover';
            const container = document.getElementById(`video-${participant.identity}`);
            if (container) {
              container.appendChild(videoEl);
            }
            videoElementsRef.current.set(participant.identity, videoEl);
          }
          track.attach(videoEl);
        }
      });

      room.on('trackUnsubscribed', (track, _, participant) => {
        track.detach();
        if (participant) {
          if (track.kind === 'audio') {
            cleanupMediaElement(participant.identity, 'audio');
          } else {
            cleanupMediaElement(participant.identity, 'video');
          }
        }
      });

      room.on('disconnected', () => {
        log('Disconnected from room.');
        setIsConnected(false);
        setRemoteParticipants([]);
        cleanupAllMedia();
      });

      await room.connect(url, token);
      log('Connected successfully!');

      // Enable local media
      await room.localParticipant.setMicrophoneEnabled(true);
      await room.localParticipant.setCameraEnabled(false); // Start with camera off

      setIsConnected(true);
      setStatusMessage('Connected — you’re in the support space.');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      console.error('[CallPage] Connection error:', err);
      setError(`Failed to join call: ${msg}`);
      log(`Error: ${msg}`);
    }
  };

  const disconnect = () => {
    if (roomRef.current) {
      roomRef.current.disconnect();
    }
    router.push('/connect');
  };

  const toggleMic = async () => {
    if (!roomRef.current) return;
    const newState = !isMicMuted;
    try {
      await roomRef.current.localParticipant.setMicrophoneEnabled(!newState);
      setIsMicMuted(newState);
    } catch (err) {
      console.error('Mic toggle error:', err);
    }
  };

  const toggleCamera = async () => {
    if (!roomRef.current) return;
    const newState = !isCameraEnabled;
    try {
      await roomRef.current.localParticipant.setCameraEnabled(newState);
      setIsCameraEnabled(newState);
    } catch (err) {
      console.error('Camera toggle error:', err);
    }
  };

  // Fetch session on mount
  useEffect(() => {
    fetchSession();
  }, [sessionId]);

  // Connect once session and user are ready
  useEffect(() => {
    if (user && session && !isConnected && !error) {
      connectToRoom();
    }
  }, [user, session, isConnected, error]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (roomRef.current) {
        roomRef.current.disconnect();
      }
      cleanupAllMedia();
    };
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-stone-50">
        <Loader2 className="h-10 w-10 animate-spin text-amber-500 mb-4" />
        <p className="text-stone-700">Entering your support space...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-stone-50 p-4">
        <div className="bg-white p-6 rounded-xl shadow max-w-md w-full text-center">
          <div className="text-red-500 mb-4">⚠️</div>
          <p className="text-stone-800 mb-4">{error}</p>
          <Button onClick={() => router.push('/connect')} className="w-full">
            Back to Connect
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-900 text-white relative">
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-10 p-4 flex justify-between items-center bg-black/30 backdrop-blur">
        <div>
          <h1 className="text-lg font-semibold">{session?.title}</h1>
          <p className="text-xs text-stone-300 flex items-center gap-1">
            <Users className="h-3 w-3" />
            {remoteParticipants.length + 1} people
          </p>
        </div>
        <div className="text-sm bg-amber-900/50 px-3 py-1 rounded-full">
          {statusMessage}
        </div>
      </div>

      {/* Main Call Area */}
      <div className="h-screen flex items-center justify-center p-4">
        {session?.session_type === 'one_on_one' ? (
          <div className="relative w-full max-w-2xl aspect-video bg-black rounded-xl overflow-hidden border-2 border-amber-500/30">
            {remoteParticipants.length > 0 ? (
              <div
                id={`video-${remoteParticipants[0].identity}`}
                className="w-full h-full bg-gray-900 flex items-center justify-center"
              >
                <span className="text-stone-500">Waiting for video...</span>
              </div>
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-stone-800 to-black">
                <div className="text-center">
                  <div className="text-4xl mb-2">🩹</div>
                  <p className="text-stone-400">Waiting for the other person...</p>
                </div>
              </div>
            )}
          </div>
        ) : (
          // Group layout: grid of participants
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 w-full max-w-6xl">
            {remoteParticipants.map((p) => (
              <div
                key={p.identity}
                className="aspect-video bg-black rounded-xl overflow-hidden relative border border-stone-700"
              >
                <div
                  id={`video-${p.identity}`}
                  className="w-full h-full flex items-center justify-center"
                >
                  <span className="text-stone-600 text-sm">Connecting...</span>
                </div>
                <div className="absolute bottom-2 left-2 bg-black/50 px-2 py-1 rounded text-xs">
                  {p.name || p.identity}
                </div>
              </div>
            ))}
            {/* Local participant placeholder */}
            <div className="aspect-video bg-stone-800 rounded-xl flex items-center justify-center border border-amber-500/30">
              <span className="text-amber-400">You</span>
            </div>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="absolute bottom-6 left-0 right-0 flex justify-center gap-4">
        <Button
          size="icon"
          variant="outline"
          onClick={toggleMic}
          className={`rounded-full w-12 h-12 ${
            isMicMuted ? 'bg-red-500 hover:bg-red-600' : 'bg-white hover:bg-stone-100'
          }`}
        >
          {isMicMuted ? <MicOff className="h-5 w-5 text-white" /> : <Mic className="h-5 w-5 text-black" />}
        </Button>

        <Button
          size="icon"
          variant="outline"
          onClick={toggleCamera}
          className={`rounded-full w-12 h-12 ${
            isCameraEnabled ? 'bg-green-500 hover:bg-green-600' : 'bg-stone-700 hover:bg-stone-600'
          }`}
        >
          {isCameraEnabled ? (
            <Video className="h-5 w-5 text-white" />
          ) : (
            <VideoOff className="h-5 w-5 text-stone-300" />
          )}
        </Button>

        <Button
          size="icon"
          variant="destructive"
          onClick={disconnect}
          className="rounded-full w-12 h-12 bg-red-600 hover:bg-red-700"
        >
          <PhoneOff className="h-5 w-5 text-white" />
        </Button>
      </div>
    </div>
  );
}