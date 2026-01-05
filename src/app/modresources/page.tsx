'use client';

import { useEffect, useState, useMemo } from 'react';
import { createClient } from '@/utils/supabase/client';
import { User } from '@supabase/supabase-js';

type Resource = {
  id: string;
  title: string;
  excerpt: string;
  type: string;
  tags: string[];
  content_warnings: string[];
  book_author?: string;
  book_quote?: string;
  external_url?: string;
  community_source?: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
};

export default function ModResourcesPage() {
  const supabase = useMemo(() => createClient(), []);
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);
  const [authChecked, setAuthChecked] = useState(false);
 const [user, setUser] = useState<User | null>(null);

  // Check auth status on mount
  useEffect(() => {
    const checkUser = async () => {
      const { data: { user }, error } = await supabase.auth.getUser();
      if (error) {
        console.error('Auth check error:', error);
      } else if (!user) {
        console.warn('No authenticated user — moderation will fail due to RLS.');
      } else {
        console.log('Authenticated as:', user.email);
        setUser(user);
      }
      setAuthChecked(true);
    };

    checkUser();
  }, [supabase]);

  // Fetch pending resources
  useEffect(() => {
    const fetchPending = async () => {
      const { data, error } = await supabase
        .from('resources')
        .select('*')
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ Failed to fetch pending resources:', error);
      } else {
        console.log(`✅ Fetched ${data?.length || 0} pending resource(s)`);
        setResources(data || []);
      }
      setLoading(false);
    };

    if (authChecked) {
      fetchPending();
    }
  }, [supabase, authChecked]);

  const handleApprove = async (id: string) => {
    console.log(`➡️ Attempting to approve resource ID: ${id}`);
    const { error } = await supabase
      .from('resources')
      .update({ status: 'approved' })
      .eq('id', id);

    if (error) {
      console.error('❌ Approve failed:', {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint,
      });
      alert(`Approve failed: ${error.message}`);
    } else {
      console.log(`✅ Resource ${id} approved`);
      setResources(resources.filter(r => r.id !== id));
    }
  };

  const handleReject = async (id: string) => {
    console.log(`➡️ Attempting to reject resource ID: ${id}`);
    const { error } = await supabase
      .from('resources')
      .update({ status: 'rejected' })
      .eq('id', id);

    if (error) {
      console.error('❌ Reject failed:', {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint,
      });
      alert(`Reject failed: ${error.message}`);
    } else {
      console.log(`✅ Resource ${id} rejected`);
      setResources(resources.filter(r => r.id !== id));
    }
  };

  if (!authChecked) {
    return <div style={{ padding: '2rem', textAlign: 'center' }}>Checking authentication...</div>;
  }

  if (!user) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        🔒 You must be signed in to moderate resources.
      </div>
    );
  }

  if (loading) {
    return <div style={{ padding: '2rem', textAlign: 'center' }}>Loading pending resources...</div>;
  }

  return (
    <div style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto' }}>
      <h1 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>
        Moderate Resources ({resources.length} pending)
      </h1>

      {resources.length === 0 ? (
        <p>No pending resources.</p>
      ) : (
        resources.map((res) => (
          <div
            key={res.id}
            style={{
              border: '1px solid #ddd',
              padding: '1rem',
              marginBottom: '1rem',
              borderRadius: '0.5rem',
              backgroundColor: '#fafafa',
            }}
          >
            <h3 style={{ fontWeight: '600', marginBottom: '0.25rem' }}>{res.title}</h3>
            <p style={{ fontSize: '0.875rem', color: '#555', marginBottom: '0.5rem' }}>
              {res.excerpt}
            </p>
            <p style={{ fontSize: '0.875rem', color: '#777' }}>
              <strong>Type:</strong> {res.type}
            </p>
            {res.tags.length > 0 && (
              <p style={{ fontSize: '0.875rem', color: '#777' }}>
                <strong>Tags:</strong> {res.tags.join(', ')}
              </p>
            )}
            {res.content_warnings.length > 0 && (
              <p style={{ fontSize: '0.875rem', color: '#777' }}>
                <strong>Warnings:</strong> {res.content_warnings.join(', ')}
              </p>
            )}
            {res.book_author && (
              <p style={{ fontSize: '0.875rem', color: '#777' }}>
                <strong>Author:</strong> {res.book_author}
              </p>
            )}
            {res.external_url && (
              <p style={{ fontSize: '0.875rem', color: '#777' }}>
                <strong>Link:</strong>{' '}
                <a href={res.external_url} target="_blank" rel="noopener noreferrer">
                  {res.external_url}
                </a>
              </p>
            )}

            <div style={{ marginTop: '0.75rem', display: 'flex', gap: '0.5rem' }}>
              <button
                onClick={() => handleApprove(res.id)}
                style={{
                  backgroundColor: '#22c55e',
                  color: 'white',
                  border: 'none',
                  padding: '0.375rem 0.75rem',
                  borderRadius: '0.375rem',
                  cursor: 'pointer',
                }}
              >
                Approve
              </button>
              <button
                onClick={() => handleReject(res.id)}
                style={{
                  backgroundColor: '#ef4444',
                  color: 'white',
                  border: 'none',
                  padding: '0.375rem 0.75rem',
                  borderRadius: '0.375rem',
                  cursor: 'pointer',
                }}
              >
                Reject
              </button>
            </div>
          </div>
        ))
      )}
    </div>
  );
}