// Verify the caller with Supabase Auth; never trust a decoded JWT or a client user ID.
exports.authorizeStoryGeneration = async event => {
  const authorization = Object.entries(event.headers || {}).find(([name]) => name.toLowerCase() === 'authorization')?.[1];
  if (typeof authorization !== 'string' || !/^Bearer \S+$/i.test(authorization)) return 401;
  const url = process.env.SUPABASE_URL || process.env.REACT_APP_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_ANON_KEY || process.env.REACT_APP_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return 503;
  try {
    const response = await fetch(`${url.replace(/\/$/, '')}/auth/v1/user`, {
      headers: { apikey: key, Authorization: authorization }, signal: AbortSignal.timeout(8000),
    });
    if (response.status === 401 || response.status === 403) return 401;
    if (!response.ok) return 503;
    const user = await response.json();
    return typeof user.id === 'string' && user.id && !user.is_anonymous ? 200 : 401;
  } catch { return 503; }
};
