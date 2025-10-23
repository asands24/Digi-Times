import { createClient } from '@supabase/supabase-js';

const resolveEnvVar = (key: string): string | undefined => {
  if (typeof process !== 'undefined' && process.env?.[key]) {
    return process.env[key];
  }

  if (typeof import.meta !== 'undefined' && (import.meta as any).env?.[key]) {
    return (import.meta as any).env[key];
  }

  if (typeof window !== 'undefined' && (window as any).__env?.[key]) {
    return (window as any).__env[key];
  }

  return undefined;
};

const supabaseUrl =
  resolveEnvVar('NEXT_PUBLIC_SUPABASE_URL') ??
  resolveEnvVar('REACT_APP_SUPABASE_URL') ??
  resolveEnvVar('VITE_SUPABASE_URL');
const supabaseAnonKey =
  resolveEnvVar('NEXT_PUBLIC_SUPABASE_ANON_KEY') ??
  resolveEnvVar('REACT_APP_SUPABASE_ANON_KEY') ??
  resolveEnvVar('VITE_SUPABASE_ANON_KEY');

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Missing Supabase environment variables. Ensure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are defined.'
  );
}

if (process.env.NODE_ENV !== 'test') {
  console.info('✅ Supabase client initialized');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
