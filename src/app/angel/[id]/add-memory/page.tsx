'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { createClient } from '@/lib/supabase';
import Link from 'next/link';

interface MemoryPhoto {
  file: File;
  preview: string;
  caption: string;
}

export default function AddMemoryPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const angelId = params.id;

  const [photos, setPhotos] = useState<MemoryPhoto[]>([{ file: null as any, preview: '', caption: '' }]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [profileId, setProfileId] = useState<string | null>(null);

  // Get current user's profile_id
  useEffect(() => {
    const fetchProfile = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login');
        return;
      }
      // Assuming your profiles table links auth.users.id → profiles.id
      const { data: profileData, error } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', user.id)
        .single();

      if (error || !profileData) {
        setError('Profile not found.');
        return;
      }
      setProfileId(profileData.id);
    };

    if (angelId) fetchProfile();
  }, [angelId, router]);

  const handleFileChange = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Please upload an image file.');
      return;
    }

    const preview = URL.createObjectURL(file);
    const newPhotos = [...photos];
    newPhotos[index] = { ...newPhotos[index], file, preview };
    setPhotos(newPhotos);
  };

  const handleCaptionChange = (index: number, value: string) => {
    const newPhotos = [...photos];
    newPhotos[index] = { ...newPhotos[index], caption: value };
    setPhotos(newPhotos);
  };

  const addAnotherPhoto = () => {
    setPhotos([...photos, { file: null as any, preview: '', caption: '' }]);
  };

  const removePhoto = (index: number) => {
    const newPhotos = photos.filter((_, i) => i !== index);
    setPhotos(newPhotos.length ? newPhotos : [{ file: null as any, preview: '', caption: '' }]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profileId || !angelId) return;

    const validPhotos = photos.filter(p => p.file);
    if (validPhotos.length === 0) {
      setError('Please select at least one image.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const supabase = createClient();

      for (const { file, caption } of validPhotos) {
        // Upload to Supabase Storage
        const fileExt = file.name.split('.').pop();
        const fileName = `${profileId}/memories/${crypto.randomUUID()}.${fileExt}`;
        const { error: uploadError } = await supabase.storage
          .from('angels-media')
          .upload(fileName, file, { upsert: false });

        if (uploadError) throw uploadError;

        const { data: publicUrlData } = supabase.storage
          .from('angels-media')
          .getPublicUrl(fileName);

        const photoUrl = publicUrlData?.publicUrl;

        if (!photoUrl) throw new Error('Failed to get public URL');

        // Insert into angel_memories
        const { error: insertError } = await supabase
          .from('angel_memories')
          .insert({
            angel_id: angelId,
            profile_id: profileId,
            photo_url: photoUrl,
            caption: caption || null,
          });

        if (insertError) throw insertError;
      }

      // Success! Go back to angel detail
      router.push(`/angel/${angelId}`);
    } catch (err: any) {
      console.error('Failed to add memory:', err);
      setError(err.message || 'Could not save memory. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!profileId) {
    return <div style={{ padding: '2rem', textAlign: 'center' }}>Loading...</div>;
  }

  return (
    <div style={{ maxWidth: '600px', margin: '0 auto', padding: '1.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h1 style={{ fontSize: '1.5rem', color: '#1e293b' }}>Add a Memory</h1>
        <Link
          href={`/angel/${angelId}`}
          style={{ color: '#3b82f6', textDecoration: 'none', fontSize: '0.95rem' }}
        >
          ← Cancel
        </Link>
      </div>

      {error && <p style={{ color: '#d32f2f', marginBottom: '1rem' }}>{error}</p>}

      <form onSubmit={handleSubmit}>
        {photos.map((photo, index) => (
          <div key={index} style={{ marginBottom: '1.5rem', paddingBottom: '1rem', borderBottom: '1px dashed #e2e8f0' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
              <label style={{ fontWeight: '600' }}>
                Photo {index + 1}
                {photos.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removePhoto(index)}
                    style={{
                      marginLeft: '0.5rem',
                      background: 'none',
                      border: 'none',
                      color: '#dc2626',
                      cursor: 'pointer',
                      fontSize: '0.9rem',
                    }}
                  >
                    (Remove)
                  </button>
                )}
              </label>
            </div>

            <input
              type="file"
              accept="image/*"
              onChange={(e) => handleFileChange(index, e)}
              required={!photo.file}
              style={{ width: '100%', marginBottom: '0.75rem' }}
            />

            {photo.preview && (
              <div style={{ marginBottom: '0.75rem' }}>
                <img
                  src={photo.preview}
                  alt="Preview"
                  style={{
                    maxHeight: '200px',
                    maxWidth: '100%',
                    objectFit: 'cover',
                    borderRadius: '8px',
                  }}
                />
              </div>
            )}

            <textarea
              placeholder="Add a caption (optional)"
              value={photo.caption}
              onChange={(e) => handleCaptionChange(index, e.target.value)}
              rows={2}
              style={{
                width: '100%',
                padding: '0.5rem',
                border: '1px solid #cbd5e1',
                borderRadius: '6px',
                resize: 'vertical',
              }}
            />
          </div>
        ))}

        <button
          type="button"
          onClick={addAnotherPhoto}
          style={{
            marginBottom: '1.5rem',
            color: '#3b82f6',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            fontWeight: '600',
          }}
        >
          + Add Another Photo
        </button>

        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <Link
            href={`/angel/${angelId}`}
            style={{
              flex: 1,
              padding: '0.75rem',
              textAlign: 'center',
              background: '#f1f5f9',
              borderRadius: '8px',
              textDecoration: 'none',
              color: '#1e293b',
            }}
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={loading}
            style={{
              flex: 1,
              padding: '0.75rem',
              background: '#3b82f6',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontWeight: '600',
              opacity: loading ? 0.8 : 1,
            }}
          >
            {loading ? 'Saving...' : 'Save Memories'}
          </button>
        </div>
      </form>
    </div>
  );
}