// src/app/users/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';

type Profile = {
  id: string;
  full_name: string;
  email?: string | null;
};

export default function UsersPage() {
  const { user, loading: authLoading } = useAuth();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      router.replace('/auth');
      return;
    }

    const fetchProfiles = async () => {
      try {
        const supabase = createClient();
        const { data, error } = await supabase
          .from('profiles')
          .select('id, full_name, email')
          .order('full_name', { ascending: true });

        if (error) throw error;

        setProfiles(data || []);
      } catch (err) {
        console.error('Failed to fetch users:', err);
        setError('Unable to load users.');
      } finally {
        setLoading(false);
      }
    };

    fetchProfiles();
  }, [user, authLoading, router]);

  if (authLoading || loading) {
    return <div style={{ padding: '2rem' }}>Loading users...</div>;
  }

  if (!user) {
    return null; // Redirect already triggered
  }

  if (error) {
    return (
      <div style={{ padding: '2rem', color: 'red' }}>
        Error: {error}
      </div>
    );
  }

  return (
    <div style={{ padding: '2rem', maxWidth: '500px', margin: '0 auto' }}>
      <h2>Select a User</h2>
      <select
        style={{
          width: '100%',
          padding: '0.75rem',
          marginTop: '1rem',
          borderRadius: '6px',
          border: '1px solid #ccc',
          fontSize: '1rem',
        }}
        onChange={(e) => {
          const userId = e.target.value;
          if (userId) {
            // Example: navigate to user detail page
            router.push(`/users/${userId}`);
          }
        }}
      >
        <option value="">-- Choose a user --</option>
        {profiles.map((profile) => (
          <option key={profile.id} value={profile.id}>
            {profile.full_name} {profile.email ? `(${profile.email})` : ''}
          </option>
        ))}
      </select>

      {profiles.length === 0 && (
        <p style={{ marginTop: '1rem', color: '#666' }}>
          No users found.
        </p>
      )}
    </div>
  );
}