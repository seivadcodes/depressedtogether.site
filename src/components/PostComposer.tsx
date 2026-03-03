// src/components/PostComposer.tsx
'use client';

import { useState, useRef, useEffect, useMemo } from 'react';
import { Camera, X, Send, Smile, Palette } from 'lucide-react';
import Image from 'next/image';
import { useAuth } from '@/hooks/useAuth';
import { createClient } from '@/lib/supabase/client';
import Picker, { Theme } from 'emoji-picker-react';

interface PostComposerProps {
  onSubmit: (text: string, mediaFiles: File[], isAnonymous: boolean, bgStyle?: string) => Promise<void>;
  isSubmitting?: boolean;
  placeholder?: string;
  maxFiles?: number;
  defaultIsAnonymous?: boolean;
}

const BG_OPTIONS = [
  { id: 'none', label: 'Default', value: '' },
  { id: 'calm-blue', label: 'Calm', value: 'linear-gradient(135deg, #dbeafe, #bfdbfe)' },
  { id: 'warm-amber', label: 'Warm', value: 'linear-gradient(135deg, #fef3c7, #fde68a)' },
  { id: 'soft-purple', label: 'Peace', value: 'linear-gradient(135deg, #e9d5ff, #d8b4fe)' },
  { id: 'gentle-green', label: 'Hope', value: 'linear-gradient(135deg, #d1fae5, #a7f3d0)' },
  { id: 'rose-pink', label: 'Love', value: 'linear-gradient(135deg, #fce7f3, #fbcfe8)' },
  { id: 'slate-gray', label: 'Quiet', value: 'linear-gradient(135deg, #e2e8f0, #cbd5e1)' },
  { id: 'sunset', label: 'Sunset', value: 'linear-gradient(135deg, #fed7aa, #fdba74)' },
];

