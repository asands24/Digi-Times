import { Handler } from '@netlify/functions';
import { createClient } from '@supabase/supabase-js';

export const handler: Handler = async () => {
  try {
    const url =
      process.env.REACT_APP_SUPABASE_URL ||
      process.env.NEXT_PUBLIC_SUPABASE_URL;
    const anon =
      process.env.REACT_APP_SUPABASE_ANON_KEY ||
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!url || !anon) {
      throw new Error('Missing Supabase env vars');
    }

    const supabase = createClient(url, anon);
    const { data, error } = await supabase.from('photos').select('id').limit(1);
    if (error) throw error;

    return {
      statusCode: 200,
      body: JSON.stringify({ ok: true, sample: data?.length ?? 0 }),
    };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'unknown error';
    return {
      statusCode: 500,
      body: JSON.stringify({ ok: false, error: message }),
    };
  }
};
