// src/app/communities/create/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase';
import Button from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Users, ArrowLeft } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

// Grief types that match the database schema and UI color system
const GRIEF_TYPES = [
  { id: 'parent', label: 'Loss of a Parent', gradient: 'from-amber-200 to-orange-300' },
  { id: 'child', label: 'Loss of a Child', gradient: 'from-purple-200 to-indigo-300' },
  { id: 'spouse', label: 'Grieving a Partner', gradient: 'from-rose-200 to-pink-300' },
  { id: 'sibling', label: 'Loss of a Sibling', gradient: 'from-teal-200 to-cyan-300' },
  { id: 'friend', label: 'Loss of a Friend', gradient: 'from-blue-200 to-indigo-300' },
  { id: 'pet', label: 'Pet Loss', gradient: 'from-yellow-200 to-amber-300' },
  { id: 'miscarriage', label: 'Pregnancy or Infant Loss', gradient: 'from-pink-200 to-rose-300' },
  { id: 'caregiver', label: 'Caregiver Grief', gradient: 'from-stone-200 to-amber-300' },
  { id: 'suicide', label: 'Suicide Loss', gradient: 'from-violet-200 to-purple-300' },
  { id: 'other', label: 'Other Loss', gradient: 'from-gray-200 to-stone-300' }
];

