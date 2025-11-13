import { createClient } from '@supabase/supabase-js';
import { SUPABASE_URL, SUPABASE_ANON } from './config';
import type { Database } from '../types/supabase';

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_ANON);

export function getSupabase() {
  return supabase;
}
