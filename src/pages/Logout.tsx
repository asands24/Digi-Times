import React, { useEffect } from 'react';
import { getSupabase } from '../lib/supabaseClient';

export default function Logout() {
  useEffect(() => {
    try {
      const supabase = getSupabase();
      supabase.auth.signOut().finally(() => {
        window.location.href = '/';
      });
    } catch (error) {
      window.location.href = '/';
    }
  }, []);

  return <p>Signing out…</p>;
}
