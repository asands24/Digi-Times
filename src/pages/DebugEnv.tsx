import React from 'react';

export default function DebugEnv() {
  const hasUrl = Boolean(process.env.REACT_APP_SUPABASE_URL);
  const hasAnon = Boolean(process.env.REACT_APP_SUPABASE_ANON_KEY);
  return (
    <pre>{JSON.stringify({ HAS_URL: hasUrl, HAS_ANON: hasAnon }, null, 2)}</pre>
  );
}
