// lib/supabase-server.ts
import { SupabaseClient, createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

const createSupabaseServerClient = (): SupabaseClient => {
  const cookieStore = cookies();
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false,
    },
    global: {
      headers: {
        Cookie: cookieStore.toString(),
      },
    },
  });

  return supabase;
};

export { createSupabaseServerClient };