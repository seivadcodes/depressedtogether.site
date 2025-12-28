import { NextRequest, NextResponse } from 'next/server';
import { AccessToken } from 'livekit-server-sdk';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const room = searchParams.get('room') || 'default-room';
  const identity = searchParams.get('identity') || 'guest';
  
  // Create token with proper options object
  const token = new AccessToken(
    process.env.LIVEKIT_API_KEY!,
    process.env.LIVEKIT_API_SECRET!,
    { identity } // Correct options format
  );
  
  token.addGrant({
    room,
    roomJoin: true,
    canPublish: true,
    canSubscribe: true,
    canPublishData: true,
  });

  return NextResponse.json({ token: token.toJwt() });
}