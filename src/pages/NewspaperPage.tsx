import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Printer, Save, Download, Calendar } from 'lucide-react';
import { Button } from '../components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '../components/ui/dialog';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { supabase } from '../lib/supabaseClient';
import { supaRest } from '../lib/supaRest';
import { createIssue, fetchIssueById } from '../lib/storiesApi';
import { useAuth } from '../providers/AuthProvider';
import type { Database } from '../types/supabase';
import toast from 'react-hot-toast';
import { exportNewspaperToPDF } from '../lib/pdfExport';
import { OnThisDayBox } from '../components/OnThisDayBox';
import { sanitizeHtml } from '../utils/sanitizeHtml';
import '../styles/newspaper-print.css';

type StoryRow = Database['public']['Tables']['story_archives']['Row'];

interface StoryWithImage extends StoryRow {
  imageUrl: string | null;
}

const STORY_COLUMNS =
  'id,title,article,prompt,image_path,photo_id,template_id,created_at,updated_at,is_public,created_by';
const UUID_MATCH =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function getPublicImage(path?: string | null) {
  if (!path) {
    return null;
  }
  const { data } = supabase.storage.from('photos').getPublicUrl(path);
  return data?.publicUrl ?? null;
}

function sanitizeHtmlToText(value?: string | null) {
  if (!value) {
    return '';
  }
  return value.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}

function buildPreview(story: StoryWithImage) {
  const base = sanitizeHtmlToText(story.article) || story.prompt || '';
  if (!base) {
    return ['More details coming soon!'];
  }
  const sentences = base.split(/(?<=[.!?])\s+/).filter(Boolean);
  const paragraphOne = sentences.slice(0, 2).join(' ');
  const paragraphTwo = sentences.slice(2, 4).join(' ');
  return [paragraphOne, paragraphTwo].filter(Boolean);
}

