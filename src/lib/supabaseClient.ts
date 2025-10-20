import { createClient } from '@supabase/supabase-js';

const url =
  process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.REACT_APP_SUPABASE_URL;
const anon =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? process.env.REACT_APP_SUPABASE_ANON_KEY;

if (!url || !anon) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(url, anon);
