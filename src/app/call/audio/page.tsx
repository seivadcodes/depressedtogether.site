// src/app/call/audio-test/page.tsx
'use client';

import { useState, useRef, useEffect } from 'react';
import { Room, RemoteParticipant, Track } from 'livekit-client';

export default function AudioTestPage() {
  const [roomName, setRoomName] = useState('healing-audio-room');
  const [isConnected, setIsConnected] = useState(false);
  const [remoteParticipant, setRemoteParticipant] = useState<RemoteParticipant | null>(null);
  const [statusMessage, setStatusMessage] = useState<string>('Ready for audio call.');
  const [isMuted, setIsMuted] = useState(false);

  const roomRef = useRef<Room | null>(null);
  const audioElementsRef = useRef<Map<string, HTMLAudioElement>>(new Map());

  const log = (msg: string) => {
    console.log('[AudioTestPage]', msg);
    setStatusMessage(msg);
  };

  const cleanupAudioElement = (identity: string) => {
    const el = audioElementsRef.current.get(identity);
    if (el) {
      el.pause();
      el.srcObject = null;
      el.remove();
      audioElementsRef.current.delete(identity);
    }
  };

  const connect = async () => {
    if (!roomName.trim()) {
      log('Room name is empty.');
      return;
    }

    log(`Connecting to audio room: ${roomName}...`);

    try {
      const res = await fetch('/api/livekit/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roomName }),
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(`Token fetch failed: ${res.status} ${text}`);
      }

      const { token, url } = await res.json();
      if (!token || !url) {
        throw new Error('Missing token or LiveKit URL');
      }

      log('Received token. Connecting to LiveKit...');

      const room = new Room();
      roomRef.current = room;

      room.on('participantConnected', (participant) => {
        log(`Participant joined: ${participant.identity}`);
        // For 1:1, we only care about the first remote participant
        if (!remoteParticipant) {
          setRemoteParticipant(participant);
        }
      });

      room.on('participantDisconnected', (participant) => {
        log(`Participant left: ${participant.identity}`);
        if (remoteParticipant?.identity === participant.identity) {
          setRemoteParticipant(null);
        }
        cleanupAudioElement(participant.identity);
      });

      room.on('trackSubscribed', (track, publication, participant) => {
        // Skip video tracks
        if (publication.kind === 'video' || publication.source === Track.Source.Camera) return;

        log(`Audio track subscribed from ${participant.identity}`);
        let audioEl = audioElementsRef.current.get(participant.identity);
        if (!audioEl) {
          audioEl = document.createElement('audio');
          audioEl.setAttribute('playsinline', 'true');
          // Optional: add to body to allow autoplay in some browsers
          document.body.appendChild(audioEl);
          audioElementsRef.current.set(participant.identity, audioEl);
        }
        track.attach(audioEl);
        audioEl.play().catch(() => {
          // Autoplay blocked – acceptable; user interaction may be needed
        });
      });

      room.on('trackUnsubscribed', (track, _, participant) => {
        track.detach();
        if (participant) {
          cleanupAudioElement(participant.identity);
        }
      });

      room.on('disconnected', () => {
        log('Disconnected from room.');
        setIsConnected(false);
        setRemoteParticipant(null);
        // Clean up all audio
        audioElementsRef.current.forEach((_, identity) => cleanupAudioElement(identity));
      });

      await room.connect(url, token);
      log('Connected to audio room!');

      // Local participant: audio only
      await room.localParticipant.setCameraEnabled(false);
      await room.localParticipant.setMicrophoneEnabled(true);

      setIsConnected(true);
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Unknown connection error';
      console.error('[AudioTestPage] Connection error:', err);
      log(`Error: ${errorMsg}`);
      alert(`Failed to connect: ${errorMsg}`);
    }
  };

  const disconnect = () => {
    if (roomRef.current) {
      roomRef.current.disconnect();
    }
  };

  const toggleMute = async () => {
    if (!roomRef.current) return;
    const newState = !isMuted;
    try {
      await roomRef.current.localParticipant.setMicrophoneEnabled(!newState);
      setIsMuted(newState);
      log(newState ? 'Microphone muted.' : 'Microphone unmuted.');
    } catch (err) {
      console.error('[AudioTestPage] Mute toggle error:', err);
      log('Failed to toggle microphone.');
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (roomRef.current) {
        roomRef.current.disconnect();
      }
      // Clean up any lingering audio elements
      audioElementsRef.current.forEach((_, identity) => cleanupAudioElement(identity));
    };
  }, []);

  return (
    <div style={{ padding: '20px', fontFamily: 'sans-serif', background: '#fff', color: '#000', minHeight: '100vh' }}>
      <h1>🩹 Healing Shoulder — Audio Call Test</h1>
      <p><strong>Status:</strong> {statusMessage}</p>

      {!isConnected ? (
        <div style={{ marginBottom: '20px' }}>
          <input
            type="text"
            value={roomName}
            onChange={(e) => setRoomName(e.target.value)}
            placeholder="Enter room name"
            style={{ padding: '8px', marginRight: '8px', border: '1px solid #ccc', borderRadius: '4px' }}
          />
          <button
            onClick={connect}
            style={{ padding: '10px 16px', backgroundColor: '#0070f3', color: 'white', border: 'none', borderRadius: '6px' }}
          >
            🎙️ Join Audio Room
          </button>
        </div>
      ) : (
        <div style={{ marginBottom: '20px' }}>
          <button
            onClick={disconnect}
            style={{ padding: '8px 16px', backgroundColor: '#f44336', color: 'white', border: 'none', borderRadius: '4px', marginRight: '8px' }}
          >
            🔚 Leave Call
          </button>
          <button
            onClick={toggleMute}
            style={{
              padding: '8px 16px',
              backgroundColor: isMuted ? '#ff9800' : '#4CAF50',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
            }}
          >
            {isMuted ? '🔇 Muted' : '🎙️ Unmuted'}
          </button>
        </div>
      )}

      <div>
        <h3>Remote Participant</h3>
        {remoteParticipant ? (
          <p>Connected: <strong>{remoteParticipant.name || remoteParticipant.identity}</strong> 🔊</p>
        ) : (
          <p>Waiting for someone to join...</p>
        )}
      </div>
    </div>
  );
}