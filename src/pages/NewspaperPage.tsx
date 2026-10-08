import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Printer, Save, Download, Calendar, Share2 } from 'lucide-react';
import { Button } from '../components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '../components/ui/dialog';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { supabase } from '../lib/supabaseClient';
import { supaRest } from '../lib/supaRest';
import { createIssue, fetchIssueById } from '../lib/storiesApi';
import { storyPhotos } from '../lib/storyPhotos';
import { useAuth } from '../providers/AuthProvider';
import type { Database } from '../types/supabase';
import toast from 'react-hot-toast';
import { exportNewspaperToPDF, waitForEditionImages } from '../lib/pdfExport';
import { EditionPaper } from '../components/EditionPaper';
import { layoutEdition, editionShareUrl, savedEditionSettings, type PaperSize } from '../lib/newspaperLayout';
import { copyToClipboard } from '../utils/clipboard';
import '../styles/newspaper-print.css';

type StoryRow = Database['public']['Tables']['story_archives']['Row'];

interface StoryWithImage extends StoryRow {
  imageUrl: string | null;
  imageUrls: import('../lib/storyPhotos').StoryPhoto[];
}

const STORY_COLUMNS =
  '*';
const UUID_MATCH =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function getPublicImage(path?: string | null) {
  if (!path) {
    return null;
  }
  const { data } = supabase.storage.from('photos').getPublicUrl(path);
  return data?.publicUrl ?? null;
}

