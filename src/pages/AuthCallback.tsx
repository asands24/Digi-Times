import { studioDestination } from '../lib/studioDestination';
import { useEffect, useState, type JSX } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';

export default function AuthCallback(): JSX.Element {
  const navigate = useNavigate();
  const [message, setMessage] = useState('Finishing sign-in…');

  useEffect(() => {
    let active = true;
    let redirectTimer: ReturnType<typeof setTimeout> | undefined;

    const finalizeAuth = async () => {
      try {
        // The client detects and consumes the callback URL during initialization.
        const { data, error } = await supabase.auth.getSession();
        if (error) {
          throw error;
        }
        if (!data.session) throw new Error('Sign-in could not be completed. Please request a new link.');
        if (!active) return;
        setMessage('Signed in. Redirecting…');
        redirectTimer = setTimeout(() => navigate(studioDestination(new URLSearchParams(window.location.search).get('next')), { replace: true }), 600);
      } catch (error: unknown) {
        if (!active) return;
        const msg =
          error instanceof Error
            ? error.message
            : 'Sign-in failed. You can request a new link.';
        setMessage(msg);
        redirectTimer = setTimeout(() => navigate('/login', { replace: true }), 1500);
      }
    };

    void finalizeAuth();

    return () => {
      active = false;
      if (redirectTimer) {
        clearTimeout(redirectTimer);
      }
    };
  }, [navigate]);

  return (
    <div
      className="container"
      style={{
        padding: '4rem 1rem',
        minHeight: '60vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <div className="card" style={{ width: '100%', maxWidth: 420, textAlign: 'center' }}>
        <p>{message}</p>
      </div>
    </div>
  );
}
