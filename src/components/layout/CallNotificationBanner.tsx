// src/components/layout/CallNotificationBanner.tsx
'use client';

import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { Phone, X } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

type CallInvitation = {
  caller_id: string;
  caller_name: string;
  room_id: string;
  conversation_id?: string;
};

export default function CallNotificationBanner({
  currentUserId,
  isVisible,
  invitation,
  onDismiss,
}: {
  currentUserId: string;
  isVisible: boolean;
  invitation: CallInvitation | null;
  onDismiss: () => void;
}) {
  const router = useRouter();
  const supabase = createClient();

  const handleAccept = async () => {
    if (!invitation) return;

    // Optional: mark as accepted in DB
    await supabase
      .from('call_notifications')
      .update({ status: 'accepted' })
      .eq('recipient_id', currentUserId)
      .eq('room_id', invitation.room_id);

    onDismiss();
    router.push(`/room/${invitation.room_id}`);
  };

  const handleDecline = async () => {
    if (!invitation) return;

    await supabase
      .from('call_notifications')
      .update({ status: 'declined' })
      .eq('recipient_id', currentUserId)
      .eq('room_id', invitation.room_id);

    // Notify caller (optional)
    const channel = supabase.channel(`user:${invitation.caller_id}`);
    await channel.send({
      type: 'broadcast',
      event: 'call_declined',
      payload: { by: currentUserId },
    });

    onDismiss();
  };

  if (!isVisible || !invitation) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: '4rem', // below header (adjust if header height changes)
        left: 0,
        right: 0,
        zIndex: 45,
        backgroundColor: '#1e3a8a',
        color: 'white',
        padding: '0.75rem 1rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)',
        maxWidth: '48rem',
        margin: '0 auto',
        borderRadius: '0 0 0.5rem 0.5rem',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <Phone size={20} />
        <span>
          Incoming call from <strong>{invitation.caller_name}</strong>
        </span>
      </div>
      <div style={{ display: 'flex', gap: '0.5rem' }}>
        <button
          onClick={handleAccept}
          style={{
            padding: '0.25rem 0.75rem',
            backgroundColor: '#10b981',
            color: 'white',
            border: 'none',
            borderRadius: '0.375rem',
            cursor: 'pointer',
            fontSize: '0.875rem',
            fontWeight: 500,
          }}
        >
          Accept
        </button>
        <button
          onClick={handleDecline}
          style={{
            padding: '0.25rem 0.75rem',
            backgroundColor: '#ef4444',
            color: 'white',
            border: 'none',
            borderRadius: '0.375rem',
            cursor: 'pointer',
            fontSize: '0.875rem',
            fontWeight: 500,
          }}
        >
          Decline
        </button>
        <button
          onClick={onDismiss}
          style={{
            background: 'none',
            border: 'none',
            color: 'white',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <X size={18} />
        </button>
      </div>
    </div>
  );
}