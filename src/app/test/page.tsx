// src/app/test/create-event-test/page.tsx
'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'react-hot-toast';

type Event = {
  id: string;
  title: string;
  start_time: string;
  image_url: string | null;
};

export default function CreateEventTest() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [title, setTitle] = useState('');
  const [startTime, setStartTime] = useState('');

  const [createdEvent, setCreatedEvent] = useState<Event | null>(null);

  const supabase = createClient();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (!selected) return;

    if (!selected.type.startsWith('image/')) {
      toast.error('Please select an image file.');
      return;
    }

    if (selected.size > 5 * 1024 * 1024) {
      toast.error('File must be under 5MB.');
      return;
    }

    setFile(selected);
    setPreview(URL.createObjectURL(selected));
  };

  const handleCreateEvent = async () => {
    if (!title.trim()) {
      toast.error('Please enter an event title.');
      return;
    }
    if (!startTime) {
      toast.error('Please select a start time.');
      return;
    }

    let imagePath: string | null = null;

    // Upload image if provided
    if (file) {
      setUploading(true);
      try {
        const fileName = `test-event-${Date.now()}-${file.name}`;
        const { error } = await supabase.storage
          .from('event-images')
          .upload(fileName, file, {
            upsert: true,
            contentType: file.type,
          });

        if (error) throw error;
        imagePath = `event-images/${fileName}`;
      } catch (err) {
        console.error('Upload failed:', err);
        toast.error('Image upload failed.');
        setUploading(false);
        return;
      } finally {
        setUploading(false);
      }
    }

    // Create event in DB
    setCreating(true);
    try {
      const { data, error } = await supabase
        .from('events')
        .insert({
          title,
          start_time: startTime,
          image_url: imagePath,
          duration: 60, // default 1 hour
          max_attendees: 10,
          host_name: 'Test Host',
          description: 'This is a test event created from the dev tool.',
        })
        .select()
        .single();

      if (error) throw error;

      setCreatedEvent(data);
      toast.success('Event created successfully!');
    } catch (err) {
      console.error('Event creation failed:', err);
      toast.error('Failed to create event.');
    } finally {
      setCreating(false);
    }
  };

  return (
    <div style={{ padding: '2rem', maxWidth: '600px', margin: '0 auto' }}>
      <h1>Create Test Event</h1>
      <p>Upload an image and create a minimal event for testing display.</p>

      <div style={{ marginTop: '1rem' }}>
        <label>Title:</label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Event title"
          style={{
            width: '100%',
            padding: '0.5rem',
            marginTop: '0.25rem',
            border: '1px solid #ccc',
            borderRadius: '4px',
          }}
        />
      </div>

      <div style={{ marginTop: '1rem' }}>
        <label>Start Time:</label>
        <input
          type="datetime-local"
          value={startTime}
          onChange={(e) => setStartTime(e.target.value)}
          style={{
            width: '100%',
            padding: '0.5rem',
            marginTop: '0.25rem',
            border: '1px solid #ccc',
            borderRadius: '4px',
          }}
        />
      </div>

      <div style={{ marginTop: '1rem' }}>
        <label>Event Image (optional):</label>
        <input type="file" accept="image/*" onChange={handleFileChange} />
      </div>

      {preview && (
        <div style={{ marginTop: '1rem' }}>
          <h3>Image Preview:</h3>
          <img
            src={preview}
            alt="Preview"
            style={{ maxWidth: '100%', maxHeight: '200px', borderRadius: '8px' }}
          />
        </div>
      )}

      <button
        onClick={handleCreateEvent}
        disabled={uploading || creating}
        style={{
          marginTop: '1.5rem',
          padding: '0.5rem 1rem',
          backgroundColor: '#10b981',
          color: 'white',
          border: 'none',
          borderRadius: '6px',
          cursor: 'pointer',
          opacity: uploading || creating ? 0.7 : 1,
        }}
      >
        {uploading
          ? 'Uploading image...'
          : creating
            ? 'Creating event...'
            : 'Create Test Event'}
      </button>

      {createdEvent && (
        <div style={{ marginTop: '2rem', padding: '1rem', border: '1px solid #eee', borderRadius: '8px' }}>
          <h2>✅ Created Event</h2>
          <p><strong>Title:</strong> {createdEvent.title}</p>
          <p><strong>Start:</strong> {new Date(createdEvent.start_time).toLocaleString()}</p>
          {createdEvent.image_url && (
            <>
              <p><strong>Image (via /api/media):</strong></p>
              <img
                src={`/api/media/${createdEvent.image_url}`}
                alt="Uploaded via API"
                style={{
                  maxWidth: '100%',
                  maxHeight: '300px',
                  borderRadius: '8px',
                  border: '1px solid #ddd',
                }}
                onError={(e) => {
                  (e.target as HTMLImageElement).src = '/placeholder-failed.png';
                }}
              />
              <p style={{ fontSize: '0.875rem', color: '#666', marginTop: '0.5rem' }}>
                Path: <code>{createdEvent.image_url}</code>
              </p>
            </>
          )}
          <p style={{ marginTop: '1rem' }}>
            Now visit <a href="/schedule">/schedule</a> to see it in the real list.
          </p>
        </div>
      )}
    </div>
  );
}