import { SUPABASE_URL, SUPABASE_ANON } from './config';

const PROJECT_REF = 'irxpqhxrylaxfdppnwra';
const AUTH_KEY = `sb-${PROJECT_REF}-auth-token`;

type SupaMethod = 'GET' | 'POST' | 'PATCH' | 'DELETE' | 'HEAD';

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
function buildHeaders(method: SupaMethod, extra?: Record<string, string>) {
  const token = getAccessToken();
  const headers: Record<string, string> = {
    'apikey': SUPABASE_ANON,
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    ...extra,
  };

  if (method !== 'GET' && method !== 'HEAD') {
    headers['Content-Type'] = 'application/json';
  }

  return headers;
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
    headers: buildHeaders(method, init.headers as Record<string, string> | undefined),
  });

  if (!res.ok) {
    const text = await res.text();
    
    // Enhanced error classification
    if (res.status === 401 || res.status === 403) {
      throw new Error('Please log in again to continue.');
    }
    if (res.status === 429) {
      throw new Error('Too many requests. Please wait a moment.');
    }
    if (res.status >= 500) {
      throw new Error('Our servers are having trouble. Please try again later.');
    }

    throw new Error(`Supabase REST error ${res.status}: ${text}`);
  }

  // Handle empty responses (e.g. 204 No Content)
  if (res.status === 204) {
    return {} as T;
  }

  const text = await res.text();
  if (!text) {
    return {} as T;
  }

  try {
    return JSON.parse(text) as T;
  } catch (e) {
    console.error('[supaRest] Failed to parse JSON', e);
    throw new Error('Invalid JSON response from server');
  }
}
