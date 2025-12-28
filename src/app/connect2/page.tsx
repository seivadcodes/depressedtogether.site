// app/connect2/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { formatDistanceToNow } from 'date-fns';
import { X, Loader2 } from 'lucide-react';

// Match the exact GriefType from /connect
type GriefType =
  | 'parent'
  | 'child'
  | 'spouse'
  | 'sibling'
  | 'friend'
  | 'pet'
  | 'miscarriage'
  | 'caregiver'
  | 'suicide'
  | 'other';

type SupportRequest = {
  id: string;
  user_id: string;
  grief_type: GriefType;
  description: string | null;
  created_at: string;
  requester_name: string | null;
};

const griefTypeLabels: Record<GriefType, string> = {
  parent: 'Loss of a Parent',
  child: 'Loss of a Child',
  spouse: 'Grieving a Partner',
  sibling: 'Loss of a Sibling',
  friend: 'Loss of a Friend',
  pet: 'Pet Loss',
  miscarriage: 'Pregnancy or Infant Loss',
  caregiver: 'Caregiver Grief',
  suicide: 'Suicide Loss',
  other: 'Other Loss',
};

export default function Connect2Page() {
  const [requests, setRequests] = useState<SupportRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [selectedGriefType, setSelectedGriefType] = useState<GriefType | ''>('');
  const [description, setDescription] = useState('');

  const supabase = createClient();
  const router = useRouter();

  // Helper to get first name or fallback
  const getFirstName = (fullName: string | null) => {
    if (!fullName || fullName.trim() === '') return 'Someone';
    return fullName.split(' ')[0].trim() || 'Someone';
  };

  useEffect(() => {
    const fetchRequests = async () => {
      setLoading(true);
      const { data: { user: currentUser } } = await supabase.auth.getUser();

      let query = supabase
        .from('support_requests')
        .select(`
          id,
          user_at: user_id,
          grief_type,
          description,
          created_at,
          profiles!inner (full_name)
        `)
        .eq('status', 'pending');

      // Exclude own requests if logged in
      if (currentUser) {
        query = query.neq('user_id', currentUser.id);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Failed to load requests:', error);
        setRequests([]);
      } else {
        const formatted = (data || []).map((req: any) => ({
          ...req,
          requester_name: req.profiles?.[0]?.full_name || null,
        }));
        setRequests(formatted);
      }
      setLoading(false);
    };

    fetchRequests();

    // Realtime subscription
    const channel = supabase
      .channel('support_requests')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'support_requests' },
        async (payload) => {
          const { data: newRequest, error: fetchError } = await supabase
            .from('support_requests')
            .select(`
              id,
              user_id,
              grief_type,
              description,
              created_at,
              profiles!inner (full_name)
            `)
            .eq('id', payload.new.id)
            .single();

          if (fetchError || !newRequest) return;

          // Don't show own requests
          const { data: { user: currentUser } } = await supabase.auth.getUser();
          if (currentUser && newRequest.user_id === currentUser.id) return;

          setRequests((prev) => [
            {
              ...newRequest,
              requester_name: newRequest.profiles?.[0]?.full_name || null,
            },
            ...prev,
          ]);
        }
      )
      .on(
        'postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'support_requests' },
        (payload) => {
          setRequests((prev) => prev.filter((r) => r.id !== payload.old.id));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase]);

  const handleCreateRequest = async () => {
    if (!selectedGriefType) {
      alert('Please select a grief type.');
      return;
    }

    setSubmitting(true);
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      alert('You must be signed in');
      setSubmitting(false);
      return;
    }

    const roomId = crypto.randomUUID();

    const { error: insertError } = await supabase
      .from('support_requests')
      .insert({
        id: roomId,
        user_id: user.id,
        status: 'pending',
        grief_type: selectedGriefType,
        description: description || null,
      });

    if (insertError) {
      console.error('Failed to create request:', insertError);
      alert('Failed to request support');
    } else {
      setShowModal(false);
      setSelectedGriefType('');
      setDescription('');
      router.push(`/room/${roomId}`);
    }

    setSubmitting(false);
  };

  const acceptRequest = async (roomId: string, requesterUserId: string) => {
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      alert('You must be signed in');
      return;
    }

    if (requesterUserId === user.id) {
      alert('You cannot accept your own request.');
      return;
    }

    const { error: updateError } = await supabase
      .from('support_requests')
      .update({ status: 'accepted' })
      .eq('id', roomId)
      .eq('status', 'pending');

    if (updateError) {
      alert('Failed to accept request');
      return;
    }

    router.push(`/room/${roomId}`);
  };

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Need to Talk?</h1>

      <button
        onClick={() => setShowModal(true)}
        className="bg-amber-500 hover:bg-amber-600 text-white px-6 py-3 rounded-lg font-medium"
      >
        I need to talk
      </button>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-lg w-full max-w-md">
            <div className="flex justify-between items-center p-5 border-b border-stone-200">
              <h2 className="text-xl font-semibold text-stone-800">What are you grieving?</h2>
              <button
                onClick={() => setShowModal(false)}
                className="text-stone-500 hover:text-stone-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-2">
                  Grief type
                </label>
                <select
                  value={selectedGriefType}
                  onChange={(e) => setSelectedGriefType(e.target.value as GriefType)}
                  className="w-full p-2.5 border border-stone-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                >
                  <option value="">Select your experience</option>
                  {(Object.keys(griefTypeLabels) as GriefType[]).map((type) => (
                    <option key={type} value={type}>
                      {griefTypeLabels[type]}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-stone-700 mb-2">
                  Anything you’d like to share? (optional)
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="I'm looking for someone who understands..."
                  className="w-full min-h-[80px] rounded-md border border-stone-300 px-3 py-2 text-sm placeholder:text-stone-500 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2 border-t border-stone-200">
                <button
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-stone-700 hover:bg-stone-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateRequest}
                  disabled={!selectedGriefType || submitting}
                  className="bg-amber-500 hover:bg-amber-600 disabled:bg-amber-300 text-white px-4 py-2 rounded-lg flex items-center gap-2"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    'Create Request'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="mt-8 space-y-4">
        <h2 className="text-xl font-semibold">Active Requests</h2>
        {loading ? (
          <p>Loading...</p>
        ) : requests.length === 0 ? (
          <p className="text-gray-500">No one is requesting support right now.</p>
        ) : (
          requests.map((req) => (
            <div key={req.id} className="border p-4 rounded-lg bg-white shadow">
              <div className="flex justify-between items-start">
                <div>
                  <span className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded capitalize">
                    {griefTypeLabels[req.grief_type] || req.grief_type}
                  </span>
                  <p className="mt-2">
                    <span className="font-medium">{getFirstName(req.requester_name)}</span> needs to talk
                  </p>
                  {req.description && (
                    <p className="mt-2 text-gray-700 italic">“{req.description}”</p>
                  )}
                </div>
                <span className="text-xs text-gray-500 whitespace-nowrap">
                  {formatDistanceToNow(new Date(req.created_at))} ago
                </span>
              </div>
              <div className="mt-3 flex gap-2">
                <button
                  onClick={() => acceptRequest(req.id, req.user_id)} // ✅ pass user_id
                  className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded text-sm"
                >
                  Accept
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}