export default function CreateCommunityPage() {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [griefType, setGriefType] = useState(GRIEF_TYPES[0].id);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();
  const { user, sessionChecked } = useAuth();
  
  // Redirect to login WITH redirect path if not authenticated and session has been checked
  useEffect(() => {
    if (sessionChecked && !user) {
      const currentPath = window.location.pathname;
      router.push(`/auth?redirectTo=${encodeURIComponent(currentPath)}`);
    }
  }, [user, sessionChecked, router]);

  // Loading state while checking session
  if (!sessionChecked) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-solid border-amber-500 border-t-transparent mx-auto mb-4"></div>
          <p className="text-stone-600">Verifying your session...</p>
        </div>
      </div>
    );
  }

  // If no user after session check, don't render (redirect will happen)
  if (!user) {
    return null;
  }

  // Generate slug from community name
  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-') // Replace non-alphanumeric chars with hyphens
      .replace(/(^-|-$)/g, '');     // Remove leading/trailing hyphens
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim() || !description.trim()) {
      setError('Please fill in all required fields');
      return;
    }
    
    if (name.length < 3) {
      setError('Community name must be at least 3 characters long');
      return;
    }
    
    if (description.length < 10) {
      setError('Please provide a more detailed description');
      return;
    }

    // Double-check user is still authenticated before submission
    if (!user) {
      setError('Session expired. Please log in again to create a community.');
      router.push('/auth?redirectTo=/communities/create');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      // Generate slug ID for the community
      const communityId = generateSlug(name);
      
      // Check if community with this ID already exists
      const { data: existingCommunity, error: checkError } = await supabase
        .from('communities')
        .select('id')
        .eq('id', communityId)
        .maybeSingle();

      if (existingCommunity) {
        setError('A community with this name already exists. Please choose a different name.');
        setIsSubmitting(false);
        return;
      }

      // Create the community
      const { error: communityError } = await supabase
        .from('communities')
        .insert({
          id: communityId,
          name: name.trim(),
          description: description.trim(),
          grief_type: griefType,
          member_count: 1, // Creator is the first member
          online_count: 1, // Creator is online
          created_at: new Date().toISOString()
        });

      if (communityError) throw communityError;

      // Add creator as community member
      const { error: memberError } = await supabase
        .from('community_members')
        .insert({
          community_id: communityId,
          user_id: user.id,
          joined_at: new Date().toISOString(),
          role: 'admin'
        });

      if (memberError) throw memberError;

      // If there's a preview image, upload it to the communities bucket
      if (previewImage) {
        // Convert data URL to Blob
        const response = await fetch(previewImage);
        const blob = await response.blob();
        
        const { error: uploadError } = await supabase.storage
          .from('communities')
          .upload(`${communityId}/banner.jpg`, blob, {
            upsert: true
          });

        if (uploadError) {
          console.error('Banner upload failed:', uploadError);
          // Continue anyway - community was created successfully
        }
      }

      // Success! Redirect to the new community page
      router.push(`/communities/${communityId}`);
      
    } catch (err: any) {
      console.error('Community creation error:', err);
      setError(err.message || 'Failed to create community. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle image preview for banner
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please upload an image file');
      return;
    }
    
    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('Image must be less than 5MB');
      return;
    }
    
    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviewImage(reader.result as string);
      setError(null);
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 via-stone-50 to-stone-100 p-4 md:p-6 pt-20 md:pt-6">
      <div className="max-w-2xl mx-auto">
        {/* Back Button */}
        <button
          onClick={() => router.back()}
          className="flex items-center text-amber-700 hover:text-amber-800 mb-6 transition-colors"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          <span>Back to Communities</span>
        </button>
        
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-gradient-to-br from-amber-200 to-orange-300 mb-4 mx-auto">
            <Users className="h-7 w-7 text-white" />
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-stone-800 mb-2">
            Create Your Community
          </h1>
          <p className="text-stone-600">
            Start a safe space where others who share your grief journey can find connection.
          </p>
        </div>

        <Card className="bg-white rounded-xl border border-stone-200 p-6 shadow-sm">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Community Banner Preview/Upload */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-stone-700">
                Community Banner (optional)
              </label>
              <div 
                className="border-2 border-dashed border-stone-300 rounded-lg p-4 text-center cursor-pointer hover:border-amber-400 transition-colors"
                onClick={() => document.getElementById('banner-upload')?.click()}
              >
                {previewImage ? (
                  <div className="relative h-32 rounded-lg overflow-hidden">
                    <img 
                      src={previewImage} 
                      alt="Community banner preview" 
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black bg-opacity-20 flex items-center justify-center text-white text-sm">
                      Click to change banner
                    </div>
                  </div>
                ) : (
                  <div className="py-8">
                    <div className="mx-auto w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center mb-2">
                      <span className="text-amber-700 font-bold text-lg">+</span>
                    </div>
                    <p className="text-stone-600">
                      Upload a banner image (optional) <br />
                      <span className="text-xs text-stone-500">Recommended: 1200x300px, max 5MB</span>
                    </p>
                  </div>
                )}
              </div>
              <input
                type="file"
                id="banner-upload"
                accept="image/*"
                className="hidden"
                onChange={handleImageUpload}
              />
            </div>

            {/* Community Name */}
            <div className="space-y-2">
              <label htmlFor="name" className="block text-sm font-medium text-stone-700">
                Community Name <span className="text-red-500">*</span>
              </label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Loss of a Parent"
                className="w-full px-4 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                maxLength={60}
              />
              <p className="text-xs text-stone-500">
                This will be used in the community URL: healingshoulder.com/communities/{generateSlug(name) || 'your-community'}
              </p>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <label htmlFor="description" className="block text-sm font-medium text-stone-700">
                Description <span className="text-red-500">*</span>
              </label>
              <textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe your community in 1-2 sentences. What grief experience does it center around?"
                className="w-full px-4 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent min-h-[100px]"
                maxLength={250}
              />
              <p className="text-xs text-stone-500">
                {description.length}/250 characters
              </p>
            </div>

            {/* Grief Type */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-stone-700">
                Primary Grief Type <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {GRIEF_TYPES.map((type) => (
                  <button
                    key={type.id}
                    type="button"
                    onClick={() => setGriefType(type.id)}
                    className={`flex items-center p-3 rounded-lg border text-left transition-all ${
                      griefType === type.id
                        ? `border-amber-400 bg-gradient-to-br ${type.gradient} text-white`
                        : 'border-stone-300 hover:border-amber-300 hover:bg-stone-50'
                    }`}
                  >
                    <div className={`w-3 h-3 rounded-full mr-3 bg-gradient-to-br ${type.gradient}`}></div>
                    <span className="font-medium">{type.label}</span>
                  </button>
                ))}
              </div>
              <p className="text-xs text-stone-500">
                This helps match your community with others experiencing similar loss
              </p>
            </div>

            {/* Error Message */}
            {error && (
              <div className="p-3 bg-red-50 text-red-700 rounded-lg text-sm">
                {error}
              </div>
            )}

            {/* Submit Button */}
            <div className="pt-4 border-t border-stone-200">
              <Button
                type="submit"
                disabled={isSubmitting || !name.trim() || !description.trim()}
                className="w-full bg-amber-500 hover:bg-amber-600 text-white py-3 font-medium"
              >
                {isSubmitting ? (
                  <span className="flex items-center justify-center">
                    <span className="h-5 w-5 animate-spin rounded-full border-2 border-solid border-white border-t-transparent mr-2"></span>
                    Creating Community...
                  </span>
                ) : (
                  'Create Community'
                )}
              </Button>
              <p className="text-center text-xs text-stone-500 mt-3">
                By creating this community, you agree to moderate it with care and compassion. 
                You can add co-moderators later.
              </p>
            </div>
          </form>
        </Card>

        {/* Guidelines */}
        <div className="mt-8 bg-white rounded-xl border border-stone-200 p-5">
          <h3 className="font-medium text-stone-800 mb-3 flex items-center">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 inline-block mr-2"></span>
            Community Guidelines
          </h3>
          <ul className="space-y-2 text-sm text-stone-600">
            <li>• Your community should have a clear focus on a specific grief experience</li>
            <li>• You are responsible for creating a safe, inclusive space</li>
            <li>• Healing Shoulder staff may reach out to help you moderate as your community grows</li>
            <li>• Communities that become inactive or harmful may be archived by staff</li>
          </ul>
        </div>
      </div>
    </div>
  );
}