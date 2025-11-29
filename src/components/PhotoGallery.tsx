import { useCallback, useEffect, useState } from 'react';
import type { JSX } from 'react';
import { supaRest } from '../lib/supaRest';
import { publicPhotoUrl } from '../lib/storage';
import { Button } from './ui/button';

type Photo = { name: string; publicUrl: string };
type StorageObject = { name: string };
const STORAGE_LIST_TIMEOUT_MS = 10000;

export default function PhotoGallery(): JSX.Element {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchPhotos = useCallback(async () => {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort('Listing photos timed out'), STORAGE_LIST_TIMEOUT_MS);

    try {
      setLoading(true);
      setError(null);

      // Use REST API to avoid occasional hangs in the JS client when listing storage objects
      const response = await supaRest<StorageObject[]>('POST', '/storage/v1/object/list/photos', {
        body: JSON.stringify({
          prefix: 'anonymous',
          limit: 100,
          offset: 0,
          sortBy: { column: 'updated_at', order: 'desc' },
        }),
        signal: controller.signal,
      });

      const resolved = (response ?? [])
        .filter((entry) => Boolean(entry.name))
        .map((entry) => {
          const path = `anonymous/${entry.name}`;
          return { name: entry.name, publicUrl: publicPhotoUrl(path) };
        });
      setPhotos(resolved);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Could not load photos.';
      console.error('Photo gallery load failed', message);
      if (message.includes('timed out')) {
        setError('Photo loading is taking too long. Please try again.');
      } else {
        setError('We could not load the latest photos right now. Please try again.');
      }
    } finally {
      clearTimeout(timeout);
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
