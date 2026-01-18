'use client';

import { useEffect, useState, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import Picker, { Theme } from 'emoji-picker-react';
import { useRouter } from 'next/navigation';

interface EmojiData {
  emoji: string;
}

type Props = {
  isOpen: boolean;
  targetUserId: string;
  targetName: string;
  onClose: () => void;
};

export default function SendMessageOverlay({ 
  isOpen, 
  targetUserId, 
  targetName, 
  onClose 
}: Props) {
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [showEmoji, setShowEmoji] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const supabase = createClient();
  const inputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const emojiPickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    
    const initConversation = async () => {
      try {
        const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
        if (sessionError || !sessionData.session) {
          console.error('Session error:', sessionError);
          onClose();
          return;
        }
        
        const currentUserId = sessionData.session.user.id;
        
        const { data: existingConvsData, error: fetchError } = await supabase
          .from('conversations')
          .select('id')
          .or(
            `and(user1_id.eq.${currentUserId},user2_id.eq.${targetUserId}),` +
            `and(user1_id.eq.${targetUserId},user2_id.eq.${currentUserId})`
          );
        
        if (fetchError) throw fetchError;
        
        if (existingConvsData && existingConvsData.length > 0) {
          setConversationId(existingConvsData[0].id);
        } else {
          const user1 = currentUserId < targetUserId ? currentUserId : targetUserId;
          const user2 = currentUserId > targetUserId ? currentUserId : targetUserId;
          
          const { data: newConvData, error: insertError } = await supabase
            .from('conversations')
            .insert({ 
              user1_id: user1, 
              user2_id: user2 
            })
            .select('id')
            .single();
            
          if (insertError) throw insertError;
          if (!newConvData) throw new Error('Failed to create conversation');
          
          setConversationId(newConvData.id);
        }
      } catch (err) {
        console.error('Failed to initialize conversation:', err);
        onClose();
      } finally {
        setLoading(false);
      }
    };
    
    initConversation();
  }, [isOpen, targetUserId, targetName, onClose, supabase]);

  const handleSend = async () => {
    if ((!message.trim() && !filePreview) || !conversationId) return;

    setIsSending(true);
    try {
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !sessionData.session) {
        console.error('Session error:', sessionError);
        onClose();
        return;
      }

      let fileUrl = null;
      if (filePreview && fileInputRef.current?.files?.[0]) {
        const file = fileInputRef.current.files[0];
        const fileName = `${Date.now()}_${file.name}`;
        
        const { error: uploadError } = await supabase
          .storage
          .from('message-files')
          .upload(fileName, file, {
            cacheControl: '3600',
            upsert: false
          });

        if (uploadError) throw uploadError;
        
        const { data: publicUrlData } = supabase
          .storage
          .from('message-files')
          .getPublicUrl(fileName);
          
        fileUrl = publicUrlData?.publicUrl;
      }

      const { error: messageError } = await supabase
        .from('messages')
        .insert({
          conversation_id: conversationId,
          sender_id: sessionData.session.user.id,
          content: message.trim(),
          file_url: fileUrl || null,
          file_type: fileUrl ? fileInputRef.current?.files?.[0]?.type : null
        });

      if (messageError) throw messageError;

      router.push(`/messages/`);
      onClose();
      setMessage('');
      setFilePreview(null);
    } catch (err) {
      console.error('Failed to send message:', err);
      alert('Failed to send message. Please try again.');
    } finally {
      setIsSending(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleEmojiSelect = (emojiData: EmojiData) => {
    setMessage(prev => prev + emojiData.emoji);
    setShowEmoji(false);
    inputRef.current?.focus();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onloadend = () => {
          setFilePreview(reader.result as string);
        };
        reader.readAsDataURL(file);
      } else {
        setFilePreview(file.name);
      }
    } else {
      setFilePreview(null);
    }
  };

  const removeFile = () => {
    setFilePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSend();
  };

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(e.target as Node)) {
        setShowEmoji(false);
      }
    };
    
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      // Delay ensures modal is fully rendered before focusing
      const timer = setTimeout(() => inputRef.current?.focus(), 150);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.6)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 2000,
      padding: '16px',
      boxSizing: 'border-box'
    }}>
      <div style={{
        backgroundColor: 'white',
        borderRadius: '16px',
        width: '100%',
        maxWidth: '500px',
        maxHeight: '85vh',
        overflow: 'hidden',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
        display: 'flex',
        flexDirection: 'column',
        boxSizing: 'border-box'
      }}>
        {/* Header */}
        <div style={{
          padding: '16px',
          borderBottom: '1px solid #f1f5f9',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div>
            <h2 style={{ 
              fontSize: '16px', 
              fontWeight: '600', 
              color: '#1e293b',
              margin: 0
            }}>
              Message {targetName}
            </h2>
            <p style={{ 
              fontSize: '13px', 
              color: '#64748b', 
              margin: '4px 0 0'
            }}>
              Send a private message
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              width: '32px',
              height: '32px',
              borderRadius: '16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#64748b',
              cursor: 'pointer',
              transition: 'background-color 0.2s'
            }}
            aria-label="Close modal"
          >
            <span style={{ fontSize: '20px' }}>×</span>
          </button>
        </div>
        
        {/* Content */}
        <div style={{ 
          padding: '16px', 
          flex: 1,
          minHeight: '150px',
          display: 'flex',
          flexDirection: 'column',
          overflowY: 'auto',
          boxSizing: 'border-box'
        }}>
          {loading ? (
            <div style={{ 
              display: 'flex', 
              flexDirection: 'column', 
              alignItems: 'center', 
              justifyContent: 'center', 
              height: '120px' 
            }}>
              <div style={{
                width: '28px',
                height: '28px',
                borderRadius: '50%',
                border: '3px solid #cbd5e1',
                borderTopColor: '#4f46e5',
                animation: 'spin 1s linear infinite',
                margin: '0 auto 10px'
              }}></div>
              <p style={{ color: '#64748b', fontSize: '13px' }}>Setting up conversation...</p>
              <style>{`
                @keyframes spin {
                  to { transform: rotate(360deg); }
                }
              `}</style>
            </div>
          ) : !conversationId ? (
            <div style={{ textAlign: 'center', padding: '16px' }}>
              <p style={{ color: '#ef4444', marginBottom: '12px', fontSize: '14px' }}>
                Failed to start conversation.
              </p>
              <button
                onClick={onClose}
                style={{
                  marginTop: '12px',
                  padding: '8px 16px',
                  backgroundColor: '#4f46e5',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: 500
                }}
              >
                Close
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {filePreview && (
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '10px',
                  backgroundColor: '#eff6ff',
                  borderRadius: '10px',
                  border: '1px solid #bfdbfe',
                  fontSize: '13px',
                  color: '#1e40af',
                  fontWeight: 500
                }}>
                  <div style={{ flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {filePreview}
                  </div>
                  <button
                    type="button"
                    onClick={removeFile}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#1e40af',
                      cursor: 'pointer',
                      fontSize: '16px',
                      lineHeight: 1,
                      width: '20px',
                      height: '20px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                    aria-label="Remove file"
                  >
                    ×
                  </button>
                </div>
              )}
              
              <div style={{ position: 'relative' }}>
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '8px',
                  flexWrap: 'wrap'
                }}>
                  <div style={{ position: 'relative' }}>
                    <input
                      ref={fileInputRef}
                      type="file"
                      style={{
                        position: 'absolute',
                        inset: 0,
                        width: '100%',
                        height: '100%',
                        opacity: 0,
                        cursor: 'pointer'
                      }}
                      onChange={handleFileChange}
                      accept="image/*,application/pdf"
                    />
                    <button
                      type="button"
                      style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '10px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#64748b',
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer'
                      }}
                      aria-label="Attach file"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M18.375 12.739l-7.693 7.693a4.5 4.5 0 0 1-6.364-6.364l10.94-10.94A3 3 0 1 1 19.5 7.372L8.552 18.32m.009-.01l-.01.01m5.699-9.941l-7.81 7.81a1.5 1.5 0 0 0 2.112 2.13" />
                      </svg>
                    </button>
                  </div>
                  
                  <button
                    type="button"
                    onClick={() => setShowEmoji(!showEmoji)}
                    style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '10px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#64748b',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer'
                    }}
                    aria-label="Open emoji picker"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2">
                      <circle cx="12" cy="12" r="10" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8 14s1.5 2 4 2 4-2 4-2" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 9h.01" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 9h.01" />
                    </svg>
                  </button>
                  
                  <input
                    ref={inputRef}
                    type="text"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Type your message... Be kind."
                    disabled={isSending}
                    style={{
                      flex: 1,
                      minWidth: '120px',
                      padding: '10px 12px',
                      borderRadius: '12px',
                      border: '1px solid #e2e8f0',
                      backgroundColor: '#f8fafc',
                      fontSize: '14px',
                      color: '#1e293b',
                      outline: 'none',
                      minHeight: '32px'
                    }}
                  />
                  
                  <button
                    type="submit"
                    disabled={(!message.trim() && !filePreview) || isSending}
                    style={{
                      padding: '10px 16px',
                      borderRadius: '12px',
                      border: 'none',
                      color: 'white',
                      fontWeight: 600,
                      fontSize: '14px',
                      cursor: (!message.trim() && !filePreview) || isSending ? 'not-allowed' : 'pointer',
                      backgroundColor: (!message.trim() && !filePreview) || isSending ? '#cbd5e1' : '#4f46e5',
                      whiteSpace: 'nowrap',
                      minHeight: '32px'
                    }}
                  >
                    {isSending ? 'Sending...' : 'Send'}
                  </button>
                </div>
                
                {showEmoji && (
                  <div 
                    ref={emojiPickerRef}
                    style={{
                      position: 'absolute',
                      bottom: 'calc(100% + 8px)',
                      left: 0,
                      right: 0,
                      zIndex: 100,
                      boxShadow: '0 10px 25px rgba(0,0,0,0.15)',
                      borderRadius: '12px',
                      overflow: 'hidden',
                      backgroundColor: 'white',
                      border: '1px solid #e2e8f0',
                      maxHeight: '300px',
                      maxWidth: '320px',
                      width: '100%',
                      transform: 'translateX(-8px)'
                    }}
                  >
                    <Picker
                      onEmojiClick={handleEmojiSelect}
                      theme={Theme.LIGHT}
                      skinTonesDisabled
                      searchDisabled
                      previewConfig={{ showPreview: false }}
                      style={{ width: '100%', height: '100%' }}
                    />
                  </div>
                )}
              </div>
              
              <div style={{ 
                fontSize: '12px', 
                color: '#64748b', 
                textAlign: 'center',
                padding: '0 8px'
              }}>
                Messages are end-to-end encrypted and only visible to you and {targetName}.
              </div>
            </form>
          )}
        </div>
        
        <div style={{
          padding: '12px 16px',
          borderTop: '1px solid #f1f5f9',
          backgroundColor: '#f8fafc',
          fontSize: '12px',
          color: '#64748b',
          textAlign: 'center'
        }}>
          By sending a message, you agree to our Community Guidelines and Privacy Policy.
        </div>
      </div>
    </div>
  );
}