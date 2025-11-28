import { SUPABASE_URL, SUPABASE_ANON } from './config';

const PROJECT_REF = 'irxpqhxrylaxfdppnwra';
const AUTH_KEY = `sb-${PROJECT_REF}-auth-token`;

type SupaMethod = 'GET' | 'POST' | 'PATCH' | 'DELETE';

/**
 * Retrieves the Supabase access token from localStorage.
 * Returns null if not found or invalid.
 */
export function getAccessToken(): string | null {
  if (typeof window === 'undefined') return null;
  
  try {
    const raw = localStorage.getItem(AUTH_KEY);
    if (!raw) return null;
    
    const parsed = JSON.parse(raw);
    return parsed?.access_token ?? null;
  } catch (e) {
    console.error('[supaRest] Failed to parse auth token', e);
    return null;
  }
}

/**
 * Helper to build headers for Supabase REST requests.
 */
function buildHeaders(extra?: Record<string, string>) {
  const token = getAccessToken();
  return {
    'apikey': SUPABASE_ANON,
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    ...extra,
  };
}

/**
 * Makes a raw REST request to Supabase, bypassing the JS client.
 */
export async function supaRest<T>(
  method: SupaMethod,
  path: string, // e.g. '/rest/v1/story_archives'
  init: RequestInit = {},
): Promise<T> {
  // Debug logging (only in development)
  if (process.env.NODE_ENV === 'development') {
    console.log(`[supaRest] 🌐 ${method} ${path}`);
  }

  const url = `${SUPABASE_URL}${path}`;
  
  const res = await fetch(url, {
    method,
    ...init,
    headers: buildHeaders(init.headers as Record<string, string> | undefined),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Supabase REST error ${res.status}: ${text}`);
  }

  // Handle empty responses (e.g. 204 No Content)
  if (res.status === 204) {
    return {} as T;
  }

  return (await res.json()) as T;
}
