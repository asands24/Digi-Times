import { createClient } from '@supabase/supabase-js';
import { SUPABASE_URL, SUPABASE_ANON } from './config';

if (!SUPABASE_URL || !SUPABASE_ANON) {
  console.error('[Supabase] Missing config', {
    SUPABASE_URL,
    hasAnonKey: Boolean(SUPABASE_ANON),
  });
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON, {
  auth: {
    persistSession: true,
  },
});

export const supabaseClient = supabase;

export function getSupabase() {
  return supabase;
}
