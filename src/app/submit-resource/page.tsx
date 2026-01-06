// src/app/submit-resource/page.tsx
'use client';

import { useState, useRef } from 'react';
import { createClient } from '@/utils/supabase/client';
import Link from 'next/link';
import { BookOpen, Upload, Link as LinkIcon, AlertTriangle } from 'lucide-react';
import Image from 'next/image';
const CATEGORIES: Record<string, string> = {
  Story: 'Personal Stories',
  Guide: 'Guidance',
  Tool: 'Tools',
  Video: 'Videos',
  Book: 'Books',
};

const TAG_SUGGESTIONS = [
  'spouse', 'parent', 'child', 'sibling', 'friend', 'pet',
  'sudden loss', 'illness', 'suicide', 'overdose', 'estrangement',
  'holidays', 'guilt', 'anger', 'memory', 'ritual', 'hope'
];



export default function SubmitResourcePage() {
  const supabase = createClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  type ResourceType = 'Story' | 'Guide' | 'Tool' | 'Video' | 'Book';

  const [formData, setFormData] = useState({
    title: '',
    excerpt: '',
    type: 'Story' as ResourceType,
    tags: [] as string[],
    contentWarnings: [] as string[],
    communitySource: '',
    bookAuthor: '',
    bookQuote: '',
    externalUrl: '',
    videoType: 'link' as 'link' | 'upload',
    videoFile: null as File | null,
    videoPreview: '' as string,
    bookCoverFile: null as File | null,
  bookCoverPreview: '' as string,
  });

  const [newTag, setNewTag] = useState('');
  const [newWarning, setNewWarning] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);

  const handleTagAdd = () => {
    if (newTag.trim() && !formData.tags.includes(newTag.trim()) && formData.tags.length < 5) {
      setFormData({ ...formData, tags: [...formData.tags, newTag.trim()] });
      setNewTag('');
    }
  };

  const handleWarningAdd = () => {
    if (newWarning.trim() && !formData.contentWarnings.includes(newWarning.trim())) {
      setFormData({ ...formData, contentWarnings: [...formData.contentWarnings, newWarning.trim()] });
      setNewWarning('');
    }
  };

  const handleTagRemove = (tag: string) => {
    setFormData({ ...formData, tags: formData.tags.filter(t => t !== tag) });
  };

  const handleWarningRemove = (warning: string) => {
    setFormData({ ...formData, contentWarnings: formData.contentWarnings.filter(w => w !== warning) });
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleVideoTypeChange = (type: 'link' | 'upload') => {
    setFormData(prev => ({
      ...prev,
      videoType: type,
      externalUrl: type === 'link' ? prev.externalUrl : '',
      videoFile: type === 'upload' ? prev.videoFile : null,
      videoPreview: type === 'upload' ? prev.videoPreview : '',
    }));
  };

  const handleVideoFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    
    if (file) {
      // Validate file type and size
      const validTypes = ['video/mp4', 'video/webm', 'video/quicktime'];
      const maxSize = 100 * 1024 * 1024; // 100MB
      
      if (!validTypes.includes(file.type)) {
        setErrorMessage('Invalid file type. Please upload MP4, WebM, or MOV files.');
        setSubmitStatus('error');
        return;
      }
      
      if (file.size > maxSize) {
        setErrorMessage('File too large. Maximum size is 100MB.');
        setSubmitStatus('error');
        return;
      }
      
      // Create preview URL
      const previewUrl = URL.createObjectURL(file);
      
      setFormData(prev => ({
        ...prev,
        videoFile: file,
        videoPreview: previewUrl,
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        videoFile: null,
        videoPreview: '',
      }));
    }
  };

  const handleBookCoverChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  const file = e.target.files?.[0] || null;
  if (file) {
    const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
    const maxSize = 5 * 1024 * 1024; // 5MB

    if (!validTypes.includes(file.type)) {
      setErrorMessage('Please upload a JPG, PNG, or WebP image.');
      setSubmitStatus('error');
      return;
    }
    if (file.size > maxSize) {
      setErrorMessage('Image too large. Max size is 5MB.');
      setSubmitStatus('error');
      return;
    }

    const previewUrl = URL.createObjectURL(file);
    setFormData(prev => ({
      ...prev,
      bookCoverFile: file,
      bookCoverPreview: previewUrl,
    }));
  } else {
    setFormData(prev => ({
      ...prev,
      bookCoverFile: null,
      bookCoverPreview: '',
    }));
  }
};

