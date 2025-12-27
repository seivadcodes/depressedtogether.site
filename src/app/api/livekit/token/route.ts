import { NextResponse } from 'next/server';
import { AccessToken } from 'livekit-server-sdk';

export async function POST(request: Request) {
  const { identity, room, isPublisher = true } = await request.json();
  
  try {
    const token = new AccessToken(
      process.env.LIVEKIT_API_KEY!,
      process.env.LIVEKIT_API_SECRET!,
      { identity, ttl: '10m' }
    );
    
    token.addGrant({
      room,
      roomJoin: true,
      canPublish: isPublisher,
      canSubscribe: true,
    });
    
    return NextResponse.json({
      token: await token.toJwt(),
      url: process.env.NEXT_PUBLIC_LIVEKIT_URL
    });
  } catch (error) {
    console.error('Token generation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate token' }, 
      { status: 500 }
    );
  }
}