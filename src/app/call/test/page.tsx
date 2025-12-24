// src/app/call/test/page.tsx
'use client';

import { useState, useRef, useEffect } from 'react';
import {
  Room,
  RemoteParticipant,
  Track,
} from 'livekit-client';

export default function TestCallPage() {
  const [roomName, setRoomName] = useState('healing-room');
  const [isConnected, setIsConnected] = useState(false);
  const [remoteParticipants, setRemoteParticipants] = useState<RemoteParticipant[]>([]);
  const [statusMessage, setStatusMessage] = useState<string>('Ready to connect.');
  const [isScreenSharing, setIsScreenSharing] = useState(false);

  const roomRef = useRef<Room | null>(null);
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRefs = useRef<Map<string, HTMLVideoElement>>(new Map());
  const screenTrackRef = useRef<Track | null>(null);

  const log = (msg: string) => {
    console.log('[TestCallPage]', msg);
    setStatusMessage(msg);
  };

  const connect = async () => {
    if (!roomName.trim()) {
      log('Room name is empty.');
      return;
    }

    log(`Connecting to room: ${roomName}...`);

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

      room.on('participantConnected', (participant: RemoteParticipant) => {
        log(`Participant joined: ${participant.identity}`);
        setRemoteParticipants((prev) => [...prev, participant]);
      });

      room.on('participantDisconnected', (participant: RemoteParticipant) => {
        log(`Participant left: ${participant.identity}`);
        setRemoteParticipants((prev) =>
          prev.filter((p) => p.identity !== participant.identity)
        );
        remoteVideoRefs.current.delete(participant.identity);
      });

      room.on('trackSubscribed', (track, publication, participant) => {
        log(`Track subscribed from ${participant.identity}: ${publication.source}`);
        const videoEl = remoteVideoRefs.current.get(participant.identity) || document.createElement('video');
        remoteVideoRefs.current.set(participant.identity, videoEl);
        track.attach(videoEl);
      });

      room.on('trackUnsubscribed', (track, publication, participant) => {
        log(`Track unsubscribed from ${participant.identity}`);
        track.detach();
      });

      room.on('disconnected', () => {
        log('Disconnected from room.');
        setIsConnected(false);
        setIsScreenSharing(false);
        setRemoteParticipants([]);
        remoteVideoRefs.current.clear();
        screenTrackRef.current = null;
      });

      await room.connect(url, token);
      log('Connected to room!');

      await room.localParticipant.setMicrophoneEnabled(true);
      await room.localParticipant.setCameraEnabled(true);

      const localCamPub = room.localParticipant.getTrackPublication(Track.Source.Camera);
      if (localCamPub?.track && localVideoRef.current) {
        localCamPub.track.attach(localVideoRef.current);
        log('Local video attached.');
      }

      setIsConnected(true);
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Unknown connection error';
      console.error('[TestCallPage] Connection error:', err);
      log(`Error: ${errorMsg}`);
      alert(`Failed to connect: ${errorMsg}`);
    }
  };

  const disconnect = () => {
    if (roomRef.current) {
      if (isScreenSharing) {
        roomRef.current.localParticipant.setScreenShareEnabled(false);
        setIsScreenSharing(false);
        screenTrackRef.current = null;
      }
      roomRef.current.disconnect();
    }
  };

  const startScreenShare = async () => {
    if (!roomRef.current) return;

    try {
      log('Starting screen share...');
      const wasEnabled = await roomRef.current.localParticipant.setScreenShareEnabled(true);
      if (wasEnabled) {
        setIsScreenSharing(true);
        log('Screen sharing started.');
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Unknown screen share error';
      console.error('[TestCallPage] Screen share error:', err);
      log(`Screen share failed: ${errorMsg}`);
      alert(`Failed to start screen sharing: ${errorMsg}`);
    }
  };

  const stopScreenShare = async () => {
    if (!roomRef.current) return;

    try {
      log('Stopping screen share...');
      await roomRef.current.localParticipant.setScreenShareEnabled(false);
      setIsScreenSharing(false);
      screenTrackRef.current = null;
      log('Screen sharing stopped.');
    } catch (err) {
      console.error('[TestCallPage] Stop screen share error:', err);
      log('Error stopping screen share');
    }
  };

  useEffect(() => {
    return () => {
      if (isScreenSharing && roomRef.current) {
        roomRef.current.localParticipant.setScreenShareEnabled(false);
      }
      if (roomRef.current) {
        roomRef.current.disconnect();
      }
    };
  }, [isScreenSharing]);

  return (
    <div style={{ padding: '20px', fontFamily: 'sans-serif', background: '#fff', color: '#000', minHeight: '100vh' }}>
      <h1>🩹 Healing Shoulder — Call Test</h1>
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
            🎥 Join Room
          </button>
        </div>
      ) : (
        <div style={{ marginBottom: '20px' }}>
          <button
            onClick={disconnect}
            style={{ padding: '8px 16px', backgroundColor: '#f44336', color: 'white', border: 'none', borderRadius: '4px', marginRight: '8px' }}
          >
            🔚 Leave Room
          </button>
          <button
            onClick={isScreenSharing ? stopScreenShare : startScreenShare}
            style={{
              padding: '8px 16px',
              backgroundColor: isScreenSharing ? '#f44336' : '#9c27b0',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
            }}
          >
            {isScreenSharing ? '⏹️ Stop Sharing' : '🖥️ Share Screen'}
          </button>
        </div>
      )}

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '24px' }}>
        <div style={{ flex: 1, minWidth: '280px', maxWidth: '400px' }}>
          <h3>You (Local)</h3>
          <video
            ref={localVideoRef}
            autoPlay
            muted
            playsInline
            style={{ width: '100%', maxHeight: '300px', backgroundColor: '#000', border: '2px solid #4CAF50', borderRadius: '8px' }}
          />
        </div>

        <div style={{ flex: 2, minWidth: '280px' }}>
          <h3>Others ({remoteParticipants.length})</h3>
          {remoteParticipants.length === 0 ? (
            <p>No one else here yet.</p>
          ) : (
            remoteParticipants.map((participant) => (
              <div key={participant.identity} style={{ marginBottom: '16px' }}>
                <h4>{participant.name || participant.identity}</h4>
                <video
                  ref={(el) => {
                    if (el) {
                      const existing = remoteVideoRefs.current.get(participant.identity);
                      if (existing && !el.contains(existing)) {
                        el.appendChild(existing);
                      }
                      remoteVideoRefs.current.set(participant.identity, el);
                    }
                  }}
                  autoPlay
                  playsInline
                  style={{ width: '100%', maxHeight: '300px', backgroundColor: '#000', border: '2px solid #2196F3', borderRadius: '8px' }}
                />
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}