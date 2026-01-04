// src/lib/comments-hearts/commentsLogic.ts
import { createClient } from '@/lib/supabase';
import { toast } from 'react-hot-toast';

export async function addComment(postId: string, content: string, userId: string) {
  if (!content.trim()) {
    toast.error('Comment cannot be empty');
    return null;
  }

  const supabase = createClient(); // ✅ Create client per function call

  try {
    const { data, error } = await supabase
      .from('comments')
      .insert({ 
        post_id: postId,
        user_id: userId,
        content: content.trim()
      })
      .select(`
        *,
        user:profiles!inner (
          id,
          full_name,
          avatar_url
        )
      `)
      .single();

    if (error) throw error;
    
    toast.success('Comment added');
    return data;
} catch (error: unknown) {
  console.error('Error adding comment:', error);
  if (error instanceof Error) {
    toast.error(error.message);
  } else {
    toast.error('Failed to add comment');
  }
  return null;
}
}

export async function deleteComment(commentId: string, userId: string) {
  const supabase = createClient(); // ✅

  try {
    // First verify this user owns the comment
    const { data: comment, error: checkError } = await supabase
      .from('comments')
      .select('user_id')
      .eq('id', commentId)
      .single();

    if (checkError) throw checkError;
    if (comment.user_id !== userId) {
      throw new Error('You can only delete your own comments');
    }

    const { error } = await supabase
      .from('comments')
      .delete()
      .eq('id', commentId);

    if (error) throw error;
    
    toast.success('Comment deleted');
    return true;
  } catch (error: unknown) {
  console.error('Error deleting comment:', error);
  if (error instanceof Error) {
    toast.error(error.message);
  } else {
    toast.error('Failed to delete comment');
  }
  return false;
}
}

export async function fetchCommentsForPost(postId: string) {
  const supabase = createClient(); // ✅

  try {
    const { data, error } = await supabase
      .from('comments')
      .select(`
        *,
        user:profiles!inner (
          id,
          full_name,
          avatar_url
        )
      `)
      .eq('post_id', postId)
      .order('created_at', { ascending: true });

    if (error) throw error;
    return data || [];
  } catch (error: unknown) {
  console.error('Error fetching comments:', error);
  toast.error('Failed to load comments');
  return [];
}
}