'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import Image from 'next/image';

// Helper to format Date to local YYYY-MM-DDTHH:mm (for datetime-local input)
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
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [imageBoxHover, setImageBoxHover] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const supabase = createClient();
  const router = useRouter();

  // Initialize user & defaults
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

      // Set default start time to LOCAL time +30 min
      const now = new Date();
      now.setMinutes(now.getMinutes() + 30);
      setStartTime(formatDateToLocalInput(now));
    };

    init();
  }, [supabase, router]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setError('Image must be less than 5MB.');
        return;
      }
      if (!file.type.startsWith('image/')) {
        setError('Please upload an image (jpg, png, etc.).');
        return;
      }
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const uploadImage = async (file: File, eventId: string): Promise<string | null> => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${eventId}.${fileExt}`;
    const filePath = `event-images/${fileName}`;

    const { error } = await supabase.storage
      .from('event-images')
      .upload(filePath, file, { upsert: true });

    if (error) {
      console.error('Image upload error:', error);
      throw new Error('Failed to upload event image.');
    }

    const { data } = supabase.storage.from('event-images').getPublicUrl(filePath);
    return data.publicUrl;
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

    setLoading(true);

    try {
      const localDateTime = new Date(startTime);
      const utcISO = localDateTime.toISOString();

      const { data, error: insertError } = await supabase
        .from('events')
        .insert({
          title: cleanTitle,
          description: description.trim() || null,
          host_id: userId,
          host_name: cleanHostName,
          start_time: utcISO,
          duration: duration,
          is_recurring: isRecurring,
        })
        .select('id')
        .single();

      if (insertError) throw insertError;
      if (!data) throw new Error('Event creation failed.');

      let imageUrl = null;
      if (imageFile) {
        imageUrl = await uploadImage(imageFile, data.id);
      }

      if (imageUrl) {
        const { error: updateError } = await supabase
          .from('events')
          .update({ image_url: imageUrl })
          .eq('id', data.id);

        if (updateError) {
          console.warn('Failed to update image URL:', updateError);
        }
      }

      setSuccess(true);
      setTimeout(() => router.push('/schedule'), 1500);
    } catch (err) {
      console.error('Event creation error:', err);

      if (err instanceof Error) {
        setError(err.message || 'Unable to create event. Please try again.');
      } else {
        setError('Unable to create event. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
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
          {/* Image Upload */}
          <div style={styles.formGroup}>
            <label style={styles.label}>Event Image (optional)</label>
            <div
              onClick={triggerFileInput}
              onMouseEnter={() => setImageBoxHover(true)}
              onMouseLeave={() => setImageBoxHover(false)}
              style={{
                ...styles.imageUploadBox,
                backgroundColor: imageBoxHover ? '#f9fafb' : '#ffffff',
              }}
            >
              {imagePreview ? (
                <div style={styles.imagePreviewContainer}>
                  <Image
                    src={imagePreview}
                    alt="Preview"
                    fill
                    style={styles.imagePreview}
                    unoptimized
                  />
                </div>
              ) : (
                <div style={styles.imagePlaceholder}>
                  <p style={styles.imagePlaceholderText}>Click to upload an image (max 5MB)</p>
                  <p style={styles.imagePlaceholderSubtext}>JPG, PNG, or GIF</p>
                </div>
              )}
            </div>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleImageChange}
              accept="image/*"
              style={styles.hiddenInput}
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
            disabled={loading}
            style={{
              ...styles.submitButton,
              backgroundColor: loading ? '#9ca3af' : styles.submitButton.backgroundColor,
              cursor: loading ? 'not-allowed' : 'pointer',
            }}
          >
            {loading ? 'Creating...' : 'Create Event'}
          </button>
        </form>
      </div>
    </div>
  );
}

// Inline CSS styles — updated for depression support theme
const styles = {
  pageContainer: {
    minHeight: '100vh',
    background: 'linear-gradient(to bottom, #f8fafc, #f1f5f9, #e2e8f0)', // soft blue-gray calming gradient
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
    color: '#1e293b', // dark slate for clarity
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
    border: '1px solid #cbd5e1', // softer border
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
    cursor: 'pointer',
    backgroundColor: '#ffffff',
    transition: 'background-color 0.2s',
  },
  imagePreviewContainer: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    height: '10rem',
  },
  imagePreview: {
    maxHeight: '10rem',
    borderRadius: '0.5rem',
    objectFit: 'cover' as const,
    width: 'auto',
    height: 'auto',
    maxWidth: '100%',
  },
  imagePlaceholder: {
    color: '#64748b', // muted gray-blue
    fontSize: '0.875rem',
  },
  imagePlaceholderText: {
    margin: '0',
  },
  imagePlaceholderSubtext: {
    fontSize: '0.75rem',
    marginTop: '0.25rem',
    color: '#94a3b8',
    margin: '0',
  },
  hiddenInput: {
    display: 'none',
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
    accentColor: '#3b82f6', // keep primary action color
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
    backgroundColor: '#3b82f6', // consistent with your brand
  },
};