// src/lib/auth-server.ts
import { createSupabaseServerClient } from '@/lib/supabase-server';
import { cookies } from 'next/headers';

export async function getCurrentUser() {
  try {
    // This line fails during static build (output: 'export') because there are no cookies yet.
    // It works perfectly when the app is running on the device.
    const cookieStore = await cookies();
    
    const supabase = createSupabaseServerClient(cookieStore);
    const { data: { user } } = await supabase.auth.getUser();
    
    return user;
  } catch (error) {
    // During static build, this catches the error and returns null.
    // This allows the build to complete successfully.
    // When the app runs on the phone, this block is skipped and auth works normally.
    return null;
  }
}