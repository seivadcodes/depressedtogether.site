// app/messages/handlecall.tsx
'use client';

import { useState, useRef, useEffect } from 'react';
import { Room } from 'livekit-client';
import toast from 'react-hot-toast';

type HandleCallProps = {
  isOpen: boolean;
  onClose: () => void;
  roomId: string;
  participantName: string;
  currentUserId: string;
};

export default function HandleCall({
  isOpen,
  onClose,
  roomId,
  participantName,
  currentUserId,
}: HandleCallProps) {
  const [callStatus, setCallStatus] = useState<'idle' | 'connecting' | 'connected' | 'ended'>('idle');
  const roomRef = useRef<Room | null>(null);
  const remoteVideoRef = useRef<HTMLDivElement>(null);
  const localVideoRef = useRef<HTMLDivElement>(null);

  // Start call when modal opens
  useEffect(() => {
    if (!isOpen || callStatus !== 'idle') return;

    const startCall = async () => {
      setCallStatus('connecting');

      try {
        // Fetch token
        const tokenRes = await fetch('/api/livekit/token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            room: roomId,
            identity: currentUserId,
            name: 'You',
          }),
        });

        if (!tokenRes.ok) {
          const err = await tokenRes.json();
          throw new Error(err.error || 'Failed to get call token');
        }
        const { token } = await tokenRes.json();

        // Initialize LiveKit Room
        const room = new Room();

        room.on('trackSubscribed', (track, _, participant) => {
          if (participant.identity === currentUserId) return;
          const element = track.attach();
          if (remoteVideoRef.current) {
            remoteVideoRef.current.innerHTML = '';
            remoteVideoRef.current.appendChild(element);
          }
        });

        room.on('trackUnsubscribed', (track) => {
          track.detach().forEach(el => el.remove());
        });

        await room.connect(process.env.NEXT_PUBLIC_LIVEKIT_URL!, token);

        // Enable mic + cam
        await room.localParticipant.setMicrophoneEnabled(true);
        const camPub = await room.localParticipant.setCameraEnabled(true);
        if (camPub?.track && localVideoRef.current) {
          const localEl = camPub.track.attach();
          localVideoRef.current.innerHTML = '';
          localVideoRef.current.appendChild(localEl);
        }

        roomRef.current = room;
        setCallStatus('connected');
      } catch (err) {
        console.error('Call failed:', err);
        toast.error('Failed to start call');
        handleClose();
      }
    };

    startCall();
  }, [isOpen, callStatus, roomId, currentUserId]);

  const handleClose = () => {
    if (roomRef.current) {
      roomRef.current.disconnect();
      roomRef.current = null;
    }
    setCallStatus('ended');
    onClose();
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (roomRef.current) {
        roomRef.current.disconnect();
      }
    };
  }, []);

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0,0,0,0.95)',
        zIndex: 1000,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
      }}
    >
      {/* Remote video */}
      <div
        ref={remoteVideoRef}
        style={{
          width: '100%',
          maxWidth: '800px',
          height: '60vh',
          background: '#111',
          borderRadius: '12px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          fontSize: '1.2rem',
          overflow: 'hidden',
        }}
      >
        {callStatus === 'connecting' ? 'Connecting…' : `In call with ${participantName}`}
      </div>

      {/* Local preview */}
      <div
        ref={localVideoRef}
        style={{
          position: 'absolute',
          bottom: '80px',
          right: '20px',
          width: '160px',
          height: '120px',
          background: '#222',
          borderRadius: '8px',
          overflow: 'hidden',
          border: '2px solid #4f46e5',
        }}
      ></div>

      {/* End call button */}
      <button
        onClick={handleClose}
        style={{
          marginTop: '24px',
          padding: '12px 32px',
          backgroundColor: '#ef4444',
          color: 'white',
          border: 'none',
          borderRadius: '50px',
          fontSize: '16px',
          fontWeight: '600',
          cursor: 'pointer',
        }}
      >
        End Call
      </button>
    </div>
  );
}