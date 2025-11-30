import { useCallback, useEffect, useState } from 'react';
import type { JSX } from 'react';
import { Trash2 } from 'lucide-react';
import { supaRest } from '../lib/supaRest';
import { publicPhotoUrl } from '../lib/storage';
import { Button } from './ui/button';
import { useAuth } from '../providers/AuthProvider';
import toast from 'react-hot-toast';

type Photo = { name: string; publicUrl: string };
type StorageObject = { name: string };
const STORAGE_LIST_TIMEOUT_MS = 10000;

export default function PhotoGallery(): JSX.Element {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const fetchPhotos = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort('Listing photos timed out'), STORAGE_LIST_TIMEOUT_MS);

    try {
      setLoading(true);
      setError(null);

      // Fetch user-specific story images from stories/{userId}/ folder
      const response = await supaRest<StorageObject[]>('POST', '/storage/v1/object/list/photos', {
        body: JSON.stringify({
          prefix: `stories/${user.id}`,
          limit: 100,
          offset: 0,
          sortBy: { column: 'updated_at', order: 'desc' },
        }),
        signal: controller.signal,
      });

      const resolved = (response ?? [])
        .filter((entry) => Boolean(entry.name))
        .map((entry) => {
          const path = `stories/${user.id}/${entry.name}`;
          return { name: entry.name, publicUrl: publicPhotoUrl(path) };
        });
      setPhotos(resolved);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Could not load photos.';
      console.error('Photo gallery load failed', message);
      if (message.includes('timed out')) {
        setError('Photo loading is taking too long. Please try again.');
      } else {
        setError('We could not load your photos right now. Please try again.');
      }
    } finally {
      clearTimeout(timeout);
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    void fetchPhotos();
  }, [fetchPhotos]);

  const handleRetry = () => {
    void fetchPhotos();
  };

  const handleDelete = async (photoName: string) => {
    if (!user) return;
    if (!window.confirm('Are you sure you want to delete this photo? This cannot be undone.')) {
      return;
    }

    // Optimistic update
    const previousPhotos = [...photos];
    setPhotos((prev) => prev.filter((p) => p.name !== photoName));

    try {
      await supaRest('DELETE', `/storage/v1/object/photos/stories/${user.id}/${photoName}`);
      toast.success('Photo deleted');
    } catch (err) {
      console.error('Failed to delete photo', err);
      toast.error('Could not delete photo');
      // Rollback
      setPhotos(previousPhotos);
    }
  };

  const renderMessage = (message: string, action?: JSX.Element) => (
    <section className="container" style={{ padding: '2rem 1rem' }}>
      <div className="card" style={{ textAlign: 'center' }}>
        <p className="muted">{message}</p>
        {action ?? null}
      </div>
    </section>
  );

  if (!user) {
    return renderMessage('Please log in to view your story images.');
  }

  if (loading) {
    return renderMessage('Loading your photos…');
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
    return renderMessage('No story images yet. Create a story to see your photos here!');
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
            <figure key={photo.name} className="group relative" style={{ margin: 0 }}>
              <div className="relative aspect-square overflow-hidden rounded-lg">
                <img
                  src={photo.publicUrl}
                  alt={photo.name}
                  loading="lazy"
                  decoding="async"
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-200" />
                <button
                  onClick={() => handleDelete(photo.name)}
                  className="absolute top-2 right-2 p-2 bg-white/90 rounded-full shadow-sm opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:bg-red-50 hover:text-red-600"
                  title="Delete photo"
                >
                  <Trash2 size={16} />
                </button>
              </div>
              <figcaption className="mt-2 text-xs text-ink-muted truncate px-1">
                {photo.name}
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}
