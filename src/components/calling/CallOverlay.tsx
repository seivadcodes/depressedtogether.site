// src/components/calling/CallOverlay.tsx
'use client';

import { useCall } from '@/context/CallContext';
import { Mic, MicOff, PhoneOff, ArrowDown } from 'lucide-react';
import { useState, useEffect } from 'react';
import { LiveKitRoom, RoomAudioRenderer, useLocalParticipant } from '@livekit/components-react';

function MuteButton() {
  const { localParticipant } = useLocalParticipant();

  const toggleMute = () => {
    if (localParticipant) {
      const newState = !localParticipant.isMicrophoneEnabled;
      localParticipant.setMicrophoneEnabled(newState);
      // No need to manage local state — LiveKit keeps source of truth
    }
  };

  // Derive UI state directly from LiveKit participant
  const isMuted = !localParticipant?.isMicrophoneEnabled;

  return (
    <button
      onClick={toggleMute}
      style={{
        width: '3.5rem',
        height: '3.5rem',
        borderRadius: '50%',
        backgroundColor: isMuted ? '#ef4444' : '#4b5563',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        border: 'none',
        cursor: 'pointer',
        transition: 'background-color 0.3s',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
      }}
      onMouseOver={e => e.currentTarget.style.backgroundColor = isMuted ? '#dc2626' : '#374151'}
      onMouseOut={e => e.currentTarget.style.backgroundColor = isMuted ? '#ef4444' : '#4b5563'}
    >
      {isMuted ? (
        <MicOff style={{ width: '1.5rem', height: '1.5rem', color: 'white' }} />
      ) : (
        <Mic style={{ width: '1.5rem', height: '1.5rem', color: 'white' }} />
      )}
    </button>
  );
}

export default function CallOverlay() {
  const {
    callState,
    incomingCall,
    acceptCall,
    rejectCall,
    hangUp,
    minimizeCall,
    restoreCall,
    currentCallToken,
    currentCallRoom,
  } = useCall();

  // Incoming call popup
  if (callState === 'ringing' && incomingCall) {
    return (
      <div style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0,0,0,0.7)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: '20px'
      }}>
        <div style={{
          backgroundColor: 'white',
          borderRadius: '16px',
          padding: '32px',
          textAlign: 'center',
          maxWidth: '400px',
          width: '100%'
        }}>
          <h2 style={{ fontSize: '20px', fontWeight: '700', color: '#1e293b', marginBottom: '8px' }}>
            Incoming {incomingCall.callType === 'video' ? 'Video' : 'Audio'} Call
          </h2>
          <p style={{ color: '#64748b', marginBottom: '24px' }}>
            From: <strong>{incomingCall.callerName}</strong>
          </p>
          <div style={{ display: 'flex', gap: '16px', justifyContent: 'center' }}>
            <button
              onClick={rejectCall}
              style={{
                padding: '12px 24px',
                backgroundColor: '#ef4444',
                color: 'white',
                border: 'none',
                borderRadius: '12px',
                cursor: 'pointer',
                fontSize: '16px',
                fontWeight: '600'
              }}
            >
              Decline
            </button>
            <button
              onClick={acceptCall}
              style={{
                padding: '12px 24px',
                backgroundColor: '#10b981',
                color: 'white',
                border: 'none',
                borderRadius: '12px',
                cursor: 'pointer',
                fontSize: '16px',
                fontWeight: '600'
              }}
            >
              Accept
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Outgoing call indicator
  if (callState === 'calling') {
    return (
      <div style={{
        position: 'fixed',
        top: '20px',
        right: '20px',
        backgroundColor: '#334155',
        color: 'white',
        padding: '12px 24px',
        borderRadius: '12px',
        zIndex: 1000
      }}>
        Calling... <button onClick={hangUp} style={{ marginLeft: '10px', color: '#ef4444' }}>Cancel</button>
      </div>
    );
  }

  // Active call UI
  if (callState === 'connected' && currentCallToken && currentCallRoom) {
    return (
      <div style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.95)',
        zIndex: 1000,
        display: 'flex',
        flexDirection: 'column',
        padding: '2rem'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '2rem'
        }}>
          <h2 style={{ color: 'white', fontSize: '1.5rem' }}>
            In Call with {incomingCall?.callerName || 'Participant'}
          </h2>
          <button
            onClick={minimizeCall}
            style={{
              background: 'none',
              border: 'none',
              color: '#94a3b8',
              cursor: 'pointer',
              fontSize: '14px',
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}
          >
            <ArrowDown size={16} />
            Minimize
          </button>
        </div>

        <LiveKitRoom
          token={currentCallToken}
          serverUrl={process.env.NEXT_PUBLIC_LIVEKIT_URL}
          audio={true}
          video={false}
          connect={true}
          onDisconnected={() => hangUp()}
          style={{ flex: 1, display: 'flex', flexDirection: 'column' }}
        >
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <MuteButton />
          </div>
          <div style={{ textAlign: 'center', marginTop: '2rem' }}>
            <button
              onClick={hangUp}
              style={{
                padding: '12px 24px',
                backgroundColor: '#ef4444',
                color: 'white',
                borderRadius: '12px',
                border: 'none',
                cursor: 'pointer',
                fontSize: '16px',
                fontWeight: '600'
              }}
            >
              <PhoneOff size={20} style={{ marginRight: '8px' }} />
              Hang Up
            </button>
          </div>
          <RoomAudioRenderer />
        </LiveKitRoom>
      </div>
    );
  }

  // Minimized call
  if (callState === 'minimized') {
    return (
      <button
        onClick={restoreCall}
        style={{
          position: 'fixed',
          bottom: '20px',
          right: '20px',
          backgroundColor: '#0ea5e9',
          color: 'white',
          padding: '8px 16px',
          borderRadius: '20px',
          border: 'none',
          cursor: 'pointer',
          zIndex: 1000,
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.2)'
        }}
      >
        📞 Return to call
      </button>
    );
  }

  return null;
}