export default function NewspaperPage({ reader = false }: { reader?: boolean }) {
  const location = useLocation();
  const { user } = useAuth();
  const [stories, setStories] = useState<StoryWithImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [imageDimensions, setImageDimensions] = useState<Record<string, { width: number; height: number }>>({});
  const [imageState, setImageState] = useState<'loading' | 'ready' | 'error'>('loading');
  const [imageAttempt, setImageAttempt] = useState(0);
  const [isDownloading, setIsDownloading] = useState(false);
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [issueTitle, setIssueTitle] = useState(() => new URLSearchParams(location.search).get('title')?.slice(0, 120) || 'My Daily Edition');
  const [paper, setPaper] = useState<PaperSize>(() => new URLSearchParams(location.search).get('paper') === 'letter' ? 'letter' : 'a4');
  const [shareOpen, setShareOpen] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);
  const [editionDate, setEditionDate] = useState(() => {
    const date = new URLSearchParams(location.search).get('date');
    return date && /^\d{4}-\d{2}-\d{2}$/.test(date) && !Number.isNaN(Date.parse(date)) ? date : new Date().toISOString().slice(0, 10);
  });
  const issueTitleRef = useRef<HTMLInputElement>(null);
  const loadVersion = useRef(0);
  const pendingSave = useRef<{ key: string; requestId: string } | null>(null);

  const [showHistory, setShowHistory] = useState(() => new URLSearchParams(location.search).get('showHistory') !== 'false');

  const ids = useMemo(() => {
    const params = new URLSearchParams(location.search);
    const raw = params.get('ids');
    if (!raw) {
      return [];
    }
    return Array.from(new Set(raw
      .split(',')
      .map((value) => value.trim())
      .filter((value) => UUID_MATCH.test(value))));
  }, [location.search]);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    setIssueTitle(params.get('title')?.slice(0, 120) || 'My Daily Edition');
    setPaper(params.get('paper') === 'letter' ? 'letter' : 'a4');
    setShowHistory(params.get('showHistory') !== 'false');
    const date = params.get('date');
    setEditionDate(date && /^\d{4}-\d{2}-\d{2}$/.test(date) && !Number.isNaN(Date.parse(date)) ? date : new Date().toISOString().slice(0, 10));
  }, [location.search]);

  const loadStories = useCallback(async () => {
    const requestVersion = ++loadVersion.current;
    let targetIds = ids;
    const params = new URLSearchParams(location.search);
    const issueId = params.get('issueId');

    setLoading(true);
    setError(null);
    setNotice(null);

    try {
      // If loading from an issue, fetch the issue first to get story IDs
      if (issueId && !reader) {
        if (!UUID_MATCH.test(issueId)) throw new Error('Invalid issue ID');
        if (process.env.NODE_ENV !== 'production') console.log('[NewspaperPage] 🔍 Fetching issue', issueId);
        const issue = await fetchIssueById(issueId);
        if (requestVersion !== loadVersion.current) return;

        if (!issue) {
          setError('Issue not found or you do not have permission to view it.');
          setStories([]);
          setLoading(false);
          return;
        }

        setIssueTitle(issue.title);
        const settings = savedEditionSettings(issue.description);
        setPaper(settings?.paper || 'a4');
        setShowHistory(settings?.showHistory ?? true);
        setEditionDate(settings?.date || issue.created_at.slice(0, 10));
        // Extract story IDs from the issue's stories, preserving order
        targetIds = issue.stories.map(s => s.id);
      }

      if (targetIds.length === 0) {
        setError('Select at least one story to create a printable page.');
        setStories([]);
        setLoading(false);
        return;
      }

      if (process.env.NODE_ENV !== 'production') console.log('[NewspaperPage] 🔍 Fetching stories (RAW FETCH)', { ids: targetIds });

      // WORKAROUND: Use raw fetch because Supabase client hangs
      const idsParam = `(${targetIds.join(',')})`;
      const data = await supaRest<StoryRow[]>('GET',
        `/rest/v1/story_archives?select=${encodeURIComponent(STORY_COLUMNS)}&id=in.${idsParam}${reader ? '&is_public=eq.true' : ''}`,
        {
          headers: {
            'Prefer': 'count=none'
          }
        }
      );

      if (requestVersion !== loadVersion.current) return;
      if (process.env.NODE_ENV !== 'production') console.log('[NewspaperPage] Raw fetch response', { count: data.length });

      const available = (data ?? []).filter((story: StoryRow) => {
        if (story.is_public) {
          return true;
        }
        if (reader || !user?.id) {
          return false;
        }
        return story.created_by === user.id;
      });

      if (available.length < targetIds.length) {
        setNotice('Some stories could not be loaded (they might be private or deleted).');
      }

      if (available.length === 0) {
        setError('No stories found. They may have been deleted or are private.');
        setStories([]);
        return;
      }

      const withImages = available.map((story: StoryRow) => ({
        ...story,
        imageUrl: getPublicImage(story.image_path),
        imageUrls: storyPhotos(story),
      }));

      // Preserve the requested order
      const orderedStories = targetIds
        .map(id => withImages.find(s => s.id === id))
        .filter((s): s is StoryWithImage => Boolean(s));

      setStories(orderedStories);
    } catch (err) {
      if (requestVersion !== loadVersion.current) return;
      console.error('[NewspaperPage] ❌ Failed to load stories', err);
      setError('Failed to load stories. Please try again.');
    } finally {
      if (requestVersion === loadVersion.current) setLoading(false);
    }
  }, [ids, location.search, user, reader]);

  const invalidateLoad = useCallback(() => { loadVersion.current++; }, []);
  useEffect(() => {
    loadStories();
    return invalidateLoad;
  }, [loadStories, invalidateLoad]);

  useEffect(() => {
    let cancelled = false;
    const urls = Array.from(new Set(stories.flatMap(story => storyPhotos(story).map(photo => photo.url))));
    setImageState(urls.length ? 'loading' : 'ready');
    const cleanups: (() => void)[] = [];
    Promise.all(urls.map(url => new Promise<{ url: string; width: number; height: number }>((resolve, reject) => {
      const image = new Image();
      const cleanup = () => { clearTimeout(timer); image.onload = null; image.onerror = null; };
      const timer = setTimeout(() => { cleanup(); reject(new Error('Photo timed out')); }, 15000);
      cleanups.push(cleanup);
      image.onload = () => { cleanup(); image.naturalWidth && image.naturalHeight ? resolve({ url, width: image.naturalWidth, height: image.naturalHeight }) : reject(new Error('Photo unavailable')); };
      image.onerror = () => { cleanup(); reject(new Error('Photo unavailable')); };
      image.crossOrigin = 'anonymous'; image.src = url;
    }))).then(photos => {
      if (!cancelled) { setImageDimensions(Object.fromEntries(photos.map(photo => [photo.url, { width: photo.width, height: photo.height }]))); setImageState('ready'); }
    }).catch(() => { if (!cancelled) setImageState('error'); });
    return () => { cancelled = true; cleanups.forEach(cleanup => cleanup()); };
  }, [stories, imageAttempt]);

  const editionOptions = useMemo(() => ({ title: issueTitle, paper, showHistory, date: editionDate }), [issueTitle, paper, showHistory, editionDate]);
  const layout = useMemo(() => layoutEdition(stories.map(story => ({ ...story, imageUrls: story.imageUrls.map(photo => ({ ...photo, ...imageDimensions[photo.url] })) })), editionOptions), [stories, editionOptions, imageDimensions]);
  const handlePrint = async () => {
    setIsPrinting(true);
    try {
      const element = document.getElementById('newspaper-content');
      if (!element) return;
      await waitForEditionImages(element);
      window.print();
    } catch (err) { toast.error(err instanceof Error ? err.message : 'Unable to prepare the edition.'); }
    finally { setIsPrinting(false); }
  };

  const handleSaveIssue = () => {
    if (!user) {
      toast.error('You must be logged in to save an issue.');
      return;
    }
    setSaveDialogOpen(true);
  };

  const handleConfirmSaveIssue = async () => {
    if (!user || !issueTitle.trim()) return;
    setSaveDialogOpen(false);
    setIsSaving(true);
    try {
      const key = JSON.stringify({ title: issueTitle.trim(), ids: stories.map(story => story.id), paper, showHistory, editionDate });
      if (pendingSave.current?.key !== key) pendingSave.current = { key, requestId: crypto.randomUUID() };
      await createIssue({
        requestId: pendingSave.current.requestId,
        title: issueTitle.trim(),
        storyIds: stories.map(s => s.id),
        userId: user.id,
        description: JSON.stringify({ type: 'digitimes-edition', version: 1, paper, showHistory, date: editionDate }),
      });
      pendingSave.current = null;
      toast.success('Issue saved successfully!');
    } catch (err) {
      if (process.env.NODE_ENV !== 'production') console.error('Failed to save issue', err);
      toast.error('Failed to save issue.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDownloadPDF = async () => {
    setIsDownloading(true);
    const toastId = toast.loading('Generating PDF...');

    try {
      await exportNewspaperToPDF(layout, {
        onProgress: (progress) => {
          if (progress === 100) {
            toast.success('PDF downloaded!', { id: toastId });
          }
        },
      });
    } catch (err) {
      if (process.env.NODE_ENV !== 'production') console.error('Failed to generate PDF', err);
      toast.error(err instanceof Error ? err.message : 'Failed to generate PDF. Please try again.', { id: toastId, duration: 6000 });
    } finally {
      setIsDownloading(false);
    }
  };

  const handleToggleHistory = () => setShowHistory(value => !value);

  if (loading) {
    return (
      <div className="newspaper-loading">
        <p style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>📰</p>
        <p style={{ fontFamily: 'var(--font-display)', fontSize: '1.25rem', marginBottom: '0.5rem' }}>
          Typesetting your edition...
        </p>
        <p style={{ fontSize: '0.95rem', color: 'var(--ink-soft)' }}>
          Setting the type, checking the spelling, and preparing the presses!
        </p>
      </div>
    );
  }

  if (error) {
    // Determine error type for better messaging
    const isPermissionError = error.includes('permission') || error.includes('private');
    const isNotFoundError = error.includes('not found') || error.includes('deleted');

    return (
      <div className="newspaper-error">
        <p style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>🛑</p>
        <h2 style={{ fontFamily: 'var(--font-display)' }}>
          {isPermissionError ? 'Access Restricted' : isNotFoundError ? 'Stories Not Found' : 'Unable to Load Stories'}
        </h2>
        <p style={{ maxWidth: '520px', margin: '0 auto 1rem', fontSize: '1rem', lineHeight: '1.6' }}>
          {error}
        </p>
        {isPermissionError && (
          <p style={{ maxWidth: '520px', margin: '0 auto 1.5rem', fontSize: '0.9rem', color: 'var(--ink-soft)' }}>
            💡 <strong>Tip:</strong> To share stories with others, make sure they're set to "Public" in your archive before creating the newspaper link.
          </p>
        )}
        <Link to="/">
          <Button variant="outline">Return to Newsroom</Button>
        </Link>
      </div>
    );
  }



  return (
    <div className="newspaper-page">
      <header className="newspaper-actions no-print">
        <div className="newspaper-actions__left">
          <Link to="/" className="newspaper-back-link">
            ← Back to Archive
          </Link>
          {notice && <span className="newspaper-notice">{notice}</span>}
        </div>
        <div className="newspaper-actions__right">
          {!reader && <>
          <Button variant={showHistory ? 'default' : 'outline'} onClick={handleToggleHistory} size="sm" aria-pressed={showHistory}>
            <Calendar size={16} className="mr-2" />{showHistory ? 'Hide History' : 'Show History'}
          </Button>
          <Button variant="outline" onClick={handleSaveIssue} disabled={isSaving}><Save size={16} /> {isSaving ? 'Saving...' : 'Save Issue'}</Button>
          <Button variant="outline" onClick={() => setShareOpen(true)}><Share2 size={16} /> Share edition</Button>
          </>}
          <Button onClick={handlePrint} disabled={isPrinting || isDownloading || imageState !== 'ready'}>
            <Printer size={16} className="mr-2" />
            {isPrinting ? 'Preparing...' : 'Print / Save PDF'}
          </Button>
          <Button variant="outline" onClick={handleDownloadPDF} disabled={isDownloading || isPrinting || imageState !== 'ready'} size="sm">
            <Download size={16} className="mr-2" />
            {isDownloading ? 'Exporting...' : 'Download PDF'}
          </Button>
        </div>
      </header>

      <style>{`@media print { @page { size: ${paper === 'letter' ? 'letter' : 'A4'} portrait; margin: 0; } }`}</style>
      <section className="issue-intro no-print">
        <p className="editorial-kicker">{reader ? 'An edition shared with you' : 'Ready for the family fridge'}</p>
        <h2>{reader ? issueTitle : 'Your memories, together at last.'}</h2>
        <p>{stories.length} {stories.length === 1 ? 'story' : 'stories'} · {layout.pages.length} {layout.pages.length === 1 ? 'page' : 'pages'} · {paper === 'letter' ? 'US Letter' : 'A4'}. Every page below is the layout you will download or print.</p>
        {!reader && <><label htmlFor="edition-name">Edition name</label><Input id="edition-name" maxLength={120} value={issueTitle} onChange={event => setIssueTitle(event.target.value)} />
        <label htmlFor="paper-size">Paper size</label><select id="paper-size" value={paper} onChange={event => setPaper(event.target.value as PaperSize)}><option value="a4">A4 (210 × 297 mm)</option><option value="letter">US Letter (8.5 × 11 in)</option></select></>}
        <p className="edition-help">Download PDF keeps text sharp and selectable. For other alphabets or emoji, use Print / Save PDF. In the print dialog, match the selected paper size, choose 100% scale and turn off browser headers and footers.</p>
        <p className="edition-help">On a small screen, swipe across the paper to read the full page.</p>
      </section>
      {imageState === 'loading' && <p className="no-print" role="status">Loading all edition photos before export…</p>}
      {imageState === 'error' && <div className="no-print" role="alert"><p>A required photo failed to load. Export is paused so your newspaper will not omit it.</p><Button onClick={() => setImageAttempt(value => value + 1)}>Retry edition photos</Button></div>}
      <EditionPaper key={imageAttempt} layout={layout} />
      <Dialog open={shareOpen} onOpenChange={setShareOpen}>
        <DialogContent><DialogHeader><DialogTitle>Share this edition</DialogTitle><DialogDescription>Anyone with this link can read its public stories without signing in. Sharing does not change story privacy. Later edits to those stories will appear in the link; a downloaded PDF keeps today's copy.</DialogDescription></DialogHeader>
          <p>{notice ? 'This edition is incomplete. Reload or choose an available set of stories before sharing.' : stories.some(story => !story.is_public) ? 'Make the private stories below public in your archive before copying an edition link. You can also send a downloaded PDF yourself.' : 'The link includes this title, story order, paper size, date and history setting.'}</p>
          <ul className="edition-share-list">{stories.map(story => <li key={story.id}><span>{story.title || 'Untitled Story'}</span><strong>{story.is_public ? 'Public' : 'Private'}</strong></li>)}</ul>
          <DialogFooter><Button variant="outline" onClick={() => setShareOpen(false)}>Close</Button><Button disabled={Boolean(notice) || stories.some(story => !story.is_public)} onClick={async () => {
            const copied = await copyToClipboard(editionShareUrl(window.location.origin, stories.map(story => story.id), editionOptions));
            if (copied) { toast.success('Edition link copied.'); setShareOpen(false); } else toast.error('Could not copy the edition link.');
          }}>Copy edition link</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Save Issue Dialog */}
      <Dialog open={saveDialogOpen} onOpenChange={setSaveDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Save Newspaper Issue</DialogTitle>
            <DialogDescription>Save the title, story selection, paper size, date and history setting to your library.</DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-3 py-2">
            <Label htmlFor="issue-title">Issue name</Label>
            <Input
              id="issue-title"
              maxLength={120}
              ref={issueTitleRef}
              value={issueTitle}
              onChange={(e) => setIssueTitle(e.target.value)}
              placeholder="My Daily Edition"
              onKeyDown={(e) => e.key === 'Enter' && handleConfirmSaveIssue()}
              autoFocus
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSaveDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleConfirmSaveIssue} disabled={!issueTitle.trim()}>Save Issue</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
