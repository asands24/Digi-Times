import React from 'react';
import { getSupabase } from '../lib/supabaseClient';

export default function DemoLoginButton() {
  async function handleLogin() {
    let supabase;
    try {
      supabase = getSupabase();
    } catch (error) {
      alert('Supabase is not configured.');
      return;
    }

    const email = process.env.REACT_APP_DEMO_EMAIL;
    const password = process.env.REACT_APP_DEMO_PASSWORD;
    if (!email || !password) {
      alert('Demo credentials are not configured.');
      return;
    }
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) alert(error.message);
  }

  return (
    <button onClick={handleLogin} className="btn">
      Sign in as Demo
    </button>
  );
}
