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
        created_at: new Date().toISOString(),
      })),
    [],
  );

  const [rows, setRows] = useState<TemplateRow[]>([]);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setErr(null);
      try {
        const data = await fetchAllTemplates();
        if (cancelled) {
          return;
        }
        if (data && data.length > 0) {
          setRows(data);
          setErr(null);
        } else {
          setRows(staticRows);
          if (staticRows.length === 0) {
            setErr('No templates available right now.');
          } else {
            setErr('Showing featured templates while Supabase loads.');
          }
        }
      } catch (e: unknown) {
        if (cancelled) {
          return;
        }
        const message = e instanceof Error ? e.message : String(e);
        console.error('Templates load failed:', message);
        setRows(staticRows);
        if (staticRows.length === 0) {
          setErr('No templates available right now.');
        } else {
          setErr('Showing featured templates while Supabase loads.');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }
    void load();

    return () => {
      cancelled = true;
    };
  }, [staticRows]);

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
          {loading ? (
            <div className="template-gallery__notice">Loading templates…</div>
          ) : err ? (
            <div className="template-gallery__notice">{err}</div>
          ) : null}
        </header>
        {loading ? (
          <div className="template-gallery__empty">Loading templates…</div>
        ) : rows.length === 0 ? (
          <div className="template-gallery__empty">
            <p>No templates available right now.</p>
          </div>
        ) : (
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
                  <span
                    style={{ fontSize: 12, letterSpacing: '0.12em', textTransform: 'uppercase' }}
                  >
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
        )}
      </div>
    </section>
  );
}
