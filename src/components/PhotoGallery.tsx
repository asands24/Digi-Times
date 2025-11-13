import { useCallback, useEffect, useState } from 'react';
import type { JSX } from 'react';
import { getSupabase } from '../lib/supabaseClient';
import { publicPhotoUrl } from '../lib/storage';
import { Button } from './ui/button';

type Photo = { name: string; publicUrl: string };

export default function PhotoGallery(): JSX.Element {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchPhotos = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const supabase = getSupabase();
      const { data, error: listError } = await supabase.storage
        .from('photos')
        .list('anonymous', {
          limit: 100,
          offset: 0,
          sortBy: { column: 'created_at', order: 'desc' },
        });
      if (listError) throw listError;
      const resolved = (data ?? []).map((entry) => {
        const path = `anonymous/${entry.name}`;
        return { name: entry.name, publicUrl: publicPhotoUrl(path) };
      });
      setPhotos(resolved);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Could not load photos.';
      console.error('Photo gallery load failed', message);
      setError('We could not load the latest photos right now. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchPhotos();
  }, [fetchPhotos]);

  const handleRetry = () => {
    void fetchPhotos();
  };

  const renderMessage = (message: string, action?: JSX.Element) => (
    <section className="container" style={{ padding: '2rem 1rem' }}>
      <div className="card" style={{ textAlign: 'center' }}>
        <p className="muted">{message}</p>
        {action ?? null}
      </div>
    </section>
  );

  if (loading) {
    return renderMessage('Loading photos…');
  }

  if (error) {
    return renderMessage(
      error,
      <Button type="button" variant="outline" onClick={handleRetry} style={{ marginTop: '1rem' }}>
        Try again
      </Button>,
    );
  }

  if (photos.length === 0) {
    return renderMessage('No photos yet.');
  }

  return (
    <section className="container" style={{ padding: '2rem 1rem' }}>
      <div className="card">
        <div
          className="grid"
          style={{
            gap: 12,
            gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
          }}
        >
          {photos.map((photo) => (
            <figure key={photo.name} style={{ margin: 0 }}>
              <img
                src={photo.publicUrl}
                alt={photo.name}
                loading="lazy"
                decoding="async"
                style={{
                  width: '100%',
                  height: 160,
                  objectFit: 'cover',
                  borderRadius: 8,
                }}
              />
              <figcaption style={{ fontSize: 12, opacity: 0.7 }}>
                {photo.name}
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}