const uploadBookCover = async (file: File) => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  const fileName = `${user.id}/${Date.now()}_cover_${file.name}`;
  const {  error } = await supabase.storage
    .from('book-covers')
    .upload(fileName, file, {
      upsert: true,
      cacheControl: '3600',
    });

  if (error) throw error;
  // Get public URL
  const { data: { publicUrl } } = supabase.storage
    .from('book-covers')
    .getPublicUrl(fileName);
  return publicUrl;
};

  const validate = () => {
    if (!formData.title.trim() || formData.title.length < 5) {
      return 'Title is required (min 5 characters).';
    }
    if (!formData.excerpt.trim() || formData.excerpt.length < 20) {
      return 'Please share a meaningful reflection (min 20 characters).';
    }
    if (formData.tags.length === 0) {
      return 'Please add at least one tag.';
    }
    
    // Book validation
    if (formData.type === 'Book') {
      if (!formData.bookAuthor.trim()) return 'Book author is required.';
      if (!formData.bookQuote.trim() || formData.bookQuote.length > 150) {
        return 'Book quote is required and should be under 150 characters.';
      }
      try {
        new URL(formData.externalUrl);
      } catch {
        return 'Please provide a valid book link (e.g., Amazon, Bookshop).';
      }
    }
    
    // Video validation
    if (formData.type === 'Video') {
      if (formData.videoType === 'link') {
        if (!formData.externalUrl.trim()) {
          return 'Video link is required.';
        }
        try {
          new URL(formData.externalUrl);
        } catch {
          return 'Please provide a valid video URL.';
        }
      } else if (formData.videoType === 'upload') {
        if (!formData.videoFile) {
          return 'Please select a video file to upload.';
        }
      }
    }
    
    // Validate other URLs
    if (formData.externalUrl && formData.type !== 'Book' && formData.type !== 'Video') {
      try {
        new URL(formData.externalUrl);
      } catch {
        return 'Please provide a valid URL.';
      }
    }
    
    return null;
  };

const uploadVideo = async (file: File) => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  const fileName = `${user.id}/${Date.now()}_${file.name}`;
  const { error } = await supabase.storage
    .from('videos')
    .upload(fileName, file, {
      upsert: true,
      cacheControl: '3600',
      contentType: file.type,
    });

  if (error) throw error;

  // ✅ CORRECT WAY to get public URL
  const { data } = supabase.storage
    .from('videos')
    .getPublicUrl(fileName);

  if (!data?.publicUrl) {
    throw new Error('Failed to generate public URL for video');
  }

  return data.publicUrl;
};
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const error = validate();
    if (error) {
      setErrorMessage(error);
      setSubmitStatus('error');
      return;
    }
    let bookCoverUrl = null;
