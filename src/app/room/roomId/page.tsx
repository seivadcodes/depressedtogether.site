'use client';
import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Room, RemoteParticipant } from 'livekit-client';

export default function RoomPage({ params }: { params: { roomId: string } }) {
  const { roomId } = params;
  const router = useRouter();
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const joinRoom = async () => {
      const userId = localStorage.getItem('userId') || 'anonymous';
      
      // Fetch token from API route
      const res = await fetch(`/api/livekit-token?room=${roomId}&identity=${userId}`);
      const { token } = await res.json();

      const room = new Room({
        adaptiveStream: true,
        dynacast: true,
      });

      try {
        await room.connect(process.env.NEXT_PUBLIC_LIVEKIT_URL!, token);
        
        // Set up local video
        const localParticipant = await room.localParticipant;
        const cam = await localParticipant.createTracks({ video: true });
        localParticipant.publishTracks(cam);
        
        if (localVideoRef.current && cam[0]) {
          localVideoRef.current.srcObject = new MediaStream([cam[0].mediaStreamTrack]);
          localVideoRef.current.play();
        }

        // Handle remote participants
        room.on('participantConnected', (participant: RemoteParticipant) => {
          console.log(`Participant connected: ${participant.identity}`);
          
          participant.on('trackSubscribed', (track) => {
            if (track.kind === 'video' && remoteVideoRef.current) {
              remoteVideoRef.current.srcObject = new MediaStream([track.mediaStreamTrack]);
              remoteVideoRef.current.play();
            }
          });
        });

        // Handle existing participants
        room.participants.forEach(participant => {
          participant.tracks.forEach(publication => {
            if (publication.track && publication.track.kind === 'video') {
              if (remoteVideoRef.current) {
                remoteVideoRef.current.srcObject = new MediaStream([publication.track.mediaStreamTrack]);
                remoteVideoRef.current.play();
              }
            }
          });
        });
      } catch (error) {
        console.error('Failed to connect:', error);
        router.push('/connect2');
      }

      return () => {
        room.disconnect();
      };
    };

    joinRoom();
  }, [roomId, router]);

  return (
    <div className="min-h-screen bg-gray-900 p-4 flex flex-col">
      <button 
        onClick={() => router.push('/connect2')}
        className="bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-6 rounded-xl self-end mb-6 shadow-lg"
      >
        Leave Room
      </button>
      
      <div className="flex flex-col md:flex-row gap-8 flex-grow">
        <div className="bg-gray-800 rounded-2xl overflow-hidden flex-1 min-h-[400px] relative">
          <video 
            ref={localVideoRef} 
            autoPlay 
            playsInline 
            muted 
            className="w-full h-full object-cover transform scale-x-[-1]"
          />
          <div className="absolute bottom-4 left-4 bg-black/50 text-white px-3 py-1 rounded-lg">
            You
          </div>
        </div>
        
        <div className="bg-gray-800 rounded-2xl overflow-hidden flex-1 min-h-[400px] relative">
          <video 
            ref={remoteVideoRef} 
            autoPlay 
            playsInline 
            className="w-full h-full object-cover"
          />
          <div className="absolute bottom-4 left-4 bg-black/50 text-white px-3 py-1 rounded-lg">
            Caller
          </div>
        </div>
      </div>
    </div>
  );
}