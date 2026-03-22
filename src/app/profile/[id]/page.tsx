'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase';
import { PostCard } from '@/components/PostCard';
import { useAuth } from '@/hooks/useAuth';
import { useCall } from '@/context/CallContext';
import SendMessageOverlay from '@/components/modals/SendMessageOverlay';
import { PostComposer } from '@/components/PostComposer';
import { MoreVertical, Trash2 } from 'lucide-react'; // ✅ Add these imports

interface Profile {
  id: string;
  full_name: string | null;
  country: string | null;
  avatar_url: string | null;
  about?: string | null;
  is_anonymous: boolean;
}

interface DisplayPost {
  id: string;
  userId: string;
  text: string;
  mediaUrl?: string;
  mediaUrls: string[];
  createdAt: Date;
  likes: number;
  isLiked: boolean;
  commentsCount: number;
  isAnonymous: boolean;
  user: {
    id: string;
    fullName: string | null;
    avatarUrl: string | null;
    isAnonymous: boolean;
  };
}

export default function PublicProfile() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const { startCall } = useCall();

  const [profile, setProfile] = useState<Profile | null>(null);
  const [posts, setPosts] = useState<DisplayPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [showMessageOverlay, setShowMessageOverlay] = useState(false);
  const [showMenu, setShowMenu] = useState(false); // ✅ Menu toggle state

  const checkScreenSize = useCallback(() => {
    if (typeof window !== 'undefined') {
      setIsMobile(window.innerWidth < 768);
    }
  }, []);

  useEffect(() => {
    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    return () => window.removeEventListener('resize', checkScreenSize);
  }, [checkScreenSize]);

  // ✅ Close menu when clicking outside
  useEffect(() => {
    if (!showMenu) return;
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('[data-profile-menu]')) {
        setShowMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showMenu]);

  useEffect(() => {
    if (!id) return;

    const supabase = createClient();

    const fetchProfileAndPosts = async () => {
      try {
        setLoading(true);
        setError(null);

        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('id, full_name, country, avatar_url, about, is_anonymous')
          .eq('id', id)
          .single();

        if (profileError || !profileData) {
          setError('Profile not found');
          return;
        }

        let avatarProxyUrl: string | null = null;
        if (!profileData.is_anonymous && profileData.avatar_url) {
          avatarProxyUrl = `/api/media/avatars/${profileData.avatar_url}`;
        }

        const profileWithAvatar = {
          ...profileData,
          avatar_url: avatarProxyUrl,
        };

        setProfile(profileWithAvatar);

        const { data: postData, error: postError } = await supabase
          .from('posts')
          .select('*')
          .eq('user_id', id)
          .order('created_at', { ascending: false });

        if (postError) {
          console.error('Post fetch error:', postError);
        }

        const mappedPosts = (postData || []).map((p) => {
          const mediaUrls = Array.isArray(p.media_urls)
            ? p.media_urls.map((path: string) => `/api/media/posts/${path}`)
            : [];

          const authorAvatar = !profileData.is_anonymous ? profileData.avatar_url : null;

          return {
            id: p.id,
            userId: p.user_id,
            text: p.text,
            mediaUrl: mediaUrls[0],
            mediaUrls,
            createdAt: new Date(p.created_at),
            likes: p.likes_count || 0,
            isLiked: false,
            commentsCount: p.comments_count || 0,
            isAnonymous: p.is_anonymous || profileData.is_anonymous,
            user: {
              id: p.user_id,
              fullName: profileData.is_anonymous ? null : profileData.full_name,
              avatarUrl: authorAvatar,
              isAnonymous: profileData.is_anonymous,
            },
          };
        });

        setPosts(mappedPosts);
      } catch (err) {
        console.error('Profile fetch failed:', err);
        setError('Failed to load profile');
      } finally {
        setLoading(false);
      }
    };

    fetchProfileAndPosts();
  }, [id]);

  const requireAuth = (returnPath?: string) => {
    if (!user) {
      const redirectUrl = returnPath || window.location.pathname;
      router.push(`/login?returnTo=${encodeURIComponent(redirectUrl)}`);
      return false;
    }
    return true;
  };

  const handleCall = async () => {
    if (!profile?.id || !profile.full_name) return;
    if (!requireAuth()) return;
    await startCall(
      profile.id,
      profile.full_name || 'Anonymous',
      'audio',
      profile.id,
      profile.id
    );
  };

  const handleMessage = () => {
    if (!profile?.id) return;
    if (!requireAuth()) return;
    setShowMessageOverlay(true);
  };

  const handlePostSubmit = async (text: string, mediaFiles: File[], isAnonymous: boolean) => {
    if (!user) return;
    
    try {
      const mediaPaths: string[] = [];
      
      if (mediaFiles.length > 0) {
        const supabase = createClient();
        for (const file of mediaFiles) {
          const fileName = `${user.id}/${Date.now()}-${file.name}`;
          const { error: uploadError } = await supabase.storage
            .from('posts')
            .upload(fileName, file);
            
          if (uploadError) throw uploadError;
          mediaPaths.push(fileName);
        }
      }

      const supabase = createClient();
      const { error: postError } = await supabase
        .from('posts')
        .insert({
          user_id: user.id,
          text: text || null,
          media_urls: mediaPaths,
          is_anonymous: isAnonymous,
          created_at: new Date().toISOString(),
        });

      if (postError) throw postError;

      const newPost: DisplayPost = {
        id: crypto.randomUUID(),
        userId: user.id,
        text: text || '',
        mediaUrl: mediaPaths.length > 0 ? `/api/media/posts/${mediaPaths[0]}` : undefined,
        mediaUrls: mediaPaths.map(path => `/api/media/posts/${path}`),
        createdAt: new Date(),
        likes: 0,
        isLiked: false,
        commentsCount: 0,
        isAnonymous: isAnonymous,
        user: {
          id: user.id,
          fullName: user.user_metadata.full_name || 'You',
          avatarUrl: profile?.avatar_url || null,
          isAnonymous: false,
        },
      };

      setPosts((prev) => [newPost, ...prev]);
    } catch (err) {
      console.error('Post creation failed:', err);
      alert('Failed to share. Please try again.');
    }
  };

  // ✅ Navigate to delete account page
  const handleDeleteAccount = () => {
    if (profile?.id) {
      router.push(`/profile/${profile.id}/delete`);
    }
  };

  const isOwner = user?.id === profile?.id;

  const colors = {
    primary: '#3b82f6',
    accent: '#10b981',
    surface: '#ffffff',
    border: '#e2e8f0',
    textPrimary: '#1e293b',
    textSecondary: '#64748b',
  };

  if (loading) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center', fontSize: '1rem', color: '#444' }}>
        Loading profile...
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center', fontSize: '1rem', color: '#d32f2f' }}>
        {error || 'Profile not found'}
      </div>
    );
  }

  const name = profile.full_name || 'Anonymous';
  const firstName = profile.full_name ? profile.full_name.split(' ')[0] : 'Them';
  const countryName = profile.country
    ? new Intl.DisplayNames(['en'], { type: 'region' }).of(profile.country) || profile.country
    : null;

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #f0f7ff 0%, #dbeafe 50%, #bfdbfe 100%)',
        padding: '1rem',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'flex-start',
        paddingTop: '2rem',
      }}
    >
      <div style={{ width: '100%', maxWidth: '1200px', fontFamily: 'system-ui' }}>
        {/* Profile Header */}
        <div
          style={{
            background: colors.surface,
            borderRadius: '12px',
            padding: '1.5rem',
            textAlign: 'center',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
            marginBottom: '2rem',
            border: `1px solid ${colors.border}`,
            position: 'relative',
          }}
        >
          {/* ✅ Kebab Menu - Only for owner */}
          {isOwner && (
            <div 
              style={{ position: 'absolute', top: '1rem', right: '1rem' }}
              data-profile-menu
            >
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowMenu(!showMenu);
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  padding: '0.5rem',
                  cursor: 'pointer',
                  borderRadius: '8px',
                  color: colors.textSecondary,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'background-color 0.2s',
                }}
                aria-label="Profile options"
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f1f5f9')}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
              >
                <MoreVertical size={20} />
              </button>

              {/* Dropdown Menu */}
              {showMenu && (
                <div
                  style={{
                    position: 'absolute',
                    top: '100%',
                    right: 0,
                    marginTop: '0.5rem',
                    backgroundColor: colors.surface,
                    border: `1px solid ${colors.border}`,
                    borderRadius: '8px',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                    zIndex: 10,
                    minWidth: '180px',
                    overflow: 'hidden',
                  }}
                  data-profile-menu
                >
                  <button
                    onClick={() => {
                      setShowMenu(false);
                      handleDeleteAccount();
                    }}
                    style={{
                      width: '100%',
                      padding: '0.75rem 1rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      fontSize: '0.875rem',
                      color: '#ef4444',
                      textAlign: 'left',
                      transition: 'background-color 0.2s',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#fef2f2')}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                  >
                    <Trash2 size={16} />
                    Delete Account
                  </button>
                </div>
              )}
            </div>
          )}

          <div
            style={{
              width: '72px',
              height: '72px',
              borderRadius: '50%',
              background: profile.avatar_url ? 'transparent' : '#f1f5f9',
              margin: '0 auto 1rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.5rem',
              color: '#475569',
              fontWeight: 'bold',
              overflow: 'hidden',
            }}
          >
            {profile.avatar_url ? (
              <img
                src={profile.avatar_url}
                alt={name}
                width={72}
                height={72}
                style={{ objectFit: 'cover', borderRadius: '50%' }}
                loading="lazy"
              />
            ) : (
              name.charAt(0).toUpperCase()
            )}
          </div>

          <h1 style={{ margin: '0 0 0.5rem', fontSize: '1.25rem', fontWeight: '600', color: colors.textPrimary }}>
            {name}
          </h1>

          {countryName && (
            <p style={{ margin: '0 0 0.75rem', fontSize: '0.95rem', color: colors.textSecondary }}>
              From {countryName}
            </p>
          )}

          {profile.about && (
            <div style={{ marginTop: '1rem', padding: '0.75rem 1rem', backgroundColor: '#f8fafc', borderRadius: '8px' }}>
              <p style={{ margin: 0, fontSize: '0.95rem', color: '#334155', lineHeight: 1.5 }}>
                {profile.about}
              </p>
            </div>
          )}

          {/* Call/Message buttons */}
          {!isOwner && (
            <div style={{ marginTop: '1.25rem', display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
              <button
                onClick={handleCall}
                style={{
                  backgroundColor: colors.primary,
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '0.6rem 1.25rem',
                  fontSize: '1rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  minWidth: '120px',
                }}
              >
                📞 Call
              </button>

              <button
                onClick={handleMessage}
                style={{
                  backgroundColor: colors.accent,
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '0.6rem 1.25rem',
                  fontSize: '1rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  minWidth: '120px',
                }}
              >
                💬 Message {firstName}
              </button>
            </div>
          )}
        </div>

        {/* PostComposer for owner */}
        {isOwner && (
          <div style={{ marginBottom: '2rem' }}>
            <PostComposer 
              onSubmit={handlePostSubmit}
              placeholder="How are you feeling today? Share a thought, hope, or moment..."
              maxFiles={4}
              defaultIsAnonymous={false}
            />
          </div>
        )}

        {/* Posts Section */}
        <div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '1rem', color: colors.textPrimary }}>
            Shared Thoughts
          </h2>
          {posts.length === 0 ? (
            <p style={{ textAlign: 'center', color: colors.textSecondary }}>
              {isOwner ? 'Start sharing your thoughts — you\'re not alone.' : 'No public posts yet.'}
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              {posts.map((post) => (
                <PostCard
                  key={post.id}
                  post={post}
                  canDelete={isOwner}
                  showAuthor={true}
                  context="profile"
                  onPostDeleted={() => {
                    setPosts((prev) => prev.filter((p) => p.id !== post.id));
                  }}
                />
              ))}
            </div>
          )}
        </div>

        {showMessageOverlay && profile && (
          <SendMessageOverlay
            isOpen={true}
            targetUserId={profile.id}
            targetName={profile.full_name || 'Anonymous'}
            onClose={() => setShowMessageOverlay(false)}
          />
        )}
      </div>
    </div>
  );
}