if (formData.type === 'Book' && formData.bookCoverFile) {
  bookCoverUrl = await uploadBookCover(formData.bookCoverFile);
}

    setIsSubmitting(true);
    setSubmitStatus('idle');
    setErrorMessage('');
    setUploadProgress(0);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('You must be signed in to submit.');
      }

      let videoUrl = null;
      if (formData.type === 'Video' && formData.videoType === 'upload' && formData.videoFile) {
        setIsUploading(true);
        videoUrl = await uploadVideo(formData.videoFile);
        setIsUploading(false);
      }

      const { error: supabaseError } = await supabase
        .from('resources')
        .insert({
          user_id: user.id,
          title: formData.title.trim(),
          excerpt: formData.excerpt.trim(),
          type: formData.type,
          category: CATEGORIES[formData.type],
          book_cover_url: bookCoverUrl,
          tags: formData.tags,
          content_warnings: formData.contentWarnings,
          community_source: formData.communitySource || null,
          book_author: formData.type === 'Book' ? formData.bookAuthor.trim() : null,
          book_quote: formData.type === 'Book' ? formData.bookQuote.trim() : null,
          external_url: formData.type === 'Video' && formData.videoType === 'link'
            ? formData.externalUrl.trim()
            : formData.type !== 'Video' && formData.externalUrl
              ? formData.externalUrl.trim()
              : null,
          video_url: formData.type === 'Video' ? (videoUrl || null) : null,
          video_type: formData.type === 'Video' ? formData.videoType : null,
          status: 'pending',
          is_curated: false,
        });

      if (supabaseError) {
        throw supabaseError;
      }

      setSubmitStatus('success');
      
      // Reset form after successful submission
      setFormData({
        title: '',
        excerpt: '',
        type: 'Story',
        tags: [],
        contentWarnings: [],
        communitySource: '',
        bookAuthor: '',
        bookQuote: '',
        externalUrl: '',
        videoType: 'link',
        videoFile: null,
        videoPreview: '',
        bookCoverFile: null as File | null,
  bookCoverPreview: '' as string,
      });
      
    } catch (error: unknown) {
  let message = 'Failed to submit. Please try again.';
  if (error instanceof Error) {
    message = error.message;
  }
  console.error('Submission error:', error);
  setErrorMessage(message);
  setSubmitStatus('error');
}
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f5f5f4', padding: '1.5rem 1rem' }}>
      <div style={{ maxWidth: '640px', margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
          <div
            style={{
              width: '2.75rem',
              height: '2.75rem',
              borderRadius: '9999px',
              backgroundColor: '#fef3c7',
              color: '#92400e',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 0.75rem',
            }}
          >
            <BookOpen size={18} />
          </div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: '700', color: '#1c1917' }}>
            Share a Resource
          </h1>
          <p style={{ color: '#44403c' }}>
            Your experience can be a lifeline for someone else.
          </p>
        </div>

        {submitStatus === 'success' ? (
          <div style={{ backgroundColor: '#fff8e1', padding: '1.25rem', borderRadius: '0.75rem', textAlign: 'center' }}>
            <p style={{ color: '#92400e', fontWeight: '600' }}>
              Thank you. Your resource has been submitted for review.
            </p>
            <p style={{ fontSize: '0.875rem', color: '#6b6864', marginTop: '0.25rem' }}>
              Approved resources appear on the <Link href="/resources" style={{ color: '#d97706' }}>Resources</Link> page.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ backgroundColor: 'white', padding: '1.5rem', borderRadius: '0.75rem', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
            {submitStatus === 'error' && (
              <div style={{ backgroundColor: '#fee2e2', color: '#b91c1c', padding: '0.75rem', borderRadius: '0.5rem', marginBottom: '1rem', display: 'flex', gap: '0.5rem', alignItems: 'flex-start' }}>
                <AlertTriangle size={18} style={{ marginTop: '0.25rem', flexShrink: 0 }} />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Type */}
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.25rem', fontWeight: '600' }}>
                Resource Type
              </label>
              <select
                name="type"
                value={formData.type}
                onChange={handleChange}
                style={{
                  width: '100%',
                  padding: '0.5rem',
                  border: '1px solid #d1d5db',
                  borderRadius: '0.375rem',
                }}
              >
                <option value="Story">Personal Story</option>
                <option value="Guide">Guide / Advice</option>
                <option value="Tool">Tool / Template</option>
                <option value="Video">Video</option>
                <option value="Book">Book Recommendation</option>
              </select>
            </div>

            {/* Title */}
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.25rem', fontWeight: '600' }}>
                Title
              </label>
              <input
                name="title"
                value={formData.title}
                onChange={handleChange}
                placeholder={formData.type === 'Book' 
                  ? "Book title" 
                  : formData.type === 'Video'
                    ? "Video title"
                    : "A meaningful title"}
                style={{
                  width: '100%',
                  padding: '0.5rem',
                  border: '1px solid #d1d5db',
                  borderRadius: '0.375rem',
                }}
              />
            </div>

            {/* Excerpt */}
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.25rem', fontWeight: '600' }}>
                {formData.type === 'Book'
                  ? 'Why this book helped you'
                  : formData.type === 'Video'
                    ? 'Video description and why it helped'
                    : 'Your reflection or summary'}
              </label>
              <textarea
                name="excerpt"
                value={formData.excerpt}
                onChange={handleChange}
                rows={3}
                placeholder={formData.type === 'Book'
                  ? "e.g., 'This book made me feel seen in my anger...'"
                  : formData.type === 'Video'
                    ? "e.g., 'This short film captures the feeling of grief beautifully...'"
                    : "Share what this resource offers or your experience"}
                style={{
                  width: '100%',
                  padding: '0.5rem',
                  border: '1px solid #d1d5db',
                  borderRadius: '0.375rem',
                  resize: 'vertical',
                }}
              />
            </div>

            {/* Video Options */}
            {formData.type === 'Video' && (
              <div style={{ marginBottom: '1rem', border: '1px solid #e5e7eb', borderRadius: '0.5rem', padding: '1rem' }}>
                <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
                  <button
                    type="button"
                    onClick={() => handleVideoTypeChange('link')}
                    style={{
                      flex: 1,
                      padding: '0.5rem',
                      border: formData.videoType === 'link' ? '2px solid #f59e0b' : '1px solid #d1d5db',
                      borderRadius: '0.375rem',
                      backgroundColor: formData.videoType === 'link' ? '#fef3c7' : 'white',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '0.25rem',
                    }}
                  >
                    <LinkIcon size={18} />
                    <span style={{ fontSize: '0.875rem' }}>Link</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleVideoTypeChange('upload')}
                    style={{
                      flex: 1,
                      padding: '0.5rem',
                      border: formData.videoType === 'upload' ? '2px solid #f59e0b' : '1px solid #d1d5db',
                      borderRadius: '0.375rem',
                      backgroundColor: formData.videoType === 'upload' ? '#fef3c7' : 'white',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '0.25rem',
                    }}
                  >
                    <Upload size={18} />
                    <span style={{ fontSize: '0.875rem' }}>Upload</span>
                  </button>
                </div>

                {formData.videoType === 'link' ? (
  <div>
    <label style={{ display: 'block', marginBottom: '0.25rem', fontWeight: '600' }}>
      Video Link
    </label>
    <input
      name="externalUrl"
      value={formData.externalUrl}
      onChange={handleChange}
      placeholder="https://youtube.com/watch?v=..."
      type="url"
      style={{
        width: '100%',
        padding: '0.5rem',
        border: '1px solid #d1d5db',
        borderRadius: '0.375rem',
      }}
      required
    />
    <p style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '0.25rem' }}>
      Supported platforms: YouTube, Vimeo, Loom, Google Drive, Dropbox
    </p>
  </div>
)  : (
                  <div>
                    <label style={{ display: 'block', marginBottom: '0.25rem', fontWeight: '600' }}>
                      Upload Video (max 100MB)
                    </label>
                    <div 
                      style={{ 
                        border: '2px dashed #d1d5db', 
                        borderRadius: '0.375rem',
                        padding: '1.5rem',
                        textAlign: 'center',
                        cursor: 'pointer',
                        backgroundColor: formData.videoPreview ? '#f9fafb' : 'white',
                        position: 'relative',
                        overflow: 'hidden'
                      }}
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <input
                        type="file"
                        ref={fileInputRef}
                        accept="video/mp4,video/webm,video/quicktime"
                        style={{ display: 'none' }}
                        onChange={handleVideoFileChange}
                      />
                      
                      {formData.videoPreview ? (
                        <div>
                          <video 
                            src={formData.videoPreview} 
                            controls
                            style={{ 
                              maxWidth: '100%',
                              maxHeight: '150px',
                              borderRadius: '0.25rem',
                              marginBottom: '0.5rem'
                            }} 
                          />
                          <p style={{ fontSize: '0.875rem', fontWeight: '500' }}>
                            {formData.videoFile?.name}
                          </p>
                          <p style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                            Click to change video
                          </p>
                        </div>
                      ) : (
                        <div>
                          <Upload size={32} style={{ color: '#9ca3af', margin: '0 auto 0.5rem' }} />
                          <p style={{ fontSize: '0.875rem', fontWeight: '500', color: '#4b5563' }}>
                            Click to upload video
                          </p>
                          <p style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                            MP4, WebM, or MOV (max 100MB)
                          </p>
                        </div>
                      )}
                    </div>
                    
                    {isUploading && (
                      <div style={{ marginTop: '0.5rem' }}>
                        <div style={{ 
                          height: '0.5rem', 
                          backgroundColor: '#e5e7eb', 
                          borderRadius: '9999px',
                          overflow: 'hidden'
                        }}>
                          <div 
                            style={{ 
                              height: '100%', 
                              backgroundColor: '#f59e0b',
                              width: `${uploadProgress}%`,
                              transition: 'width 0.3s'
                            }} 
                          />
                        </div>
                        <p style={{ 
                          textAlign: 'center', 
                          fontSize: '0.75rem', 
                          color: '#6b7280',
                          marginTop: '0.25rem'
                        }}>
                          Uploading: {uploadProgress}%
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Book fields */}
            {formData.type === 'Book' && (
              <>
                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'block', marginBottom: '0.25rem', fontWeight: '600' }}>
                    Author
                  </label>
                  <input
                    name="bookAuthor"
                    value={formData.bookAuthor}
                    onChange={handleChange}
                    placeholder="e.g., Megan Devine"
                    style={{
                      width: '100%',
                      padding: '0.5rem',
                      border: '1px solid #d1d5db',
                      borderRadius: '0.375rem',
                    }}
                  />
                </div>

                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'block', marginBottom: '0.25rem', fontWeight: '600' }}>
                    Short Quote (max 150 chars)
                  </label>
                  <input
                    name="bookQuote"
                    value={formData.bookQuote}
                    onChange={handleChange}
                    placeholder="e.g., 'Grief is love with nowhere to go.'"
                    style={{
                      width: '100%',
                      padding: '0.5rem',
                      border: '1px solid #d1d5db',
                      borderRadius: '0.375rem',
                    }}
                  />
                </div>

                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'block', marginBottom: '0.25rem', fontWeight: '600' }}>
                    Link to Book
                  </label>
                  <input
                    name="externalUrl"
                    value={formData.externalUrl}
                    onChange={handleChange}
                    placeholder="https://bookshop.org/...     "
                    type="url"
                    style={{
                      width: '100%',
                      padding: '0.5rem',
                      border: '1px solid #d1d5db',
                      borderRadius: '0.375rem',
                    }}
                  />
                </div>

                <div style={{ marginBottom: '1rem' }}>
  <label style={{ display: 'block', marginBottom: '0.25rem', fontWeight: '600' }}>
    Book Cover (optional)
  </label>
  <div
    style={{
      border: '2px dashed #d1d5db',
      borderRadius: '0.375rem',
      padding: '1rem',
      textAlign: 'center',
      cursor: 'pointer',
      backgroundColor: '#f9fafb',
    }}
    onClick={() => document.getElementById('bookCoverInput')?.click()}
  >
    <input
      id="bookCoverInput"
      type="file"
      accept="image/jpeg,image/png,image/webp"
      style={{ display: 'none' }}
      onChange={handleBookCoverChange}
    />
    {formData.bookCoverPreview ? (
  <Image
    src={formData.bookCoverPreview}
    alt="Book cover preview"
    height={150} // Max height you want
    width={100}  // You may need to adjust based on aspect ratio or use layout='responsive'
    style={{
      maxHeight: '150px',
      maxWidth: '100%',
      borderRadius: '0.25rem',
      objectFit: 'contain',
    }}
    unoptimized // Optional: if you're using dynamic/local/blob URLs that can't be optimized
  />
    ) : (
      <div>
        <Upload size={24} style={{ color: '#9ca3af', margin: '0 auto 0.5rem' }} />
        <p style={{ fontSize: '0.875rem', color: '#4b5563' }}>
          Click to upload cover (JPG/PNG, max 5MB)
        </p>
      </div>
    )}
  </div>
</div>
              </>
            )}

            {/* External URL for non-video, non-book resources */}
            {formData.type !== 'Book' && formData.type !== 'Video' && (
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.25rem', fontWeight: '600' }}>
                  Resource Link (optional)
                </label>
                <input
                  name="externalUrl"
                  value={formData.externalUrl}
                  onChange={handleChange}
                  placeholder="e.g., article URL, tool website, PDF document"
                  type="url"
                  style={{
                    width: '100%',
                    padding: '0.5rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '0.375rem',
                  }}
                />
              </div>
            )}

            {/* Community Source */}
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.25rem', fontWeight: '600' }}>
                Shared in community (optional)
              </label>
              <input
                name="communitySource"
                value={formData.communitySource}
                onChange={handleChange}
                placeholder="e.g., Loss of a Parent"
                style={{
                  width: '100%',
                  padding: '0.5rem',
                  border: '1px solid #d1d5db',
                  borderRadius: '0.375rem',
                }}
              />
            </div>

            {/* Tags */}
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.25rem', fontWeight: '600' }}>
                Tags (up to 5)
              </label>
              <div style={{ display: 'flex', gap: '0.25rem', marginBottom: '0.25rem' }}>
                <input
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleTagAdd())}
                  placeholder="Add a tag"
                  style={{
                    flex: 1,
                    padding: '0.25rem 0.5rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '9999px',
                    fontSize: '0.875rem',
                  }}
                />
                <button
                  type="button"
                  onClick={handleTagAdd}
                  style={{
                    padding: '0.25rem 0.75rem',
                    backgroundColor: '#e5e5e4',
                    border: 'none',
                    borderRadius: '9999px',
                    fontWeight: '500',
                  }}
                >
                  Add
                </button>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem', marginTop: '0.25rem' }}>
                {formData.tags.map(tag => (
                  <span
                    key={tag}
                    style={{
                      padding: '0.125rem 0.5rem',
                      backgroundColor: '#fef3c7',
                      color: '#92400e',
                      borderRadius: '9999px',
                      fontSize: '0.75rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.25rem',
                    }}
                  >
                    {tag}
                    <button
                      type="button"
                      onClick={() => handleTagRemove(tag)}
                      style={{ background: 'none', border: 'none', color: '#92400e', fontSize: '1rem' }}
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
              <div style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '0.25rem' }}>
                Suggestions: {TAG_SUGGESTIONS.slice(0, 8).join(', ')}
              </div>
            </div>

            {/* Content Warnings */}
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', marginBottom: '0.25rem', fontWeight: '600' }}>
                Content Warnings (optional)
              </label>
              <div style={{ display: 'flex', gap: '0.25rem', marginBottom: '0.25rem' }}>
                <input
                  value={newWarning}
                  onChange={(e) => setNewWarning(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleWarningAdd())}
                  placeholder="e.g., suicide, child loss"
                  style={{
                    flex: 1,
                    padding: '0.25rem 0.5rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '9999px',
                    fontSize: '0.875rem',
                  }}
                />
                <button
                  type="button"
                  onClick={handleWarningAdd}
                  style={{
                    padding: '0.25rem 0.75rem',
                    backgroundColor: '#e5e5e4',
                    border: 'none',
                    borderRadius: '9999px',
                    fontWeight: '500',
                  }}
                >
                  Add
                </button>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem', marginTop: '0.25rem' }}>
                {formData.contentWarnings.map(warning => (
                  <span
                    key={warning}
                    style={{
                      padding: '0.125rem 0.5rem',
                      backgroundColor: '#f3e8ff',
                      color: '#7e22ce',
                      borderRadius: '9999px',
                      fontSize: '0.75rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.25rem',
                    }}
                  >
                    {warning}
                    <button
                      type="button"
                      onClick={() => handleWarningRemove(warning)}
                      style={{ background: 'none', border: 'none', color: '#7e22ce', fontSize: '1rem' }}
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting || isUploading}
              style={{
                width: '100%',
                padding: '0.75rem',
                backgroundColor: isSubmitting || isUploading ? '#d1d5db' : '#f59e0b',
                color: 'white',
                border: 'none',
                borderRadius: '0.5rem',
                fontWeight: '600',
                cursor: isSubmitting || isUploading ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem'
              }}
            >
              {isUploading ? (
                <>
                  <span>Uploading video...</span>
                  <div style={{ 
                    width: '1rem', 
                    height: '1rem', 
                    border: '2px solid white', 
                    borderTopColor: 'transparent', 
                    borderRadius: '50%',
                    animation: 'spin 1s linear infinite'
                  }} />
                </>
              ) : isSubmitting ? (
                'Submitting...'
              ) : (
                'Submit for Review'
              )}
            </button>
          </form>
        )}

        <div style={{ marginTop: '1.5rem', textAlign: 'center', fontSize: '0.875rem', color: '#6b7280' }}>
          <p>All submissions are reviewed before appearing publicly.</p>
          <p style={{ marginTop: '0.25rem' }}>
            Video uploads are stored securely and only accessible after approval
          </p>
        </div>
      </div>

      <style jsx global>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}