import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('📥 API received notification:', body);
    const supabase = createClient();

    // Handle community broadcasts
    if (body.communityId && body.type) {
      console.log(`📤 Processing community notification for: ${body.communityId}, type: ${body.type}`);
      
      // Get all members of this community
      const { data: members, error } = await supabase
        .from('community_members')
        .select('user_id')
        .eq('community_id', body.communityId);
      
      if (error) {
        console.error('❌ Failed to fetch community members:', error);
        return NextResponse.json({ 
          error: 'Failed to fetch community members',
          details: error.message
        }, { status: 500 });
      }

      if (!members || members.length === 0) {
        console.log(`ℹ️ No members found for community ${body.communityId}`);
        return NextResponse.json({ ok: true, delivered: 0, totalMembers: 0 });
      }

      // Remove the current user from the list if specified
      let filteredMembers = members;
      if (body.excludeUserId) {
        filteredMembers = members.filter(m => m.user_id !== body.excludeUserId);
      }

      console.log(`📤 Broadcasting to ${filteredMembers.length} members of community ${body.communityId}`);

      // Forward to signaling server with community broadcast
      const signalingRes = await fetch('http://178.128.210.229:8084/notify-community', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!signalingRes.ok) {
        const errorData = await signalingRes.json();
        console.error('❌ Community broadcast signaling error:', errorData);
        return NextResponse.json({ 
          error: 'Failed to broadcast to community',
          details: errorData
        }, { status: 500 });
      }

      const result = await signalingRes.json();
      console.log(`✅ Successfully broadcast to ${result.delivered} of ${result.totalConnected} connected members`);
      
      return NextResponse.json({ 
        ok: true,
        delivered: result.delivered,
        totalMembers: filteredMembers.length,
        connectedMembers: result.totalConnected
      });
    }

    // Handle broadcast notifications (presence updates)
    if (body.broadcast && body.type === 'user_presence') {
      console.log(`📤 Broadcasting presence update for user: ${body.userId}`);
      
      // Forward to signaling server with broadcast flag
      const signalingRes = await fetch('http://178.128.210.229:8084/notify-broadcast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!signalingRes.ok) {
        const errorData = await signalingRes.json();
        console.error('❌ Broadcast signaling error:', errorData);
        return NextResponse.json({ 
          error: 'Failed to broadcast notification',
          details: errorData
        }, { status: 500 });
      }

      const result = await signalingRes.json();
      console.log(`✅ Successfully broadcast to ${result.delivered} connections`);
      
      return NextResponse.json({ 
        ok: true,
        delivered: result.delivered,
        connections: result.connections
      });
    }

    // Handle regular notifications to specific users
    const { toUserId, } = body;
    
    if (!toUserId) {
      console.error('❌ Missing toUserId in notification');
      return NextResponse.json({ error: 'Missing toUserId' }, { status: 400 });
    }

    // Forward to signaling server
    const signalingRes = await fetch('http://178.128.210.229:8084/notify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (!signalingRes.ok) {
      const errorData = await signalingRes.json();
      console.error('❌ Signaling server error:', errorData);
      return NextResponse.json({ 
        error: 'Failed to notify signaling server',
        details: errorData
      }, { status: 500 });
    }

    console.log(`✅ Notification delivered to user: ${toUserId}`);
    return NextResponse.json({ ok: true });
    
  } catch (err) {
    console.error('🔥 Notify API error:', err);
    if (err instanceof Error) {
      return NextResponse.json({ 
        error: 'Internal server error',
        details: err.message
      }, { status: 500 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}