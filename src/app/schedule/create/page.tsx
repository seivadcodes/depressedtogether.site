// app/schedule/create/page.tsx
'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

const formatDateToLocalInput = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day}T${hours}:${minutes}`;
};

export default function CreateEventPage() {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [hostName, setHostName] = useState('');
  const [startTime, setStartTime] = useState('');
  const [duration, setDuration] = useState(60);
  const [isRecurring, setIsRecurring] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const supabase = createClient();
  const router = useRouter();

  useEffect(() => {
    const init = async () => {
      const { data: { session }, error: authError } = await supabase.auth.getSession();

      if (authError || !session?.user) {
        router.push('/auth');
        return;
      }

      setUserId(session.user.id);

      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', session.user.id)
        .single();

      if (profileError || !profile) {
        router.push('/setup-profile');
        return;
      }

      setHostName(profile.full_name || 'Host');

      const now = new Date();
      now.setMinutes(now.getMinutes() + 30);
      setStartTime(formatDateToLocalInput(now));
    };

    init();
  }, [supabase, router]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (!selected) return;

    if (!selected.type.startsWith('image/')) {
      setError('Please select an image (JPEG, PNG, etc.).');
      return;
    }

    if (selected.size > 5 * 1024 * 1024) {
      setError('Image must be under 5MB.');
      return;
    }

    setFile(selected);
    setPreview(URL.createObjectURL(selected));
    setError(null);
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const cleanTitle = title.trim();
    const cleanHostName = hostName.trim();
    const hasValidTime = startTime && !isNaN(new Date(startTime).getTime());

    if (!cleanTitle || !cleanHostName || !hasValidTime) {
      setError('Please fill in all required fields.');
      return;
    }
    if (!userId) {
      setError('User not authenticated.');
      return;
    }

    let imagePath: string | null = null;

    if (file) {
      setUploadingImage(true);
      try {
        const fileName = `event-${userId}-${Date.now()}-${file.name}`;
        const { error: uploadError } = await supabase.storage
          .from('event-images')
          .upload(fileName, file, {
            upsert: true,
            contentType: file.type,
          });

        if (uploadError) throw uploadError;
        imagePath = `event-images/${fileName}`;
      } catch (err) {
        console.error('Image upload failed:', err);
        setError('Failed to upload image. Please try again.');
        setUploadingImage(false);
        return;
      } finally {
        setUploadingImage(false);
      }
    }

    setLoading(true);

    try {
      const localDateTime = new Date(startTime);
      const utcISO = localDateTime.toISOString();

      const { error: insertError } = await supabase
        .from('events')
        .insert({
          title: cleanTitle,
          description: description.trim() || null,
          host_id: userId,
          host_name: cleanHostName,
          start_time: utcISO,
          duration: duration,
          is_recurring: isRecurring,
          image_url: imagePath,
        });

      if (insertError) throw insertError;

      setSuccess(true);
      setTimeout(() => router.push('/schedule'), 1500);
    } catch (err) {
      console.error('Event creation error:', err);
      setError('Unable to create event. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.pageContainer}>
      <div style={styles.contentContainer}>
        <button
          onClick={() => router.back()}
          style={styles.backButton}
          onMouseEnter={(e) => (e.currentTarget.style.color = '#1f2937')}
          onMouseLeave={(e) => (e.currentTarget.style.color = '#4b5563')}
        >
          ← Back to schedule
        </button>

        <h1 style={styles.heading}>Create a New Support Event</h1>

        {error && <div style={styles.errorContainer}>{error}</div>}
        {success && <div style={styles.successContainer}>Event created! Redirecting...</div>}

        <form onSubmit={handleSubmit} style={styles.form}>
          {/* Image Upload – Styled */}
          <div style={styles.formGroup}>
            <label style={styles.label}>Event Image (optional)</label>
            <div
              style={{
                ...styles.imageUploadBox,
                cursor: 'pointer',
                position: 'relative',
                backgroundColor: preview ? '#f8fafc' : '#ffffff',
              }}
              onClick={triggerFileInput}
            >
              {preview ? (
                <img
                  src={preview}
                  alt="Event preview"
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    borderRadius: '0.75rem',
                  }}
                />
              ) : (
                <div style={styles.imagePlaceholder}>
                  <p style={styles.imagePlaceholderText}>Click to upload an image</p>
                  <p style={styles.imagePlaceholderSubtext}>JPEG or PNG, max 5MB</p>
                </div>
              )}
            </div>
            {/* Hidden file input */}
            <input
              type="file"
              accept="image/*"
              ref={fileInputRef}
              onChange={handleFileSelect}
              style={{ display: 'none' }}
              aria-label="Upload event image"
            />
          </div>

          {/* Title */}
          <div style={styles.formGroup}>
            <label style={styles.label}>Event Title *</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              style={styles.input}
              placeholder="e.g., Evening Check-In Circle"
              required
            />
          </div>

          {/* Host Name */}
          <div style={styles.formGroup}>
            <label style={styles.label}>Host Name *</label>
            <input
              type="text"
              value={hostName}
              onChange={(e) => setHostName(e.target.value)}
              style={styles.input}
              placeholder="e.g., Jane or Support Team"
              required
            />
          </div>

          {/* Description */}
          <div style={styles.formGroup}>
            <label style={styles.label}>Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              style={styles.textarea}
              placeholder="What will happen? Who is it for? What kind of support will be offered?"
            />
          </div>

          {/* Start Time */}
          <div style={styles.formGroup}>
            <label style={styles.label}>Start Time (your local time) *</label>
            <input
              type="datetime-local"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              style={styles.input}
              required
            />
            <p style={styles.helperText}>Shown in your local time.</p>
          </div>

          {/* Duration */}
          <div style={styles.formGroup}>
            <label style={styles.label}>Duration (minutes) *</label>
            <input
              type="number"
              min="10"
              max="240"
              value={duration}
              onChange={(e) => setDuration(Number(e.target.value))}
              style={styles.input}
            />
          </div>

          {/* Recurring */}
          <div style={styles.checkboxContainer}>
            <input
              type="checkbox"
              id="recurring"
              checked={isRecurring}
              onChange={(e) => setIsRecurring(e.target.checked)}
              style={styles.checkbox}
            />
            <label htmlFor="recurring" style={styles.checkboxLabel}>
              This is a recurring support event
            </label>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading || uploadingImage}
            style={{
              ...styles.submitButton,
              backgroundColor: loading || uploadingImage ? '#9ca3af' : styles.submitButton.backgroundColor,
              cursor: loading || uploadingImage ? 'not-allowed' : 'pointer',
            }}
          >
            {uploadingImage
              ? 'Uploading image...'
              : loading
                ? 'Creating event...'
                : 'Create Event'}
          </button>
        </form>
      </div>
    </div>
  );
}

// Reuse your existing styles — only minor tweak to imageUploadBox
const styles = {
  pageContainer: {
    minHeight: '100vh',
    background: 'linear-gradient(to bottom, #f8fafc, #f1f5f9, #e2e8f0)',
    padding: '1rem',
    paddingBottom: '6rem',
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
  },
  contentContainer: {
    width: '100%',
    maxWidth: '32rem',
  },
  backButton: {
    color: '#4b5563',
    fontSize: '0.875rem',
    marginBottom: '1rem',
    display: 'flex',
    alignItems: 'center',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    transition: 'color 0.2s',
  },
  heading: {
    fontSize: '1.5rem',
    fontWeight: '700' as const,
    color: '#1e293b',
    marginBottom: '1.5rem',
  },
  errorContainer: {
    backgroundColor: '#fef2f2',
    color: '#b91c1c',
    padding: '0.75rem',
    borderRadius: '0.5rem',
    marginBottom: '1rem',
    fontSize: '0.875rem',
  },
  successContainer: {
    backgroundColor: '#ecfdf5',
    color: '#047857',
    padding: '0.75rem',
    borderRadius: '0.5rem',
    marginBottom: '1rem',
    fontSize: '0.875rem',
  },
  form: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '1.25rem',
  },
  formGroup: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '0.5rem',
  },
  label: {
    display: 'block',
    fontWeight: '600' as const,
    color: '#374151',
    marginBottom: '0.5rem',
    fontSize: '0.875rem',
  },
  input: {
    width: '100%',
    padding: '0.75rem',
    border: '1px solid #cbd5e1',
    borderRadius: '0.5rem',
    fontSize: '1rem',
    boxSizing: 'border-box' as const,
    backgroundColor: '#ffffff',
  },
  textarea: {
    width: '100%',
    padding: '0.75rem',
    border: '1px solid #cbd5e1',
    borderRadius: '0.5rem',
    fontSize: '1rem',
    boxSizing: 'border-box' as const,
    resize: 'vertical' as const,
    backgroundColor: '#ffffff',
  },
  imageUploadBox: {
    border: '2px dashed #cbd5e1',
    borderRadius: '0.75rem',
    padding: '1rem',
    textAlign: 'center' as const,
    backgroundColor: '#ffffff',
    minHeight: '120px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  imagePlaceholder: {
    color: '#64748b',
    fontSize: '0.875rem',
  },
  imagePlaceholderText: {
    margin: '0',
    fontWeight: '500',
  },
  imagePlaceholderSubtext: {
    fontSize: '0.75rem',
    marginTop: '0.25rem',
    color: '#94a3b8',
    margin: '0',
  },
  helperText: {
    fontSize: '0.75rem',
    color: '#64748b',
    marginTop: '0.25rem',
  },
  checkboxContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    marginTop: '0.25rem',
  },
  checkbox: {
    width: '1rem',
    height: '1rem',
    accentColor: '#3b82f6',
  },
  checkboxLabel: {
    color: '#374151',
    fontSize: '0.875rem',
  },
  submitButton: {
    width: '100%',
    padding: '0.875rem',
    color: 'white',
    fontWeight: '600' as const,
    borderRadius: '0.5rem',
    border: 'none',
    fontSize: '1rem',
    marginTop: '0.5rem',
    transition: 'background-color 0.2s',
    backgroundColor: '#3b82f6',
  },
};