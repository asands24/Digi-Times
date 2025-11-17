import { createClient } from '@supabase/supabase-js';
import { SUPABASE_URL, SUPABASE_ANON } from './config';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON);
export const supabaseClient = supabase;

export function getSupabase() {
  return supabase;
}
