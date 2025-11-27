export const APP_ACCESS_MODE = process.env.APP_ACCESS_MODE ?? 'public'; // 'public' | 'login'
export const REQUIRE_LOGIN = APP_ACCESS_MODE === 'login';

const URL =
  process.env.REACT_APP_SUPABASE_URL ??
  process.env.NEXT_PUBLIC_SUPABASE_URL ??
  '';
const KEY =
  process.env.REACT_APP_SUPABASE_ANON_KEY ??
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
  '';

if (!URL || !KEY) {
  console.error('[Config] Missing Supabase env vars. Check .env or Netlify settings.');
  // We don't throw here to allow the app to load and show a friendly error UI if needed,
  // but the Supabase client will fail if used.
}

export const SUPABASE_URL: string = URL;
export const SUPABASE_ANON: string = KEY;

if (typeof window !== 'undefined') {
  // Log non-secret info for developers
  console.log('[Supabase config]', {
    SUPABASE_URL,
    hasAnonKey: Boolean(SUPABASE_ANON),
  });
}
