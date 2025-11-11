export const APP_ACCESS_MODE = process.env.APP_ACCESS_MODE ?? 'public'; // 'public' | 'login'
export const REQUIRE_LOGIN = APP_ACCESS_MODE === 'login';

const URL = process.env.REACT_APP_SUPABASE_URL;
const KEY = process.env.REACT_APP_SUPABASE_ANON_KEY;

if (!URL || !KEY) {
  throw new Error('Missing Supabase env. Set REACT_APP_SUPABASE_URL and REACT_APP_SUPABASE_ANON_KEY.');
}

export const SUPABASE_URL = URL!;
export const SUPABASE_ANON = KEY!;
