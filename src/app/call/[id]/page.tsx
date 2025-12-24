// src/app/call/[id]/page.tsx

'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { PhoneCall, Users } from 'lucide-react';

export default function CallRoom() {
  const { id } = useParams();
  const [timeInRoom, setTimeInRoom] = useState(0);

  useEffect(() => {
    const start = Date.now();
    const interval = setInterval(() => {
      setTimeInRoom(Math.floor((Date.now() - start) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 to-stone-100 flex flex-col items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full text-center">
        <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <PhoneCall className="text-amber-600" size={32} />
        </div>
        <h1 className="text-2xl font-bold text-stone-800 mb-2">Connected</h1>
        <p className="text-stone-600 mb-6">
          You’re in a private call room with someone who understands.
        </p>
        <div className="flex justify-center gap-4 text-sm text-stone-500 mb-6">
          <span className="flex items-center gap-1">
            <Users size={14} /> 2 people
          </span>
          <span>{Math.floor(timeInRoom / 60)}:{String(timeInRoom % 60).padStart(2, '0')}</span>
        </div>
        <div className="text-xs text-stone-400">
          (In a real version: audio/video/chat would appear here)
        </div>
      </div>
      <p className="mt-8 text-stone-500 text-sm">
        This is a safe space. You can leave anytime.
      </p>
    </div>
  );
}