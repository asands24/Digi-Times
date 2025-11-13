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

  const renderMessage = (message: string) => (
    <section className="container" style={{ padding: '2rem 1rem' }}>
      <div className="card">
        <p className="muted" style={{ margin: 0 }}>
          {message}
        </p>
      </div>
    </section>
  );

  if (loading) return renderMessage('Loading templates…');
  if (err) return renderMessage('Could not load templates.');
  if (!rows || rows.length === 0) return renderMessage('No public templates yet.');

  return (
    <section className="container" style={{ padding: '2rem 1rem' }}>
      <div className="card">
        <h1 className="h1" style={{ fontSize: 32 }}>
          Public Templates
        </h1>
        <div className="grid cols-2" style={{ gap: '1.5rem' }}>
          {rows.map((t) => (
            <article
              key={t.id}
              style={{
                border: '1px solid #e5e7eb',
                borderRadius: 12,
                padding: '1rem',
              }}
            >
              <h2 className="h2" style={{ margin: '0 0 0.35rem', fontSize: 20 }}>
                {t.title}
              </h2>
              <p className="muted" style={{ margin: 0 }}>
                <span style={{ fontSize: 12, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                  Slug
                </span>
                <br />
                <span>{t.slug ?? '—'}</span>
              </p>
              {t.is_system ? (
                <span
                  style={{
                    display: 'inline-block',
                    marginTop: 8,
                    fontSize: 12,
                    padding: '2px 8px',
                    borderRadius: 999,
                    background: '#e0f2fe',
                    color: '#0369a1',
                  }}
                >
                  System template
                </span>
              ) : null}
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
