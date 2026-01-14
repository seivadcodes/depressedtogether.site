// src/components/angels/MemoryActions.tsx
'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase';

interface MemoryActionsProps {
  memoryId: string;
  angelId: string;
}

export default function MemoryActions({ memoryId, angelId }: MemoryActionsProps) {
  const [heartCount, setHeartCount] = useState(0);
  const [commentCount, setCommentCount] = useState(0);
  const [hasHearted, setHasHearted] = useState(false);
  const [loading, setLoading] = useState(true);

  const supabase = createClient();

  useEffect(() => {
    const fetchStats = async () => {
      try {
        // Hearts for this memory
        const { count: heartTotal } = await supabase
          .from('memory_hearts')
          .select('*', { count: 'exact', head: true })
          .eq('memory_id', memoryId);
        setHeartCount(heartTotal || 0);

        // Comments for this memory
        const { count: commentTotal } = await supabase
          .from('memory_comments')
          .select('*', { count: 'exact', head: true })
          .eq('memory_id', memoryId);
        setCommentCount(commentTotal || 0);

        // Check if current user has hearted this memory
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (user) {
          const { data: existingHeart } = await supabase
            .from('memory_hearts')
            .select('id')
            .eq('memory_id', memoryId)
            .eq('user_id', user.id)
            .maybeSingle();
          setHasHearted(!!existingHeart);
        }
      } catch (err) {
        console.error('Failed to load memory actions:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [memoryId]);

  const toggleHeart = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      alert('Please log in to react.');
      return;
    }

    if (hasHearted) {
      await supabase
        .from('memory_hearts')
        .delete()
        .eq('memory_id', memoryId)
        .eq('user_id', user.id);
      setHeartCount((prev) => Math.max(0, prev - 1));
      setHasHearted(false);
    } else {
      await supabase.from('memory_hearts').insert({
        memory_id: memoryId,
        user_id: user.id,
      });
      setHeartCount((prev) => prev + 1);
      setHasHearted(true);
    }
  };

  const openComments = () => {
    // Later: open comment modal or expand section
    alert(`Comments for memory ${memoryId} — coming soon!`);
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.25rem 0.5rem' }}>
        <div style={{ width: '40px', height: '16px', background: '#e2e8f0', borderRadius: '4px' }} />
        <div style={{ width: '40px', height: '16px', background: '#e2e8f0', borderRadius: '4px' }} />
      </div>
    );
  }

  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        padding: '0.25rem 0.5rem',
        background: 'rgba(0,0,0,0.7)',
        borderBottomLeftRadius: '8px',
        borderBottomRightRadius: '8px',
        color: 'white',
        fontSize: '0.75rem',
      }}
    >
      <button
        onClick={toggleHeart}
        style={{
          background: 'none',
          border: 'none',
          color: 'white',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '0.25rem',
          fontWeight: 'bold',
        }}
        aria-label={hasHearted ? 'Unlike memory' : 'Like memory'}
      >
        {hasHearted ? '❤️' : '🤍'} {heartCount}
      </button>

      <button
        onClick={openComments}
        style={{
          background: 'none',
          border: 'none',
          color: 'white',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '0.25rem',
          fontWeight: 'bold',
        }}
        aria-label="Comment on memory"
      >
        💬 {commentCount}
      </button>
    </div>
  );
}