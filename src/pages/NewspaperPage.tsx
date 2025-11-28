import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Printer } from 'lucide-react';
import { Button } from '../components/ui/button';
import { supabase } from '../lib/supabaseClient';
import { supaRest } from '../lib/supaRest';
import { useAuth } from '../providers/AuthProvider';
import type { Database } from '../types/supabase';
import '../styles/newspaper-print.css';

type StoryRow = Database['public']['Tables']['story_archives']['Row'];

interface StoryWithImage extends StoryRow {
  imageUrl?: string | null;
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
    if (ids.length === 0) {
      setError('Select at least one story to create a printable page.');
      setStories([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    setNotice(null);

    try {
      console.log('[NewspaperPage] 🔍 Fetching stories (RAW FETCH)', { ids });

      // WORKAROUND: Use raw fetch because Supabase client hangs
      const idsParam = `(${ids.join(',')})`;
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

      if (available.length === 0) {
        setError('No accessible stories found for this layout.');
        setStories([]);
        return;
      }

      if (available.length < ids.length) {
        setNotice('Some stories were private or missing and were skipped.');
      }

      const withImages = available.map((story: StoryRow) => ({
        ...story,
        imageUrl: getPublicImage(story.image_path),
      }));

      // Preserve the requested order
      withImages.sort(
        (a: StoryRow, b: StoryRow) => ids.indexOf(a.id ?? '') - ids.indexOf(b.id ?? '')
      );

      setStories(withImages);
    } catch (err) {
      console.error('[NewspaperPage] unexpected error', err);
      setError('Something went wrong while building your newspaper.');
      setStories([]);
    } finally {
      setLoading(false);
    }
  }, [ids, user?.id]);

  useEffect(() => {
    void loadStories();
  }, [loadStories]);

  const today = useMemo(() => {
    return new Intl.DateTimeFormat('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(new Date());
  }, []);

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="newspaper-page">
        <div className="newspaper-container">
          <div className="newspaper-loading" role="status" aria-live="polite">
            Building your Gazette…
          </div>
        </div>
      </div>
    );
  }

  if (error || stories.length === 0) {
    return (
      <div className="newspaper-page">
        <div className="newspaper-container">
          <div className="newspaper-error">
            <h2>{error || 'No stories ready yet.'}</h2>
            <p>
              Check that you shared the correct story links or that you are signed in
              with the right DigiTimes account.
            </p>
            <div className="newspaper-error-actions">
              <Button onClick={loadStories}>Retry</Button>
              <Link to="/" className="newspaper-link">
                Go Back
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const [leadStory, ...secondaryStories] = stories;

  return (
    <div className="newspaper-page">
      <div className="newspaper-container">
        <div className="newspaper-controls no-print">
          <div className="newspaper-actions">
            <Button onClick={handlePrint} size="lg">
              <Printer size={18} strokeWidth={1.75} />
              Print
            </Button>
            <Link to="/" className="newspaper-back-link">
              ← Back to DigiTimes
            </Link>
          </div>
          {notice && <p className="newspaper-notice">{notice}</p>}
        </div>

        <header className="newspaper-masthead">
          <p className="masthead-edition">Vol. 1 · Kid Correspondents</p>
          <h1>DigiTimes Gazette</h1>
          <p className="masthead-meta">
            {today} <span className="masthead-separator">•</span> Special Family Edition
          </p>
          <div className="masthead-border" />
        </header>

        {leadStory && (
          <article className="newspaper-lead-story">
            <h2>{leadStory.title || 'Untitled Adventure'}</h2>
            {leadStory.imageUrl && (
              <figure className="lead-story-image">
                <img
                  src={leadStory.imageUrl}
                  alt={leadStory.title || 'Lead story image'}
                />
              </figure>
            )}
            <div
              className="lead-story-content"
              dangerouslySetInnerHTML={{
                __html:
                  leadStory.article ||
                  (leadStory.prompt
                    ? `<p>${leadStory.prompt}</p>`
                    : '<p>Story in progress...</p>'),
              }}
            />
          </article>
        )}

        {secondaryStories.length > 0 ? (
          <section className="newspaper-grid">
            {secondaryStories.map((story) => (
              <article key={story.id} className="newspaper-story">
                <h3>{story.title || 'Untitled Story'}</h3>
                {story.imageUrl && (
                  <figure className="story-image">
                    <img
                      src={story.imageUrl}
                      alt={story.title || 'Story image'}
                    />
                  </figure>
                )}
                <div className="story-content">
                  {buildPreview(story).map((para, index) => (
                    <p key={`${story.id}-p-${index}`}>{para}</p>
                  ))}
                </div>
              </article>
            ))}
          </section>
        ) : null}

        <footer className="newspaper-footer">
          Created with DigiTimes • Joyful news for young reporters
        </footer>
      </div>
    </div>
  );
}
