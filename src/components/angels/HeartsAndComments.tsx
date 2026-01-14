// components/angels/HeartsAndComments.tsx
'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase';

interface HeartsAndCommentsProps {
  angelId: string;
  profileId: string; // needed if you want to restrict actions to owner or logged-in users
}

export default function HeartsAndComments({ angelId, profileId }: HeartsAndCommentsProps) {
  const [heartCount, setHeartCount] = useState(0);
  const [commentCount, setCommentCount] = useState(0);
  const [hasHearted, setHasHearted] = useState(false);
  const [loading, setLoading] = useState(true);

  const supabase = createClient();

  // Fetch initial counts and user's heart status
  useEffect(() => {
    const fetchStats = async () => {
      try {
        // Get total hearts
        const { count: heartTotal } = await supabase
          .from('angel_hearts')
          .select('*', { count: 'exact', head: true })
          .eq('angel_id', angelId);
        setHeartCount(heartTotal || 0);

        // Get total comments
        const { count: commentTotal } = await supabase
          .from('angel_comments')
          .select('*', { count: 'exact', head: true })
          .eq('angel_id', angelId);
        setCommentCount(commentTotal || 0);

        // Check if current user has already hearted
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (user) {
          const { data: existingHeart } = await supabase
            .from('angel_hearts')
            .select('id')
            .eq('angel_id', angelId)
            .eq('user_id', user.id)
            .maybeSingle();
          setHasHearted(!!existingHeart);
        }
      } catch (err) {
        console.error('Failed to load stats:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [angelId]);

  const toggleHeart = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      alert('Please log in to react.');
      return;
    }

    if (hasHearted) {
      // Remove heart
      await supabase
        .from('angel_hearts')
        .delete()
        .eq('angel_id', angelId)
        .eq('user_id', user.id);
      setHeartCount((prev) => Math.max(0, prev - 1));
      setHasHearted(false);
    } else {
      // Add heart
      await supabase.from('angel_hearts').insert({
        angel_id: angelId,
        user_id: user.id,
      });
      setHeartCount((prev) => prev + 1);
      setHasHearted(true);
    }
  };

  const openComments = () => {
    // You can later integrate a modal or scroll to a comment section
    alert('Comments feature coming soon!');
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
        <div style={{ width: '80px', height: '24px', background: '#e2e8f0', borderRadius: '6px' }} />
        <div style={{ width: '80px', height: '24px', background: '#e2e8f0', borderRadius: '6px' }} />
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', gap: '1.25rem', alignItems: 'center', marginTop: '1rem' }}>
      {/* Heart Button */}
      <button
        onClick={toggleHeart}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.375rem',
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          fontSize: '0.95rem',
          fontWeight: '600',
          color: hasHearted ? '#ef4444' : '#64748b',
        }}
        aria-label={hasHearted ? 'Remove heart' : 'Add heart'}
      >
        {hasHearted ? '❤️' : '🤍'} {heartCount}
      </button>

      {/* Comment Button */}
      <button
        onClick={openComments}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.375rem',
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          fontSize: '0.95rem',
          fontWeight: '600',
          color: '#64748b',
        }}
        aria-label="View or add comments"
      >
        💬 {commentCount}
      </button>
    </div>
  );
}