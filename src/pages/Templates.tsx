import React, { useEffect, useState } from 'react';
import { getSupabase } from '../lib/supabaseClient';

type TemplateRow = {
  id: string;
  name: string;
  description?: string | null;
  is_public: boolean;
  created_by?: string | null;
  inserted_at?: string | null;
};

export default function Templates() {
  const [rows, setRows] = useState<TemplateRow[] | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function run() {
      try {
        const supabase = getSupabase();
        const { data, error } = await supabase
          .from('templates')
          .select('id,name,description,is_public,created_by,inserted_at')
          .eq('is_public', true)
          .order('inserted_at', { ascending: false })
          .limit(20);
        if (error) throw error;
        setRows(data ?? []);
      } catch (e: any) {
        console.error('Templates load failed:', e?.message || e);
        setErr(e?.message || 'Could not load templates.');
      } finally {
        setLoading(false);
      }
    }
    void run();
  }, []);

  if (loading) return <p>Loading templates…</p>;
  if (err) return <p>Could not load templates.</p>;
  if (!rows || rows.length === 0) return <p>No public templates yet.</p>;

  return (
    <ul>
      {rows.map((t) => <li key={t.id}>{t.name}</li>)}
    </ul>
  );
}
