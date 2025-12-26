// app/api/livekit/token/route.ts
import { AccessToken } from 'livekit-server-sdk';
import { createClient } from '@/lib/supabase';
import { NextRequest, NextResponse } from 'next/server';

const LIVEKIT_API_KEY = process.env.LIVEKIT_API_KEY;
const LIVEKIT_API_SECRET = process.env.LIVEKIT_API_SECRET;
const LIVEKIT_URL = process.env.NEXT_PUBLIC_LIVEKIT_URL;

if (!LIVEKIT_API_KEY || !LIVEKIT_API_SECRET || !LIVEKIT_URL) {
  throw new Error('Missing LiveKit environment variables');
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();
    const { data: { session }, error: authError } = await supabase.auth.getSession();

    if (authError || !session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('id, full_name')
      .eq('id', session.user.id)
      .single();

    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    const { room } = await request.json();

    if (!room || typeof room !== 'string') {
      return NextResponse.json({ error: 'Invalid room name' }, { status: 400 });
    }

    // Optional: Validate room naming convention (e.g., user1Id-user2Id)
    const roomParts = room.split('-');
    if (roomParts.length !== 2) {
      return NextResponse.json({ error: 'Invalid room format' }, { status: 400 });
    }

    // Ensure the authenticated user is part of the room name
    if (!room.includes(profile.id)) {
      return NextResponse.json({ error: 'Not authorized for this room' }, { status: 403 });
    }

    const participantName = profile.full_name || 'User';

    // Generate LiveKit access token
    const at = new AccessToken(LIVEKIT_API_KEY, LIVEKIT_API_SECRET, {
      identity: profile.id,
      ttl: '10m', // Token valid for 10 minutes
    });

    at.addGrant({
      room,
      roomJoin: true,
      canPublish: true,
      canSubscribe: true,
      canPublishData: true,
    });

    const token = await at.toJwt();

    return NextResponse.json({ token });
  } catch (error) {
    console.error('Token generation error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}