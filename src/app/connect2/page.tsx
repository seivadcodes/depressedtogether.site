'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface CallRequest {
  id: string;
  name: string;
  room: string; // Added missing room property
}

export default function ConnectPage() {
  const [userId] = useState(() => 
    localStorage.getItem('userId') || crypto.randomUUID()
  );
  const [requester, setRequester] = useState<CallRequest | null>(null);
  const router = useRouter();

  useEffect(() => {
    localStorage.setItem('userId', userId);
    
    const channel = supabase.channel('call-requests')
      .on('broadcast', { event: 'call_request' }, (payload) => {
        const callData = payload.payload as CallRequest;
        if (callData.id !== userId) {
          setRequester(callData);
        }
      })
      .on('broadcast', { event: 'call_accepted' }, (payload) => {
        const { room, requester: reqId, acceptor } = payload.payload;
        if (reqId === userId || acceptor === userId) {
          router.push(`/room/${room}`);
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, router]);

  const requestCall = async () => {
    const room = crypto.randomUUID();
    await supabase.channel('call-requests').send({
      type: 'broadcast',
      event: 'call_request',
      payload: { 
        id: userId, 
        name: `User ${userId.slice(0, 4)}`, 
        room // Include room in payload
      }
    });
  };

  const acceptCall = async () => {
    if (!requester) return;
    await supabase.channel('call-requests').send({
      type: 'broadcast',
      event: 'call_accepted',
      payload: {
        room: requester.room,
        requester: requester.id,
        acceptor: userId
      }
    });
    router.push(`/room/${requester.room}`);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-gray-50">
      {!requester ? (
        <button 
          onClick={requestCall}
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-6 px-12 rounded-2xl text-2xl shadow-lg transition transform hover:scale-105"
        >
          I need to talk
        </button>
      ) : (
        <div className="text-center bg-white p-8 rounded-3xl shadow-2xl border-2 border-blue-100 max-w-md mx-4">
          <div className="mb-6">
            <div className="inline-block bg-blue-100 text-blue-800 px-4 py-2 rounded-full font-medium">
              {requester.name} wants to talk
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button 
              onClick={acceptCall}
              className="bg-green-500 hover:bg-green-600 text-white text-lg font-medium px-8 py-4 rounded-xl transition transform hover:scale-105"
            >
              Accept Call
            </button>
            <button 
              onClick={() => setRequester(null)}
              className="bg-gray-200 hover:bg-gray-300 text-gray-800 text-lg font-medium px-8 py-4 rounded-xl transition"
            >
              Not Now
            </button>
          </div>
        </div>
      )}
    </div>
  );
}