export default function NewspaperPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [stories, setStories] = useState<StoryWithImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [issueTitle, setIssueTitle] = useState('My Daily Edition');
  const issueTitleRef = useRef<HTMLInputElement>(null);

  // Check if "On This Day" feature is enabled via URL param
  const showHistory = useMemo(() => {
    const params = new URLSearchParams(location.search);
    return params.get('showHistory') === 'true';
  }, [location.search]);

  const ids = useMemo(() => {
    const params = new URLSearchParams(location.search);
    const raw = params.get('ids');
    if (!raw) {
      return [];
    }
    return raw
      .split(',')
      .map((value) => value.trim())
      .filter((value) => UUID_MATCH.test(value));
  }, [location.search]);

  const loadStories = useCallback(async () => {
    let targetIds = ids;
    const params = new URLSearchParams(location.search);
    const issueId = params.get('issueId');

    setLoading(true);
    setError(null);
    setNotice(null);

    try {
      // If loading from an issue, fetch the issue first to get story IDs
      if (issueId) {
        if (process.env.NODE_ENV !== 'production') console.log('[NewspaperPage] 🔍 Fetching issue', issueId);
        const issue = await fetchIssueById(issueId);

        if (!issue) {
          setError('Issue not found or you do not have permission to view it.');
          setStories([]);
          setLoading(false);
          return;
        }

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
        `/rest/v1/story_archives?select=${encodeURIComponent(STORY_COLUMNS)}&id=in.${idsParam}`,
        {
          headers: {
            'Prefer': 'count=none'
          }
        }
      );

      if (process.env.NODE_ENV !== 'production') console.log('[NewspaperPage] Raw fetch response', { count: data.length });

      const available = (data ?? []).filter((story: StoryRow) => {
        if (story.is_public) {
          return true;
        }
        if (!user?.id) {
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
      }));

      // Preserve the requested order
      const orderedStories = targetIds
        .map(id => withImages.find(s => s.id === id))
        .filter((s): s is StoryWithImage => Boolean(s));

      setStories(orderedStories);
    } catch (err) {
      console.error('[NewspaperPage] ❌ Failed to load stories', err);
      setError('Failed to load stories. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [ids, location.search, user]);

  useEffect(() => {
    loadStories();
  }, [loadStories]);

  const handlePrint = () => {
    window.print();
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
      await createIssue({
        title: issueTitle.trim(),
        storyIds: stories.map(s => s.id),
        userId: user.id,
      });
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
      await exportNewspaperToPDF('newspaper-content', {
        onProgress: (progress) => {
          if (progress === 100) {
            toast.success('PDF downloaded!', { id: toastId });
          }
        },
      });
    } catch (err) {
      if (process.env.NODE_ENV !== 'production') console.error('Failed to generate PDF', err);
      toast.error('Failed to generate PDF. Please try again.', { id: toastId });
    } finally {
      setIsDownloading(false);
    }
  };

  const handleToggleHistory = () => {
    const params = new URLSearchParams(location.search);
    if (showHistory) {
      params.delete('showHistory');
    } else {
      params.set('showHistory', 'true');
    }
    navigate({ search: params.toString() }, { replace: true });
  };

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

  const mainStory = stories[0];
  const sideStories = stories.slice(1, 3);
  const bottomStories = stories.slice(3);

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
          <Button
            variant={showHistory ? 'default' : 'outline'}
            onClick={handleToggleHistory}
            size="sm"
            title="Toggle 'On This Day in History' section"
          >
            <Calendar size={16} className="mr-2" />
            {showHistory ? 'Hide History' : 'Show History'}
          </Button>
          <Button variant="outline" onClick={handleSaveIssue} disabled={isSaving}>
            <Save size={16} className="mr-2" />
            {isSaving ? 'Saving...' : 'Save Issue'}
          </Button>
          <Button onClick={handlePrint}>
            <Printer size={16} className="mr-2" />
            Print to PDF
          </Button>
          <Button variant="outline" onClick={handleDownloadPDF} disabled={isDownloading} size="sm">
            <Download size={16} className="mr-2" />
            {isDownloading ? 'Exporting...' : 'Quick Export'}
          </Button>
        </div>
      </header>

      {/* PDF Export Instructions */}
      <div className="newspaper-pdf-notice no-print">
        <div className="newspaper-pdf-notice__heading">💡 PDF Export Options:</div>
        <ul className="newspaper-pdf-notice__list">
          <li><strong>Print to PDF</strong> (Recommended): Click the button above, then select "Save as PDF" in your browser's print dialog for the highest quality vector-based PDF.</li>
          <li><strong>Quick Export</strong>: One-click download for convenient sharing. Good quality, larger file size.</li>
        </ul>
      </div>

      <div className="newspaper-container" id="newspaper-content">
        <header className="newspaper-header">
          <div className="newspaper-meta">
            <span>Vol. 1, No. 1</span>
            <span>{new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
            <span>$1.00</span>
          </div>
          <div className="border-t-4 border-b border-ink-black my-2"></div>
          <h1 className="newspaper-title font-headline text-6xl font-black tracking-tight text-ink-black uppercase">
            DigiTimes
          </h1>
          <div className="border-t border-b-4 border-ink-black my-2"></div>
          <div className="newspaper-tagline font-cheltenham italic text-sm">"Your Memories, Front Page News"</div>
        </header>

        <main className="newspaper-layout">
          {/* Main Feature Story */}
          {mainStory && (
            <article className="newspaper-story newspaper-story--main">
              {mainStory.imageUrl && (
                <div className="newspaper-story__image-container">
                  <img src={mainStory.imageUrl} alt={mainStory.title || 'Story image'} className="newspaper-story__image" />
                  {mainStory.prompt && <figcaption className="newspaper-story__caption">{mainStory.prompt}</figcaption>}
                </div>
              )}
              <div className="newspaper-story__content">
                <h2 className="newspaper-story__headline">{mainStory.title || 'Untitled Feature'}</h2>
                <div className="newspaper-story__byline">By DigiTimes Staff</div>
                <div className="newspaper-story__body">
                  {mainStory.article ? (
                    // article is AI-generated/user-derived HTML; sanitize before injecting
                    <div dangerouslySetInnerHTML={{ __html: sanitizeHtml(mainStory.article) }} />
                  ) : (
                    buildPreview(mainStory).map((p, i) => <p key={i}>{p}</p>)
                  )}
                </div>
              </div>
            </article>
          )}

          {/* Sidebar Stories */}
          {sideStories.length > 0 && (
            <aside className="newspaper-sidebar">
              {sideStories.map((story) => (
                <article key={story.id} className="newspaper-story newspaper-story--side">
                  <h3 className="newspaper-story__headline">{story.title || 'Untitled Story'}</h3>
                  {story.imageUrl && (
                    <img src={story.imageUrl} alt={story.title || 'Story image'} className="newspaper-story__image" />
                  )}
                  <div className="newspaper-story__body">
                    {buildPreview(story).map((p, i) => <p key={i}>{p}</p>)}
                  </div>
                </article>
              ))}
            </aside>
          )}
        </main>

        {/* Bottom Stories Grid */}
        {bottomStories.length > 0 && (
          <section className="newspaper-bottom-grid">
            {bottomStories.map((story) => (
              <article key={story.id} className="newspaper-story newspaper-story--bottom">
                <h3 className="newspaper-story__headline">{story.title || 'Untitled Story'}</h3>
                <div className="newspaper-story__body">
                  {buildPreview(story).map((p, i) => <p key={i}>{p}</p>)}
                </div>
              </article>
            ))}
          </section>
        )}

        {/* On This Day in History - Optional */}
        {showHistory && mainStory && (
          <OnThisDayBox date={new Date(mainStory.created_at)} />
        )}

        <footer className="newspaper-footer">
          <p>Printed with DigiTimes • Turn your memories into headlines.</p>
        </footer>
      </div>

      {/* Save Issue Dialog */}
      <Dialog open={saveDialogOpen} onOpenChange={setSaveDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Save Newspaper Issue</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-3 py-2">
            <Label htmlFor="issue-title">Issue name</Label>
            <Input
              id="issue-title"
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
