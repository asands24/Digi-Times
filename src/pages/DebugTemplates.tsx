import { useEffect, useState } from 'react';
import { fetchAllTemplates, type TemplateRow } from '../lib/templates';
import { groupTemplates } from '../data/templates';
import { formatSupabaseError } from '../utils/errorMessage';

export default function DebugTemplates() {
  const [rows, setRows] = useState<TemplateRow[] | null>(null);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      setFetchError(null);
      try {
        const data = await fetchAllTemplates();
        if (cancelled) {
          return;
        }
        setRows(data);
      } catch (error) {
        if (cancelled) {
          return;
        }
        setRows([]);
        setFetchError(formatSupabaseError(error));
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void load();

    return () => {
      cancelled = true;
    };
  }, []);

  const supabaseCount = rows?.length ?? 0;
  const fallbackCount = groupTemplates.length;
  const supabasePreview = rows?.slice(0, 3) ?? [];
  const fallbackPreview = groupTemplates.slice(0, 3);

  return (
    <section className="container" style={{ padding: '2rem 1rem' }}>
      <header style={{ marginBottom: '1.5rem' }}>
        <h1>Template Debugger</h1>
        <p>
          Inspect the raw Supabase payload, featured fallback data, and any error message to confirm
          what the app sees while loading templates.
        </p>
      </header>

      <div style={{ display: 'grid', gap: '1rem', marginBottom: '2rem' }}>
        <div style={{ background: 'var(--surface-muted, #f4f4f4)', padding: '1rem', borderRadius: 8 }}>
          <strong>Loading:</strong> {loading ? 'Yes' : 'No'}
        </div>
        <div style={{ background: 'var(--surface-muted, #f4f4f4)', padding: '1rem', borderRadius: 8 }}>
          <strong>Supabase templates:</strong> {supabaseCount}
        </div>
        <div style={{ background: 'var(--surface-muted, #f4f4f4)', padding: '1rem', borderRadius: 8 }}>
          <strong>Fallback featured templates:</strong> {fallbackCount}
        </div>
        <div style={{ background: 'var(--surface-muted, #f4f4f4)', padding: '1rem', borderRadius: 8 }}>
          <strong>Supabase error:</strong> {fetchError ?? 'None'}
        </div>
      </div>

      <div style={{ display: 'grid', gap: '1.5rem' }}>
        <div>
          <h2 style={{ fontSize: '1rem', marginBottom: '0.5rem' }}>Supabase preview (first 3)</h2>
          <pre
            style={{
              background: '#111',
              color: '#f7f7f7',
              padding: '1rem',
              borderRadius: 8,
              overflowX: 'auto',
            }}
          >
            {supabasePreview.length > 0
              ? JSON.stringify(supabasePreview, null, 2)
              : 'No Supabase templates returned.'}
          </pre>
        </div>

        <div>
          <h2 style={{ fontSize: '1rem', marginBottom: '0.5rem' }}>Fallback preview (first 3)</h2>
          <pre
            style={{
              background: '#111',
              color: '#f7f7f7',
              padding: '1rem',
              borderRadius: 8,
              overflowX: 'auto',
            }}
          >
            {JSON.stringify(fallbackPreview, null, 2)}
          </pre>
        </div>
      </div>
    </section>
  );
}
