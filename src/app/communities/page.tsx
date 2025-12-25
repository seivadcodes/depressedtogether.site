// src/app/communities/page.tsx
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Users, MessageCircle, Heart, Plus } from 'lucide-react';
import { createClient } from '@/lib/supabase';
import Button from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useAuth } from '@/hooks/useAuth';

// Types for community data
interface Community {
  id: string;
  name: string;
  description: string;
  member_count: number;
  online_count: number;
  grief_type: string;
  created_at: string;
  cover_photo_url?: string | null;
}

export default function CommunitiesPage() {
  const [communities, setCommunities] = useState<Community[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalOnline, setTotalOnline] = useState(0);
  const router = useRouter();
  const supabase = createClient();
  const { user } = useAuth();

  // Fetch communities from database
  useEffect(() => {
    const fetchCommunities = async () => {
      try {
        const { data, error } = await supabase
          .from('communities')
          .select('*')
          .order('member_count', { ascending: false });

        if (error) throw error;
        
        if (data) {
          // Add cover photo URLs
          const communitiesWithPhotos = data.map(community => {
            if (community.id) {
              return {
                ...community,
                cover_photo_url: community.id 
                  ? `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/communities/${community.id}/banner.jpg`
                  : null
              };
            }
            return community;
          });
          
          setCommunities(communitiesWithPhotos);
          
          // Calculate total online members across all communities
          const total = communitiesWithPhotos.reduce((sum, community) => sum + community.online_count, 0);
          setTotalOnline(total);
        }
      } catch (err) {
        console.error('Error fetching communities:', err);
        setError('Failed to load communities. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchCommunities();
  }, [supabase]);

  // Generate gradient colors based on grief type
  const getGradientColors = (griefType: string) => {
    const gradients: Record<string, string> = {
      'parent': 'from-amber-200 to-orange-300',
      'child': 'from-purple-200 to-indigo-300',
      'spouse': 'from-rose-200 to-pink-300',
      'sibling': 'from-teal-200 to-cyan-300',
      'friend': 'from-blue-200 to-indigo-300',
      'pet': 'from-yellow-200 to-amber-300',
      'miscarriage': 'from-pink-200 to-rose-300',
      'caregiver': 'from-stone-200 to-amber-300',
      'suicide': 'from-violet-200 to-purple-300',
      'other': 'from-gray-200 to-stone-300'
    };
    return gradients[griefType] || 'from-amber-200 to-orange-300';
  };

  // Format time since last activity
  const formatRecentActivity = (createdAt: string) => {
    const now = new Date();
    const created = new Date(createdAt);
    const diffMinutes = Math.floor((now.getTime() - created.getTime()) / 60000);
    
    if (diffMinutes < 1) return 'Just now';
    if (diffMinutes < 2) return '1 minute ago';
    if (diffMinutes < 60) return `${diffMinutes} minutes ago`;
    if (diffMinutes < 120) return '1 hour ago';
    
    const hours = Math.floor(diffMinutes / 60);
    return `${hours} hours ago`;
  };

  // Handle request new community
  const handleRequestCommunity = () => {
    if (!user) {
      router.push('/auth?redirectTo=/communities/create');
      return;
    }
    router.push('/communities/create');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-amber-50 via-stone-50 to-stone-100 flex items-center justify-center">
        <div className="text-center">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-solid border-amber-500 border-t-transparent mx-auto mb-4"></div>
          <p className="text-stone-600">Loading communities...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-amber-50 via-stone-50 to-stone-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl p-6 max-w-md text-center shadow-md">
          <div className="text-amber-500 mb-3">
            <Users className="h-12 w-12 mx-auto" />
          </div>
          <h2 className="text-xl font-bold text-stone-800 mb-2">Error Loading Communities</h2>
          <p className="text-stone-600 mb-4">{error}</p>
          <Button onClick={() => router.refresh()} className="bg-amber-500 hover:bg-amber-600 text-white">
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 via-stone-50 to-stone-100 p-4 md:p-6 pt-20 md:pt-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-gradient-to-br from-amber-200 to-orange-300 mb-4 mx-auto">
            <Users className="h-7 w-7 text-white" />
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-stone-800 mb-2">
            Find Your Tribe
          </h1>
          <p className="text-stone-600 max-w-2xl mx-auto">
            Join a circle where your grief is understood — not explained away. Share your story, read others', or simply be present.
          </p>
          <div className="mt-4 inline-block px-4 py-2 rounded-full bg-green-100 text-green-800 text-sm font-medium">
            🟢 {totalOnline} people in communities right now
          </div>
        </div>

        {/* Communities Grid */}
        <div className="space-y-5 mb-12">
          {communities.map((community) => (
            <Link
              key={community.id}
              href={`/communities/${community.id}`}
              className="block transition-transform hover:scale-[1.01]"
            >
              <Card className="bg-white rounded-xl border border-stone-200 p-5 shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden">
                {/* Cover Photo */}
                {community.cover_photo_url && (
                  <div className="h-24 rounded-lg mb-4 overflow-hidden">
                    <img 
                      src={community.cover_photo_url} 
                      alt={community.name} 
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.currentTarget.parentElement!.style.display = 'none';
                      }}
                    />
                  </div>
                )}
                
                {/* Community Header */}
                <div className="flex items-start gap-4 mb-3">
                  <div
                    className={`w-12 h-12 rounded-full bg-gradient-to-br ${getGradientColors(community.grief_type)} flex items-center justify-center flex-shrink-0`}
                  >
                    <Users size={20} className="text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h2 className="font-bold text-stone-800 text-lg truncate">{community.name}</h2>
                    <p className="text-sm text-stone-600 line-clamp-2">{community.description}</p>
                  </div>
                </div>
                
                {/* Stats */}
                <div className="flex flex-wrap items-center gap-4 text-xs text-stone-500 mb-3">
                  <span className="flex items-center gap-1">
                    <Users size={14} className="text-stone-400" />
                    {community.member_count.toLocaleString()} members
                  </span>
                  <span className="flex items-center gap-1">
                    <Heart size={14} className="text-green-600" />
                    {community.online_count} online now
                  </span>
                </div>
                
                {/* Recent Activity */}
                <div className="flex items-start gap-2 text-sm">
                  <MessageCircle size={16} className="text-amber-600 mt-0.5 flex-shrink-0" />
                  <p className="text-stone-700">
                    {formatRecentActivity(community.created_at)}: Someone just shared a memory
                  </p>
                </div>
              </Card>
            </Link>
          ))}
        </div>

        {/* Empty State */}
        {communities.length === 0 && (
          <div className="text-center py-12 bg-white rounded-xl border border-dashed border-stone-300">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-amber-100 text-amber-700 mb-4 mx-auto">
              <Users className="h-6 w-6" />
            </div>
            <h3 className="text-xl font-medium text-stone-800 mb-2">No communities yet</h3>
            <p className="text-stone-600 mb-6 max-w-md mx-auto">
              Be the first to create a community for your grief experience. Your story matters, and others are waiting to hear it.
            </p>
            <Button onClick={handleRequestCommunity} className="bg-amber-500 hover:bg-amber-600 text-white">
              <Plus className="h-4 w-4 mr-2" />
              Start Your Community
            </Button>
          </div>
        )}

        {/* Create Community Button */}
        <div className="bg-white rounded-xl border border-stone-200 p-5 text-center">
          <p className="text-stone-600 mb-3">
            Can't find a community that matches your grief experience?
          </p>
          <Button 
            onClick={handleRequestCommunity}
            className="bg-amber-500 hover:bg-amber-600 text-white"
          >
            <Plus className="h-4 w-4 mr-2" />
            Start a New Community
          </Button>
        </div>

        {/* Community Guidelines Footer */}
        <div className="mt-8 text-center text-stone-500 text-sm p-4 bg-white/50 rounded-lg">
          <p>All communities are moderated with care. We honor every story without judgment.</p>
          <p className="mt-1 font-medium">Your grief is valid. Your presence matters.</p>
        </div>
      </div>
    </div>
  );
}