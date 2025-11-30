import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Printer, Save, Download } from 'lucide-react';
import { Button } from '../components/ui/button';
import { supabase } from '../lib/supabaseClient';
import { supaRest } from '../lib/supaRest';
import { createIssue, fetchIssueById } from '../lib/storiesApi';
import { useAuth } from '../providers/AuthProvider';
import type { Database } from '../types/supabase';
import toast from 'react-hot-toast';
import { exportNewspaperToPDF } from '../lib/pdfExport';
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
  const { user } = useAuth();
  const [stories, setStories] = useState<StoryWithImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

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
        console.log('[NewspaperPage] 🔍 Fetching issue', issueId);
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

      console.log('[NewspaperPage] 🔍 Fetching stories (RAW FETCH)', { ids: targetIds });

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

      console.log('[NewspaperPage] Raw fetch response', { count: data.length });

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

  const handleSaveIssue = async () => {
    if (!user) {
      toast.error('You must be logged in to save an issue.');
      return;
    }

    const title = window.prompt('Name your newspaper issue:', 'My Daily Edition');
    if (!title) return;

    setIsSaving(true);
    try {
      await createIssue({
        title,
        storyIds: stories.map(s => s.id),
      });
      toast.success('Issue saved successfully!');
    } catch (err) {
      console.error('Failed to save issue', err);
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
      console.error('Failed to generate PDF', err);
      toast.error('Failed to generate PDF. Please try again.', { id: toastId });
    } finally {
      setIsDownloading(false);
    }
  };

  if (loading) {
    return (
      <div className="newspaper-loading">
        <div className="newspaper-spinner" />
        <p>Typesetting your edition...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="newspaper-error">
        <h2>Stopped the presses!</h2>
        <p>{error}</p>
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
          <Button variant="outline" onClick={handleSaveIssue} disabled={isSaving}>
            <Save size={16} className="mr-2" />
            {isSaving ? 'Saving...' : 'Save Issue'}
          </Button>
          <Button variant="outline" onClick={handleDownloadPDF} disabled={isDownloading}>
            <Download size={16} className="mr-2" />
            {isDownloading ? 'Generating...' : 'Download PDF'}
          </Button>
          <Button onClick={handlePrint}>
            <Printer size={16} className="mr-2" />
            Print Newspaper
          </Button>
        </div>
      </header>

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
                    <div dangerouslySetInnerHTML={{ __html: mainStory.article }} />
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

        <footer className="newspaper-footer">
          <p>Printed with DigiTimes • Turn your memories into headlines.</p>
        </footer>
      </div>
    </div>
  );
}
