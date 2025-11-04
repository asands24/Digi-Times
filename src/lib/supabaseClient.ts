import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const url = process.env.REACT_APP_SUPABASE_URL;
const anon = process.env.REACT_APP_SUPABASE_ANON_KEY;

let client: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient {
  if (!url || !anon) {
    console.error('Missing Supabase env vars', {
      hasUrl: !!url,
      hasAnon: !!anon,
    });
    throw new Error(
      'Supabase not configured. Set REACT_APP_SUPABASE_URL and REACT_APP_SUPABASE_ANON_KEY.'
    );
  }

  if (!client) {
    client = createClient(url, anon, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    });
  }

  return client;
}
