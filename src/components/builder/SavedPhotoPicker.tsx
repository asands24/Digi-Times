import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { fetchStoryRows, type ArchiveItem } from '../../hooks/useStoryLibrary';
import { storyPhotos, validatePhoto } from '../../lib/storyPhotos';
import { Button } from '../ui/button';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '../ui/dialog';

export interface ReusablePhoto { path: string; url: string; title: string; facts: string; }
export interface ReusedPhoto extends ReusablePhoto { file: File; }
export function reusablePhotos(rows: ArchiveItem[], userId: string): ReusablePhoto[] {
  const seen = new Set<string>();
  return rows.filter(row => row.created_by === userId && !row.isSample).flatMap(row => {
    const stored = row.images?.length ? row.images : row.image_path ? [{ path: row.image_path }] : [];
    return stored.flatMap(photo => {
      if (!photo.path.startsWith(`stories/${userId}/`) || photo.path.includes('..') || seen.has(photo.path)) return [];
      seen.add(photo.path);
      return [{ path: photo.path, url: storyPhotos({ images: [photo] })[0].url, title: row.title || 'Untitled memory', facts: row.prompt || '' }];
    });
  });
}

export function SavedPhotoPicker({ userId, onClose, onAdd, returnFocus }: { returnFocus: () => void; userId: string; onClose: () => void; onAdd: (photos: ReusedPhoto[]) => void }) {
  const [photos, setPhotos] = useState<ReusablePhoto[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState('');
  const [retryPage, setRetryPage] = useState<number | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const active = useRef(true);
  const controller = useRef<AbortController | null>(null);
  const request = useRef(0);
  const load = async (nextPage = 1) => {
    const version = ++request.current;
    setLoading(true); setError(''); setRetryPage(null);
    const result = await fetchStoryRows(userId, nextPage, 50);
    if (!active.current || request.current !== version) return;
    setLoading(false);
    if (result.error) { setRetryPage(nextPage); setError('Your saved photos could not be loaded. Try again.'); return; }
    const incoming = reusablePhotos(result.rows as ArchiveItem[], userId);
    setPhotos(previous => nextPage === 1 ? incoming : [...previous, ...incoming.filter(photo => !previous.some(item => item.path === photo.path))]);
    setPage(nextPage); setHasMore(result.rows.length === 50);
  };
  useEffect(() => {
    active.current = true; void load();
    return () => { active.current = false; request.current++; controller.current?.abort(); };
  }, [userId]); // Remounted with an account-specific key by the studio.

  const add = async () => {
    if (adding || !selected.length) return;
    setAdding(true); setError(''); setRetryPage(null);
    const abort = new AbortController(); controller.current = abort;
    const timer = setTimeout(() => abort.abort(), 30000);
    try {
      const imported: ReusedPhoto[] = [];
      for (const path of selected) {
        const photo = photos.find(item => item.path === path)!;
        const response = await fetch(photo.url, { signal: abort.signal, credentials: 'omit' });
        if (!response.ok) throw new Error('Photo unavailable');
        const blob = await response.blob();
        const file = new File([blob], path.split('/').pop() || 'saved-photo', { type: blob.type });
        validatePhoto(file);
        imported.push({ ...photo, file });
      }
      if (active.current) { onAdd(imported); onClose(); }
    } catch {
      if (active.current) setError('A selected photo could not be opened. Your selection and studio drafts are kept. Retry, or deselect an unavailable photo.');
    } finally { clearTimeout(timer); if (active.current) setAdding(false); }
  };
  return <Dialog open onOpenChange={open => { if (!open) onClose(); }}><DialogContent className="saved-photo-picker" onCloseAutoFocus={event => { event.preventDefault(); returnFocus(); }}>
    <DialogTitle>Choose saved photos</DialogTitle>
    <DialogDescription>Start a fresh story with photos you already saved. Select up to 20 in the order you want; your original stories stay in the library.</DialogDescription>
    {error && <p role="alert">{error} <Button variant="outline" disabled={loading || adding} onClick={() => { if (retryPage !== null) void load(retryPage); else void add(); }}>Retry</Button></p>}
    {loading && <p role="status">Loading saved photos…</p>}
    {!loading && !error && !photos.length && <p>No saved story photos yet. Save a story first, or upload new photos in the studio.</p>}
    <div className="saved-photo-picker__grid">{photos.map((photo, index) => <label key={photo.path}>
      <img src={photo.url} alt={`Photo ${index + 1} from ${photo.title}`} loading="lazy" />
      <span><input type="checkbox" aria-label={`Select photo ${index + 1} from ${photo.title}`} checked={selected.includes(photo.path)} disabled={adding || (!selected.includes(photo.path) && selected.length >= 20)} onChange={event => setSelected(previous => event.target.checked ? [...previous, photo.path] : previous.filter(path => path !== photo.path))} />{photo.title}</span>
      {selected.includes(photo.path) && <small>Selected {selected.indexOf(photo.path) + 1}</small>}
    </label>)}</div>
    {hasMore && <Button variant="outline" disabled={loading || adding} onClick={() => void load(page + 1)}>Load more saved photos</Button>}
    <p>Want the same articles in a new issue? <Link to="/library" target="_blank" rel="noopener noreferrer">Choose saved stories in your library →<span className="sr-only"> (opens a new tab)</span></Link></p>
    <div className="saved-photo-picker__actions"><Button variant="outline" onClick={onClose}>Cancel</Button><Button disabled={loading || adding || !selected.length} onClick={() => void add()}>{adding ? 'Opening photos…' : `Use ${selected.length} ${selected.length === 1 ? 'photo' : 'photos'}`}</Button></div>
  </DialogContent></Dialog>;
}
