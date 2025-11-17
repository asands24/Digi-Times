import React, { useEffect, useState } from 'react';
import { fetchAllTemplates } from '../lib/templates';
import type { StoryTemplate } from '../types/story';

export default function Templates() {
  const [rows, setRows] = useState<StoryTemplate[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const data = await fetchAllTemplates();
        if (!cancelled) {
          setRows(data);
        }
      } catch (e) {
        if (cancelled) {
          return;
        }
        if (process.env.NODE_ENV === 'development') {
          console.error('Templates load failed:', e);
        }
        setRows([]);
        setError('No templates available right now. Please try again later.');
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
  }, []);

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
          ) : error ? (
            <div className="template-gallery__notice">{error}</div>
          ) : null}
        </header>
        {loading ? (
          <div className="template-gallery__empty">Loading templates…</div>
        ) : rows.length === 0 ? (
          <div className="template-gallery__empty">
            <p>{error ?? 'No templates available right now.'}</p>
          </div>
        ) : (
          <div className="template-gallery__grid template-gallery__grid--page">
            {rows.map((t) => (
              <article
                key={t.id}
                className="template-card template-card--static"
                aria-label={`Template ${t.title}`}
              >
                <div className="template-card__badge">
                  {t.isSystem ? 'Featured layout' : 'Personal layout'}
                </div>
                <h2 className="template-card__title">{t.title}</h2>
                <p className="template-card__body">
                  {t.description ?? 'Press-ready layout for your next edition.'}
                </p>
                <p className="template-card__body">
                  <span
                    style={{ fontSize: 12, letterSpacing: '0.12em', textTransform: 'uppercase' }}
                  >
                    Slug
                  </span>
                  <br />
                  <span>{t.slug || '—'}</span>
                </p>
              </article>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
