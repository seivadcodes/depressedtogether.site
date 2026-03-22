// src/app/test-post-bg/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { PostComposer } from '@/components/PostComposer';
import { PostCard, Post } from '@/components/PostCard';
import { useAuth } from '@/hooks/useAuth';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'react-hot-toast';
import { Bug, Trash2, RefreshCw } from 'lucide-react';

export default function TestPostBackgroundPage() {
  const { user } = useAuth();
  const supabase = createClient();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [debugLogs, setDebugLogs] = useState<string[]>([]);

  const addDebug = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    const log = `[${timestamp}] ${message}`;
    console.log('[TEST PAGE DEBUG]', log);
    setDebugLogs(prev => [log, ...prev].slice(0, 20));
  };

  // 🔍 Fetch current user's posts from BOTH tables
  const fetchUserPosts = async () => {
    if (!user?.id) {
      addDebug('❌ No user logged in');
      setLoading(false);
      return;
    }

    addDebug('🔄 Fetching posts for user: ' + user.id);
    setLoading(true);

    try {
      // Fetch from regular posts table
      const { data: regularPosts, error: regularError } = await supabase
        .from('posts')
        .select(`
          id,
          content,
          created_at,
          media_url,
          media_urls,
          user_id,
          bg_style
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (regularError) {
        addDebug('❌ Error fetching regular posts: ' + regularError.message);
      } else {
        addDebug(`✅ Found ${regularPosts?.length || 0} regular posts`);
      }

      // Fetch from community_posts table
      const { data: communityPosts, error: communityError } = await supabase
        .from('posts')
        .select(`
          id,
          content,
          created_at,
          media_url,
          media_urls,
          user_id,
          bg_style
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (communityError) {
        addDebug('❌ Error fetching community posts: ' + communityError.message);
      } else {
        addDebug(`✅ Found ${communityPosts?.length || 0} community posts`);
      }

      // Combine both
      const allPosts = [...(regularPosts || []), ...(communityPosts || [])];
      
      // Sort by created_at
      allPosts.sort((a, b) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );

      // Transform to PostCard format
      const transformedPosts: Post[] = allPosts.map(post => {
        const mediaUrls = Array.isArray(post.media_urls) && post.media_urls.length > 0
          ? post.media_urls.filter(Boolean).map(path => `/api/media/communities/${path}`)
          : post.media_url
          ? [`/api/media/communities/${post.media_url}`]
          : [];

        return {
          id: post.id,
          userId: post.user_id,
          text: post.content,
          mediaUrl: mediaUrls[0] || undefined,
          mediaUrls,
          createdAt: new Date(post.created_at),
          likes: 0,
          isLiked: false,
          commentsCount: 0,
          isAnonymous: false,
          bgStyle: post.bg_style, // 👈 THIS IS THE KEY FIELD
          user: {
            id: user.id,
            fullName: user.user_metadata?.full_name || 'Test User',
            avatarUrl: user.user_metadata?.avatar_url || null,
            isAnonymous: false,
          },
        };
      });

      addDebug(`📊 Total transformed posts: ${transformedPosts.length}`);
      transformedPosts.forEach((post, i) => {
        addDebug(`   Post #${i + 1}: bgStyle = "${post.bgStyle || '(empty)'}"`);
      });

      setPosts(transformedPosts);
    } catch (err) {
      addDebug('❌ Unexpected error: ' + (err instanceof Error ? err.message : String(err)));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUserPosts();
  }, [user?.id]);

  const handlePostSubmit = async (
    text: string,
    mediaFiles: File[],
    isAnonymous: boolean,
    bgStyle?: string
  ) => {
    if (!user?.id) {
      toast.error('Not logged in');
      return;
    }

    addDebug(`📝 Submit called - text: "${text.substring(0, 30)}..."`);
    addDebug(`🎨 bgStyle received from PostComposer: "${bgStyle || '(empty)'}"`);

    try {
      // Save to regular posts table (simpler for testing)
      const { data: postData, error: postError } = await supabase
        .from('posts')
        .insert({
          user_id: user.id,
          content: text.trim(),
          created_at: new Date().toISOString(),
          media_urls: mediaFiles.length > 0 ? mediaFiles.map(f => f.name) : [],
          bg_style: bgStyle || '', // 👈 SAVE THE BG STYLE
        })
        .select(`
          id,
          content,
          created_at,
          media_url,
          media_urls,
          user_id,
          bg_style
        `)
        .single();

      if (postError) throw postError;

      addDebug(`✅ Post saved to database with bg_style: "${postData.bg_style}"`);

      // Create Post object for display
      const newPost: Post = {
        id: postData.id,
        userId: user.id,
        text: postData.content,
        mediaUrl: null,
        mediaUrls: [],
        createdAt: new Date(postData.created_at),
        likes: 0,
        isLiked: false,
        commentsCount: 0,
        isAnonymous: false,
        bgStyle: postData.bg_style, // 👈 VERIFY IT'S HERE
        user: {
          id: user.id,
          fullName: user.user_metadata?.full_name || 'Test User',
          avatarUrl: user.user_metadata?.avatar_url || null,
          isAnonymous: false,
        },
      };

      addDebug(`✅ NewPost object bgStyle: "${newPost.bgStyle || '(empty)'}"`);

      setPosts(prev => [newPost, ...prev]);
      toast.success('Test post created! Check debug logs below.');
    } catch (err) {
      addDebug('❌ Post creation failed: ' + (err instanceof Error ? err.message : String(err)));
      toast.error('Failed to create post');
    }
  };

  const handleDeleteTestPost = async (postId: string) => {
    try {
      // Delete from both tables
      await supabase.from('posts').delete().eq('id', postId);
      await supabase.from('posts').delete().eq('id', postId);
      
      setPosts(prev => prev.filter(p => p.id !== postId));
      addDebug(`🗑️ Deleted post: ${postId}`);
      toast.success('Post deleted');
    } catch (err) {
      addDebug('❌ Delete failed: ' + (err instanceof Error ? err.message : String(err)));
      toast.error('Failed to delete');
    }
  };

  const clearAllPosts = async () => {
    if (!confirm('Delete ALL your test posts? This cannot be undone.')) return;
    
    try {
      await supabase.from('posts').delete().eq('user_id', user?.id || '');
      await supabase.from('posts').delete().eq('user_id', user?.id || '');
      setPosts([]);
      addDebug('🧹 Cleared all test posts');
      toast.success('All posts cleared');
      fetchUserPosts();
    } catch (err) {
      addDebug('❌ Clear failed: ' + (err instanceof Error ? err.message : String(err)));
      toast.error('Failed to clear posts');
    }
  };

  if (!user) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(to bottom, #f0f7ff, #e6f0ff)',
      }}>
        <div style={{
          background: 'white',
          padding: '2rem',
          borderRadius: '1rem',
          textAlign: 'center',
          maxWidth: '400px',
        }}>
          <h1 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>🔐 Login Required</h1>
          <p style={{ color: '#64748b', marginBottom: '1.5rem' }}>
            Please log in to test post background colors.
          </p>
          <a
            href="/auth"
            style={{
              display: 'inline-block',
              padding: '0.75rem 1.5rem',
              background: '#f59e0b',
              color: 'white',
              borderRadius: '0.5rem',
              textDecoration: 'none',
              fontWeight: 600,
            }}
          >
            Go to Login
          </a>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(to bottom, #f0f7ff, #e6f0ff, #dde9ff)',
      padding: '2rem',
    }}>
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{
          background: 'white',
          borderRadius: '1rem',
          padding: '1.5rem',
          marginBottom: '1.5rem',
          border: '1px solid #e2e8f0',
        }}>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#1e293b', marginBottom: '0.5rem' }}>
            🧪 Test Post Background Colors
          </h1>
          <p style={{ color: '#64748b', fontSize: '0.875rem' }}>
            Create posts with colored backgrounds to debug if they save and display correctly.
            Only YOUR posts are shown.
          </p>
          <div style={{ marginTop: '1rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            <button
              onClick={fetchUserPosts}
              style={{
                padding: '0.5rem 1rem',
                background: '#3b82f6',
                color: 'white',
                border: 'none',
                borderRadius: '0.5rem',
                cursor: 'pointer',
                fontSize: '0.875rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
              }}
            >
              <RefreshCw size={16} />
              Refresh Posts
            </button>
            <button
              onClick={clearAllPosts}
              style={{
                padding: '0.5rem 1rem',
                background: '#ef4444',
                color: 'white',
                border: 'none',
                borderRadius: '0.5rem',
                cursor: 'pointer',
                fontSize: '0.875rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
              }}
            >
              <Trash2 size={16} />
              Clear All Posts
            </button>
          </div>
        </div>

        {/* Debug Panel */}
        <div style={{
          background: '#1e293b',
          color: '#10b981',
          borderRadius: '1rem',
          padding: '1rem',
          marginBottom: '1.5rem',
          fontFamily: 'monospace',
          fontSize: '0.75rem',
          maxHeight: '300px',
          overflowY: 'auto',
        }}>
          <div style={{ 
            fontWeight: 600, 
            marginBottom: '0.5rem', 
            color: '#fbbf24',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
          }}>
            <Bug size={16} />
            DEBUG CONSOLE ({debugLogs.length} logs)
          </div>
          {debugLogs.map((line, i) => (
            <div 
              key={i} 
              style={{ 
                marginBottom: '0.25rem', 
                borderBottom: '1px solid #334155', 
                paddingBottom: '0.25rem',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-all',
              }}
            >
              {line}
            </div>
          ))}
          {debugLogs.length === 0 && (
            <div style={{ color: '#64748b' }}>
              No debug info yet. Create a post or refresh to see logs.
            </div>
          )}
        </div>

        {/* Post Composer */}
        <div style={{ marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '1.125rem', fontWeight: 600, color: '#1e293b', marginBottom: '1rem' }}>
            📝 Create Test Post
          </h2>
          <PostComposer
            onSubmit={handlePostSubmit}
            isSubmitting={false}
            placeholder="Test posting with a colored background... 🎨"
            maxFiles={4}
            defaultIsAnonymous={false}
          />
        </div>

        {/* Posts Feed */}
        <div>
          <h2 style={{ fontSize: '1.125rem', fontWeight: 600, color: '#1e293b', marginBottom: '1rem' }}>
            📋 Your Posts ({posts.length})
          </h2>
          
          {loading ? (
            <div style={{
              background: 'white',
              borderRadius: '1rem',
              padding: '3rem',
              textAlign: 'center',
              border: '1px solid #e2e8f0',
            }}>
              <div style={{
                width: '24px',
                height: '24px',
                border: '3px solid #f59e0b',
                borderTopColor: 'transparent',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite',
                margin: '0 auto 1rem',
              }} />
              <p style={{ color: '#64748b' }}>Loading your posts...</p>
            </div>
          ) : posts.length === 0 ? (
            <div style={{
              background: 'white',
              borderRadius: '1rem',
              padding: '3rem',
              textAlign: 'center',
              border: '1px solid #e2e8f0',
            }}>
              <p style={{ color: '#64748b' }}>
                No posts yet. Create one above with a colored background!
              </p>
            </div>
          ) : (
            posts.map((post, index) => (
              <div key={post.id} style={{ marginBottom: '1.5rem', position: 'relative' }}>
                {/* Index Badge */}
                <div style={{
                  position: 'absolute',
                  top: '-0.5rem',
                  left: '-0.5rem',
                  background: '#f59e0b',
                  color: 'white',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  padding: '0.25rem 0.5rem',
                  borderRadius: '0.5rem',
                  zIndex: 10,
                }}>
                  #{posts.length - index}
                </div>
                
                <PostCard
                  post={post}
                  canDelete={true}
                  onPostDeleted={() => handleDeleteTestPost(post.id)}
                  context="feed"
                  showAuthor={true}
                />
                
                {/* Show bgStyle value for debugging */}
                <div style={{
                  background: post.bgStyle ? '#f0fdf4' : '#fef2f2',
                  padding: '0.75rem',
                  borderRadius: '0.5rem',
                  marginTop: '-1rem',
                  marginLeft: '1rem',
                  marginRight: '1rem',
                  fontSize: '0.75rem',
                  color: post.bgStyle ? '#166534' : '#991b1b',
                  fontFamily: 'monospace',
                  border: post.bgStyle ? '1px solid #86efac' : '1px solid #fca5a5',
                  borderTop: 'none',
                }}>
                  <div style={{ fontWeight: 600, marginBottom: '0.25rem' }}>
                    🔍 Debug Info:
                  </div>
                  <div><strong>bgStyle:</strong> {post.bgStyle ? `"${post.bgStyle}"` : <em>(empty - will show white)</em>}</div>
                  <div><strong>Post ID:</strong> {post.id}</div>
                  <div><strong>Has Background:</strong> {post.bgStyle ? '✅ YES' : '❌ NO'}</div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Instructions */}
        <div style={{
          background: 'white',
          borderRadius: '1rem',
          padding: '1.5rem',
          marginTop: '2rem',
          border: '1px solid #e2e8f0',
        }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 600, color: '#1e293b', marginBottom: '0.75rem' }}>
            📖 How to Debug
          </h3>
          <ol style={{ color: '#64748b', fontSize: '0.875rem', lineHeight: 1.8, paddingLeft: '1.25rem' }}>
            <li>Click the <strong>🎨 Palette icon</strong> in the PostComposer</li>
            <li>Select a colored background (e.g., "Calm", "Warm", "Peace")</li>
            <li>Type some text and click <strong>Share</strong></li>
            <li>Check the <strong>Debug Console</strong> above - it should show the bgStyle value</li>
            <li>Look at the <strong>green/red box</strong> below each post</li>
            <li>If box is <strong>green</strong> with gradient string → Data is saved correctly</li>
            <li>If box is <strong>red</strong> with "(empty)" → Data is NOT being saved</li>
            <li>If green but post is still white → PostCard is NOT applying the background</li>
          </ol>
          
          <div style={{
            marginTop: '1rem',
            padding: '0.75rem',
            background: '#fef3c7',
            borderRadius: '0.5rem',
            fontSize: '0.875rem',
            color: '#92400e',
          }}>
            <strong>⚠️ Common Issues:</strong>
            <ul style={{ marginTop: '0.5rem', paddingLeft: '1.25rem' }}>
              <li><strong>Database column missing:</strong> Run the SQL migration to add <code>bg_style</code> column</li>
              <li><strong>Old posts:</strong> Posts created before adding bg_style will show empty (create NEW post)</li>
              <li><strong>PostComposer not passing:</strong> Check if Palette button actually sets selectedBg state</li>
              <li><strong>PostCard not reading:</strong> Check if <code>post.bgStyle</code> is being used in cardStyle</li>
            </ul>
          </div>
        </div>

        {/* Database Check */}
        <div style={{
          background: 'white',
          borderRadius: '1rem',
          padding: '1.5rem',
          marginTop: '1.5rem',
          border: '1px solid #e2e8f0',
        }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 600, color: '#1e293b', marginBottom: '0.75rem' }}>
            🗄️ Database Migration Check
          </h3>
          <p style={{ color: '#64748b', fontSize: '0.875rem', marginBottom: '1rem' }}>
            Make sure you've run this SQL in Supabase SQL Editor:
          </p>
          <div style={{
            background: '#1e293b',
            color: '#10b981',
            padding: '1rem',
            borderRadius: '0.5rem',
            fontFamily: 'monospace',
            fontSize: '0.75rem',
            overflowX: 'auto',
          }}>
            <pre style={{ margin: 0 }}>
{`ALTER TABLE posts ADD COLUMN IF NOT EXISTS bg_style TEXT DEFAULT '';
ALTER TABLE community_posts ADD COLUMN IF NOT EXISTS bg_style TEXT DEFAULT '';`}
            </pre>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}