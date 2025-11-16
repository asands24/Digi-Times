import React, { useEffect, useMemo, useState } from 'react';
import { fetchAllTemplates, type TemplateRow } from '../lib/templates';
import { groupTemplates } from '../data/templates';

export default function Templates() {
  const staticRows = useMemo<TemplateRow[]>(
    () =>
      groupTemplates.map((template, index) => ({
        id: template.id ?? `featured-${index}`,
        slug: template.name ?? template.title ?? `template-${index}`,
        title: template.title ?? template.name ?? 'Featured Template',
        html: '',
        css: '',
        is_system: true,
        created_at: null,
      })),
    [],
  );

  const [rows, setRows] = useState<TemplateRow[] | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const data = await fetchAllTemplates();
        if (!data || data.length === 0) {
          setRows(staticRows);
        } else {
          setRows(data);
        }
      } catch (e: unknown) {
        const message = e instanceof Error ? e.message : String(e);
        console.error('Templates load failed:', message);
        setRows(staticRows);
        setErr(null);
      } finally {
        setLoading(false);
      }
    }
    void load();
  }, [staticRows]);

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
    <section className="container" style={{ padding: '2.5rem 1rem' }}>
      <div className="template-gallery template-gallery--page">
        <header className="template-gallery__heading">
          <div>
            <h1 className="template-gallery__title">Public Templates</h1>
            <p>
              Explore featured newsroom layouts curated by DigiTimes editors. Pick a template to
              inspire your next edition.
            </p>
          </div>
        </header>
        <div className="template-gallery__grid template-gallery__grid--page">
          {rows.map((t) => (
            <article
              key={t.id}
              className="template-card template-card--static"
              aria-label={`Template ${t.title}`}
            >
              <div className="template-card__badge">Featured layout</div>
              <h2 className="template-card__title">{t.title}</h2>
              <p className="template-card__body">
                <span style={{ fontSize: 12, letterSpacing: '0.12em', textTransform: 'uppercase' }}>
                  Slug
                </span>
                <br />
                <span>{t.slug ?? '—'}</span>
              </p>
              {t.is_system ? (
                <span className="template-card__badge" style={{ color: 'var(--ink-muted)' }}>
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
