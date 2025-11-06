import { useEffect, useState } from 'react';
import type { JSX } from 'react';
import { getSupabase } from '../lib/supabaseClient';

type Photo = { name: string; publicUrl: string };

export default function PhotoGallery(): JSX.Element {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const supabase = getSupabase();
        const { data, error: listError } = await supabase.storage
          .from('photos')
          .list('public', {
            limit: 100,
            offset: 0,
            sortBy: { column: 'created_at', order: 'desc' },
          });
        if (listError) throw listError;
        const resolved = (data ?? []).map((entry) => {
          const { data: publicUrlData } = supabase.storage
            .from('photos')
            .getPublicUrl(`public/${entry.name}`);
          return { name: entry.name, publicUrl: publicUrlData.publicUrl };
        });
        setPhotos(resolved);
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Could not load photos.';
        console.error('Photo gallery load failed', message);
        setError('Could not load photos.');
      } finally {
        setLoading(false);
      }
    }
    void load();
  }, []);

  if (loading) {
    return <p>Loading photos...</p>;
  }

  if (error) {
    return <p>Could not load photos.</p>;
  }

  if (photos.length === 0) {
    return <p>No photos yet.</p>;
  }

  return (
    <div
      style={{
        display: 'grid',
        gap: 12,
        gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
      }}
    >
      {photos.map((photo) => (
        <figure key={photo.name} style={{ margin: 0 }}>
          <img
            src={photo.publicUrl}
            alt={photo.name}
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
  );
}
