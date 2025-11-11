import React, { useEffect, useState } from 'react';
import { fetchAllTemplates, type TemplateRow } from '../lib/templates';

export default function Templates() {
  const [rows, setRows] = useState<TemplateRow[] | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const data = await fetchAllTemplates();
        setRows(data ?? []);
      } catch (e: unknown) {
        const message = e instanceof Error ? e.message : String(e);
        console.error('Templates load failed:', message);
        setErr('Could not load templates.');
      } finally {
        setLoading(false);
      }
    }
    void load();
  }, []);

  if (loading) return <p>Loading templates...</p>;
  if (err) return <p>Could not load templates.</p>;
  if (!rows || rows.length === 0) return <p>No public templates yet.</p>;

  return (
    <ul>
      {rows.map((t) => (
        <li key={t.id}>
          <strong>{t.title}</strong>
          <div>
            <small>{t.slug}</small>
          </div>
        </li>
      ))}
    </ul>
  );
}
