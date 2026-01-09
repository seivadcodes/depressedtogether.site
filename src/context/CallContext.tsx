// src/context/CallContext.tsx
'use client';

import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';

type CallState = 'idle' | 'ringing' | 'calling' | 'connected' | 'minimized';
type CallType = 'audio' | 'video';

interface IncomingCall {
  callerId: string;
  callerName: string;
  roomName: string;
  callType: CallType;
  conversationId?: string;
}

interface CallContextType {
  callState: CallState;
  incomingCall: IncomingCall | null;
  startCall: (toUserId: string, callType: CallType, roomName: string) => void;
  acceptCall: () => void;
  rejectCall: () => void;
  hangUp: () => void;
  minimizeCall: () => void;
  restoreCall: () => void;
  currentCallToken: string | null;
  currentCallRoom: string | null;
}

const CallContext = createContext<CallContextType | undefined>(undefined);

export function CallProvider({
  children,
  userId,
  fullName,
}: {
  children: ReactNode;
  userId: string;
  fullName: string;
}) {
  const [callState, setCallState] = useState<CallState>('idle');
  const [incomingCall, setIncomingCall] = useState<IncomingCall | null>(null);
  const [currentCallToken, setCurrentCallToken] = useState<string | null>(null);
  const [currentCallRoom, setCurrentCallRoom] = useState<string | null>(null);
  const [ws, setWs] = useState<WebSocket | null>(null);
  const supabase = createClient();

  // 🔌 Setup WebSocket only if userId is valid
  useEffect(() => {
    if (!userId || typeof userId !== 'string' || userId.trim() === '') return;
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(userId)) return;
    if (typeof window === 'undefined') return;

    const wsUrl = `ws://178.128.210.229:8084?userId=${encodeURIComponent(userId)}`;
    console.log('CallCheck: Connecting WebSocket with URL:', wsUrl);

    const socket = new WebSocket(wsUrl);

    socket.onopen = () => {
      console.log(`✅ CallCheck: WebSocket OPEN for user: ${userId}`);
    };

    socket.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        console.log('CallCheck: Message:', msg);

        if (msg.type === 'incoming_call') {
          setCallState('ringing');
          setIncomingCall(msg);
        } else if (msg.type === 'call_accepted') {
          setCallState('connected');
          setCurrentCallRoom(msg.roomName);
          fetchLiveKitToken(msg.roomName, userId, fullName);
        } else if (msg.type === 'call_rejected' || msg.type === 'call_ended') {
          resetCall();
        }
      } catch (e) {
        console.error('CallCheck: Parse error:', e);
      }
    };

    socket.onclose = (e) => {
      if (e.code !== 1000) {
        console.warn('CallCheck: WebSocket closed abnormally', e.code, e.reason);
      }
    };

    socket.onerror = (e) => {
      console.error('CallCheck: WebSocket error', e);
    };

    setWs(socket);

    return () => {
      socket.close();
    };
  }, [userId, fullName]);

  const fetchLiveKitToken = async (roomName: string, identity: string, name: string) => {
    try {
      const res = await fetch('/api/livekit/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ room: roomName, identity, name }),
      });
      if (!res.ok) throw new Error('Failed to get LiveKit token');
      const { token } = await res.json();
      setCurrentCallToken(token);
    } catch (err) {
      console.error('Token fetch failed:', err);
      hangUp();
    }
  };

  const resetCall = useCallback(() => {
    setCallState('idle');
    setIncomingCall(null);
    setCurrentCallToken(null);
    setCurrentCallRoom(null);
  }, []);

  const sendNotification = async (body: Record<string, unknown>) => {
    try {
      const res = await fetch('/api/notify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw await res.json();
    } catch (err) {
      console.error('Failed to send notification:', err);
    }
  };

  const startCall = (toUserId: string, callType: CallType, roomName: string) => {
    setCallState('calling');
    sendNotification({
      type: 'incoming_call',
      toUserId,
      callerId: userId,
      callerName: fullName,
      roomName,
      callType,
    });
  };

  const acceptCall = () => {
    if (!incomingCall) return;
    setCallState('connected');
    setCurrentCallRoom(incomingCall.roomName);
    fetchLiveKitToken(incomingCall.roomName, userId, fullName);
    sendNotification({
      type: 'call_accepted',
      toUserId: incomingCall.callerId,
      roomName: incomingCall.roomName,
    });
    setIncomingCall(null);
  };

  const rejectCall = () => {
    if (!incomingCall) return;
    sendNotification({
      type: 'call_rejected',
      toUserId: incomingCall.callerId,
      roomName: incomingCall.roomName,
    });
    resetCall();
  };

  const hangUp = () => {
    const otherUserId = incomingCall ? incomingCall.callerId : null;
    if (otherUserId && currentCallRoom) {
      sendNotification({
        type: 'call_ended',
        toUserId: otherUserId,
        roomName: currentCallRoom,
      });
    }
    resetCall();
  };

  const minimizeCall = () => {
    if (callState === 'connected') {
      setCallState('minimized');
    }
  };

  const restoreCall = () => {
    if (callState === 'minimized') {
      setCallState('connected');
    }
  };

  return (
    <CallContext.Provider
      value={{
        callState,
        incomingCall,
        startCall,
        acceptCall,
        rejectCall,
        hangUp,
        minimizeCall,
        restoreCall,
        currentCallToken,
        currentCallRoom,
      }}
    >
      {children}
    </CallContext.Provider>
  );
}

export const useCall = () => {
  const context = useContext(CallContext);
  if (!context) {
    throw new Error('useCall must be used within a CallProvider');
  }
  return context;
};