export function PostComposer({
  onSubmit,
  isSubmitting = false,
  placeholder = "What's on your mind?",
  maxFiles = 4,
  defaultIsAnonymous = false,
}: PostComposerProps) {
  const { user } = useAuth();
  const supabase = createClient();

  const [text, setText] = useState('');
  const [mediaFiles, setMediaFiles] = useState<File[]>([]);
  const [mediaPreviews, setMediaPreviews] = useState<string[]>([]);
  const [isExpanded, setIsExpanded] = useState(false);
  const [profile, setProfile] = useState<{ full_name?: string; avatar_url?: string } | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [isAnonymous, setIsAnonymous] = useState(defaultIsAnonymous);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showBgPicker, setShowBgPicker] = useState(false);
  const [selectedBg, setSelectedBg] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) {
        setProfile(null);
        setProfileLoading(false);
        return;
      }
      const { data, error } = await supabase
        .from('profiles')
        .select('full_name, avatar_url')
        .eq('id', user.id)
        .maybeSingle();
      if (error) {
        console.error('Failed to load profile in PostComposer:', error);
        setProfile(null);
      } else {
        const avatarUrl = data?.avatar_url
          ? `/api/media/avatars/${data.avatar_url}`
          : undefined;
        setProfile({ full_name: data?.full_name, avatar_url: avatarUrl });
      }
      setProfileLoading(false);
    };
    fetchProfile();
  }, [user, supabase]);

  useEffect(() => {
    return () => {
      mediaPreviews.forEach(url => URL.revokeObjectURL(url));
    };
  }, [mediaPreviews]);

  const displayName = useMemo(() => {
    if (!user) return 'You';
    return profile?.full_name || user.email?.split('@')[0] || 'You';
  }, [user, profile]);

  const avatarUrl = profile?.avatar_url;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const validFiles = Array.from(files).slice(0, maxFiles - mediaFiles.length);
    setMediaFiles(prev => [...prev, ...validFiles]);
    const newPreviews = validFiles.map(file => URL.createObjectURL(file));
    setMediaPreviews(prev => [...prev, ...newPreviews]);
    setIsExpanded(true);
  };

  const removeMedia = (index: number) => {
    setMediaFiles(prev => prev.filter((_, i) => i !== index));
    setMediaPreviews(prev => {
      URL.revokeObjectURL(prev[index]);
      return prev.filter((_, i) => i !== index);
    });
  };

  const insertEmoji = (emojiData: { emoji: string }) => {
    const cursorPosition = textareaRef.current?.selectionStart || 0;
    const textBefore = text.slice(0, cursorPosition);
    const textAfter = text.slice(cursorPosition);
    setText(textBefore + emojiData.emoji + textAfter);
    setShowEmojiPicker(false);
    setTimeout(() => textareaRef.current?.focus(), 0);
  };

  const handleSubmit = async () => {
    if (!text.trim() && mediaFiles.length === 0) return;
    await onSubmit(text.trim(), mediaFiles, isAnonymous, selectedBg);
    setText('');
    setMediaFiles([]);
    setMediaPreviews([]);
    setIsExpanded(false);
    setIsAnonymous(defaultIsAnonymous);
    setShowEmojiPicker(false);
    setShowBgPicker(false);
    setSelectedBg('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const hasContent = text.trim().length > 0 || mediaFiles.length > 0;

  if (profileLoading && user) {
    return (
      <div style={{
        backgroundColor: '#fff',
        borderRadius: '1rem',
        border: '1px solid #e7e5e4',
        padding: '1rem',
        boxShadow: '0 1px 2px 0 rgba(0,0,0,0.05)',
      }}>
        Loading profile...
      </div>
    );
  }

  // 🟢 COMPACT STATE
  if (!isExpanded) {
    return (
      <div
        onClick={() => setIsExpanded(true)}
        style={{
          backgroundColor: '#fff',
          borderRadius: '1rem',
          border: '1px solid #e7e5e4',
          padding: '0.75rem 1rem',
          boxShadow: '0 1px 2px 0 rgba(0,0,0,0.05)',
          cursor: 'text',
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
        }}
      >
        <div style={{
          width: '2rem',
          height: '2rem',
          borderRadius: '9999px',
          backgroundColor: avatarUrl && !isAnonymous ? 'transparent' : '#fef3c7',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          overflow: 'hidden',
          border: (avatarUrl && !isAnonymous) ? 'none' : '1px solid #fde68a',
        }}>
          {avatarUrl && !isAnonymous ? (
            <Image src={avatarUrl} alt={displayName} width={32} height={32} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            <span style={{ color: '#92400e', fontWeight: 500, fontSize: '0.875rem' }}>
              {!isAnonymous ? displayName.charAt(0).toUpperCase() : '?'}
            </span>
          )}
        </div>
        <div style={{ color: '#a8a29e', fontSize: '0.875rem', flex: 1, display: 'flex', alignItems: 'center' }}>
          {placeholder}
        </div>
        <Send size={16} color="#a8a29e" style={{ flexShrink: 0 }} />
      </div>
    );
  }

  // 🔵 EXPANDED STATE
  return (
    <div style={{
      backgroundColor: '#fff',
      borderRadius: '1rem',
      border: '1px solid #e7e5e4',
      padding: '1rem',
      boxShadow: '0 1px 2px 0 rgba(0,0,0,0.05)',
    }}>
      <div style={{ display: 'flex', gap: '0.75rem' }}>
        {/* Avatar */}
        <div style={{
          width: '2.5rem',
          height: '2.5rem',
          borderRadius: '9999px',
          backgroundColor: avatarUrl && !isAnonymous ? 'transparent' : '#fef3c7',
          border: (avatarUrl && !isAnonymous) ? 'none' : '1px solid #fde68a',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          overflow: 'hidden',
        }}>
          {avatarUrl && !isAnonymous ? (
            <Image src={avatarUrl} alt={displayName} width={40} height={40} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            <span style={{ color: '#92400e', fontWeight: 500, fontSize: '0.875rem' }}>
              {!isAnonymous ? displayName.charAt(0).toUpperCase() : '?'}
            </span>
          )}
        </div>

        <div style={{ flex: 1 }}>
          <div style={{ position: 'relative' }}>
            <textarea
              ref={textareaRef}
              value={text}
              onChange={(e) => {
                setText(e.target.value);
                setShowEmojiPicker(false);
                e.target.style.height = 'auto';
                e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`;
              }}
              placeholder={placeholder}
              autoFocus
              style={{
                width: '100%',
                padding: '0.5rem 5rem 0.5rem 0.5rem',
                color: '#1c1917',
                backgroundColor: selectedBg ? 'rgba(255,255,255,0.5)' : 'transparent',
                border: '1px solid #e7e5e4',
                borderRadius: '0.5rem',
                resize: 'vertical',
                fontFamily: 'inherit',
                fontSize: '1rem',
                minHeight: '4rem',
                outline: 'none',
              }}
              disabled={isSubmitting}
              rows={3}
            />
            
            {/* Background Button */}
            <button
              type="button"
              onClick={() => {
                setShowBgPicker(!showBgPicker);
                setShowEmojiPicker(false);
              }}
              style={{
                position: 'absolute',
                right: '5rem',
                bottom: '0.5rem',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: selectedBg ? '#f59e0b' : '#78716c',
                padding: '4px',
                borderRadius: '4px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
              aria-label="Select background"
            >
              <Palette size={18} />
            </button>

            {/* Emoji Button */}
            <button
              type="button"
              onClick={() => {
                setShowEmojiPicker(!showEmojiPicker);
                setShowBgPicker(false);
              }}
              style={{
                position: 'absolute',
                right: '2.5rem',
                bottom: '0.5rem',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: '#78716c',
                padding: '4px',
                borderRadius: '4px',
              }}
              aria-label="Open emoji picker"
            >
              <Smile size={18} />
            </button>

            {/* Send Button */}
            <button
              onClick={handleSubmit}
              disabled={!hasContent || isSubmitting}
              style={{
                position: 'absolute',
                right: '0.5rem',
                bottom: '0.5rem',
                width: '2rem',
                height: '2rem',
                borderRadius: '0.5rem',
                backgroundColor: hasContent && !isSubmitting ? '#f59e0b' : '#d6d3d1',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: 'none',
                cursor: !hasContent || isSubmitting ? 'not-allowed' : 'pointer',
              }}
            >
              {isSubmitting ? (
                <div style={{
                  width: '1rem',
                  height: '1rem',
                  borderRadius: '50%',
                  border: '2px solid white',
                  borderTopColor: 'transparent',
                  animation: 'spin 1s linear infinite',
                }}></div>
              ) : (
                <Send size={16} color={hasContent ? '#fff' : '#a8a29e'} />
              )}
            </button>
          </div>

          {/* Emoji Picker */}
          {showEmojiPicker && (
            <div style={{ marginTop: '0.5rem', marginBottom: '0.5rem' }}>
              <Picker
                onEmojiClick={insertEmoji}
                theme={Theme.LIGHT}
                skinTonesDisabled
                searchDisabled
                previewConfig={{ showPreview: false }}
                style={{ width: '100%', maxWidth: '350px' }}
              />
            </div>
          )}

          {/* Background Picker */}
          {showBgPicker && (
            <div style={{
              marginTop: '0.5rem',
              marginBottom: '0.5rem',
              display: 'grid',
              gridTemplateColumns: 'repeat(4, 1fr)',
              gap: '0.5rem',
            }}>
              {BG_OPTIONS.map((bg) => (
                <button
                  key={bg.id}
                  onClick={() => {
                    setSelectedBg(bg.value);
                    setShowBgPicker(false);
                  }}
                  style={{
                    height: '2.5rem',
                    borderRadius: '0.5rem',
                    background: bg.value || '#f5f5f4',
                    border: selectedBg === bg.value ? '2px solid #f59e0b' : '1px solid #e7e5e4',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '0.75rem',
                    color: bg.id === 'none' ? '#6b7280' : 'white',
                    textShadow: bg.id !== 'none' ? '0 1px 2px rgba(0,0,0,0.3)' : 'none',
                    fontWeight: 500,
                  }}
                >
                  {bg.label}
                </button>
              ))}
            </div>
          )}

          {mediaPreviews.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '0.75rem' }}>
              {mediaPreviews.map((url, i) => (
                <div key={i} style={{
                  position: 'relative',
                  width: '5rem',
                  height: '5rem',
                  borderRadius: '0.5rem',
                  overflow: 'hidden',
                  border: '1px solid #e7e5e4',
                }}>
                  <Image src={url} alt={`Preview ${i + 1}`} fill style={{ objectFit: 'cover' }} unoptimized />
                  <button
                    onClick={() => removeMedia(i)}
                    style={{
                      position: 'absolute',
                      top: '-0.25rem',
                      right: '-0.25rem',
                      backgroundColor: '#ef4444',
                      color: '#fff',
                      width: '1.25rem',
                      height: '1.25rem',
                      borderRadius: '9999px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      border: 'none',
                      cursor: 'pointer',
                    }}
                  >
                    <X size={10} />
                  </button>
                </div>
              ))}
            </div>
          )}

          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '0.75rem',
            marginTop: '1rem',
            paddingTop: '0.75rem',
            borderTop: '1px solid #f5f5f4',
          }}>
            {user && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', color: '#4b5563' }}>
                <input
                  type="checkbox"
                  id="post-anon"
                  checked={isAnonymous}
                  onChange={(e) => setIsAnonymous(e.target.checked)}
                  style={{ cursor: 'pointer' }}
                />
                <label htmlFor="post-anon" style={{ cursor: 'pointer' }}>Post anonymously</label>
              </div>
            )}

            <button
              onClick={() => fileInputRef.current?.click()}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                color: '#78716c',
                fontSize: '0.875rem',
                fontWeight: 500,
                padding: '0.375rem 0.75rem',
                borderRadius: '0.5rem',
                background: 'none',
                border: 'none',
                cursor: isSubmitting || mediaFiles.length >= maxFiles ? 'not-allowed' : 'pointer',
              }}
              disabled={isSubmitting || mediaFiles.length >= maxFiles}
            >
              <Camera size={16} />
              {mediaFiles.length > 0 ? `Add more (${maxFiles - mediaFiles.length} left)` : 'Add photo/video'}
            </button>

            <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*,video/*" multiple style={{ display: 'none' }} />

            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button
                type="button"
                onClick={() => {
                  setIsExpanded(false);
                  setText('');
                  setMediaFiles([]);
                  setMediaPreviews([]);
                  setIsAnonymous(defaultIsAnonymous);
                  setShowEmojiPicker(false);
                  setShowBgPicker(false);
                  setSelectedBg('');
                  if (fileInputRef.current) fileInputRef.current.value = '';
                }}
                style={{
                  flex: 1,
                  padding: '0.625rem',
                  borderRadius: '0.75rem',
                  fontWeight: 500,
                  fontSize: '0.875rem',
                  backgroundColor: '#f5f5f4',
                  color: '#404040',
                  border: 'none',
                  cursor: 'pointer',
                }}
              >
                Cancel
              </button>

              <button
                onClick={handleSubmit}
                disabled={!hasContent || isSubmitting}
                style={{
                  flex: 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  padding: '0.625rem',
                  borderRadius: '0.75rem',
                  fontWeight: 500,
                  fontSize: '0.875rem',
                  backgroundColor: hasContent && !isSubmitting ? '#f59e0b' : '#d6d3d1',
                  color: hasContent && !isSubmitting ? '#fff' : '#a8a29e',
                  cursor: !hasContent || isSubmitting ? 'not-allowed' : 'pointer',
                }}
              >
                {isSubmitting ? (
                  <><div style={{ width: '1rem', height: '1rem', borderRadius: '50%', border: '2px solid white', borderTopColor: 'transparent', animation: 'spin 1s linear infinite' }}></div>Sharing...</>
                ) : (
                  <>Share<Send size={16} /></>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}