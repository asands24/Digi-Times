import { createClient } from '@supabase/supabase-js';
import { config as loadEnv } from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import type { Database } from '../src/types/supabase';

// Always load from repo root
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const envLocalPath = path.join(rootDir, '.env.local');
const envPath = path.join(rootDir, '.env');

// Prefer .env.local if present
if (fs.existsSync(envLocalPath)) {
  loadEnv({ path: envLocalPath });
  console.log('[dotenv] Loaded .env.local');
} else if (fs.existsSync(envPath)) {
  loadEnv({ path: envPath });
  console.log('[dotenv] Loaded .env');
} else {
  console.warn('[dotenv] No .env files found in project root');
}

// Validate required env vars
function required(name: string) {
  const v = (process.env[name] ?? '').trim();
  if (!v) throw new Error(`Missing env: ${name}`);
  return v;
}

const supabaseUrl =
  process.env.REACT_APP_SUPABASE_URL?.trim() ||
  required('REACT_APP_SUPABASE_URL');

const supabaseAnonKey =
  process.env.REACT_APP_SUPABASE_ANON_KEY?.trim() ||
  required('REACT_APP_SUPABASE_ANON_KEY');

// Decode JWT payload to verify project ref match + public key usage
function decodePayload(jwt: string) {
  const parts = jwt.split('.');
  if (parts.length < 2) throw new Error('Invalid anon key format');
  const json = Buffer.from(parts[1].replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('utf8');
  return JSON.parse(json);
}

try {
  const payload = decodePayload(supabaseAnonKey);
  
  // Handle standard Supabase keys where iss is "supabase"
  let refFromKey;
  if (payload.iss === 'supabase') {
    refFromKey = payload.ref;
  } else {
    // Legacy or custom keys where iss might be a URL
    refFromKey = (payload.iss || '').split('//')[1]?.split('.')[0];
  }

  const refFromUrl = new URL(supabaseUrl).host.split('.')[0];
  
  if (!refFromKey) {
    // If we can't extract a ref, just warn but don't fail, 
    // as formats can change.
    console.warn('[dotenv] Warning: Could not extract project ref from Anon Key for validation.');
  } else if (refFromKey !== refFromUrl) {
    throw new Error(`Anon key project ref (${refFromKey}) does not match URL ref (${refFromUrl})`);
  }

  const role = String(payload.role || payload['x-supabase-role'] || '').toLowerCase();
  if (role.includes('service')) {
    throw new Error('Do not use service_role key in smoke scripts — use public anon key');
  }
} catch (e: any) {
  throw new Error(`Supabase env validation failed: ${e.message}`);
}

export function getSupabase() {
  return createClient<Database>(supabaseUrl, supabaseAnonKey);
}

export async function signInSmoke(supabase: ReturnType<typeof createClient>) {
  const email = required('SMOKE_TEST_EMAIL');
  const password = required('SMOKE_TEST_PASSWORD');
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw new Error(`Smoke sign-in failed: ${error.message}`);
  return data.user!;
}
