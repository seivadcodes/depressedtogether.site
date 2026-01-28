// src/app/test-upload-resources/page.tsx
'use client';

import { useState, ChangeEvent } from 'react';
import { createClient } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'react-hot-toast';

export default function TestUploadResourcesPage() {
  const { user } = useAuth();
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0] || null;
    if (!selected) return;

    console.debug('[DEBUG] Selected file:', {
      name: selected.name,
      type: selected.type,
      size: selected.size,
    });

    if (!selected.type.startsWith('image/')) {
      toast.error('Please select an image (JPEG, PNG, GIF, etc.)');
      return;
    }

    if (selected.size > 5 * 1024 * 1024) {
      toast.error('Image must be under 5MB');
      return;
    }

    setFile(selected);
    const reader = new FileReader();
    reader.onloadend = () => setPreview(reader.result as string);
    reader.readAsDataURL(selected);
  };

  const handleUpload = async () => {
    if (!user) {
      toast.error('You must be signed in to upload.');
      return;
    }
    if (!file) {
      toast.error('No file selected.');
      return;
    }

    setUploading(true);
    const supabase = createClient();

    try {
      // Path format: resources/{userId}/test-upload-{timestamp}.ext
      const ext = file.name.split('.').pop() || 'jpg';
      const fileName = `${user.id}/test-upload-${Date.now()}.${ext}`;
      console.debug('[DEBUG] Uploading to resources bucket with path:', fileName);

      const { data, error } = await supabase.storage
        .from('resources')
        .upload(fileName, file, {
          upsert: true,
          contentType: file.type,
        });

      if (error) {
        console.error('[ERROR] Upload failed:', error);
        toast.error(`Upload failed: ${error.message}`);
        return;
      }

      console.log('[SUCCESS] File uploaded:', data);
      toast.success('✅ Image uploaded to "resources" bucket!');

      // Optional: Log public URL
      const publicUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/resources/${fileName}`;
      console.debug('[DEBUG] Public URL (if bucket is public):', publicUrl);

      // Reset
      setFile(null);
      setPreview(null);
    } catch (err) {
      console.error('[CATCH] Unexpected error:', err);
      toast.error('Unexpected error during upload.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div style={{ padding: '2rem', maxWidth: '600px', margin: '0 auto' }}>
      <h1>🧪 Test Upload to `resources` Bucket</h1>
      <p>This tool uploads images to the <code>resources</code> Supabase Storage bucket.</p>

      <input type="file" accept="image/*" onChange={handleFileChange} />
      {preview && (
        <div style={{ marginTop: '1rem' }}>
          <img
            src={preview}
            alt="Preview"
            style={{ maxHeight: '200px', maxWidth: '100%', objectFit: 'contain' }}
          />
        </div>
      )}

      <button
        onClick={handleUpload}
        disabled={!file || uploading || !user}
        style={{
          marginTop: '1rem',
          padding: '0.5rem 1rem',
          backgroundColor: uploading ? '#ccc' : '#3b82f6',
          color: 'white',
          border: 'none',
          borderRadius: '0.375rem',
          cursor: uploading ? 'not-allowed' : 'pointer',
        }}
      >
        {uploading ? 'Uploading…' : '📤 Upload to resources'}
      </button>

      {!user && (
        <p style={{ color: 'red', marginTop: '1rem' }}>
          ⚠️ You are not signed in. Authentication is required.
        </p>
      )}
    </div>
  );
}