import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../providers/AuthProvider';

interface StoryWithImage {
  id: string;
  title: string | null;
  article: string | null;
  prompt: string | null;
  image_path: string | null;
  created_at: string;
  is_public: boolean | null;
  created_by: string | null;
  imageUrl?: string | null;
}

const STORY_FIELDS =
  'id,title,article,prompt,image_path,created_at,is_public,created_by';

function getImageUrl(imagePath?: string | null) {
  if (!imagePath) {
    return null;
  }
  const { data } = supabase.storage.from('photos').getPublicUrl(imagePath);
  return data?.publicUrl ?? null;
}

function getArticleHtml(story?: StoryWithImage | null) {
  if (!story) {
    return '<p>This story is not available.</p>';
  }
  if (story.article?.trim()) {
    return story.article;
  }
  if (story.prompt?.trim()) {
    return `<p>${story.prompt}</p>`;
  }
  return '<p>This story is still being written.</p>';
}

export default function PublicStoryPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [story, setStory] = useState<StoryWithImage | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadStory = useCallback(async () => {
    if (!id) {
      setError('No story ID provided.');
      setStory(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { data, error: fetchError } = await supabase
        .from('story_archives')
        .select(STORY_FIELDS)
        .eq('id', id)
        .single();

      if (fetchError || !data) {
        console.error('[PublicStoryPage] fetch error', fetchError);
        setError('This story is not available');
        setStory(null);
        return;
      }

      const canView =
        Boolean(data.is_public) || (user?.id ? data.created_by === user.id : false);

      if (!canView) {
        setError('This story is not available');
        setStory(null);
        return;
      }

      setStory({ ...data, imageUrl: getImageUrl(data.image_path) });
    } catch (err) {
      console.error('[PublicStoryPage] unexpected error', err);
      setError('Unable to load story. Please try again.');
      setStory(null);
    } finally {
      setLoading(false);
    }
  }, [id, user?.id]);

  useEffect(() => {
    void loadStory();
  }, [loadStory]);

  const formattedDate = useMemo(() => {
    if (!story?.created_at) {
      return '';
    }

    try {
      return new Intl.DateTimeFormat('en-US', {
        dateStyle: 'long',
      }).format(new Date(story.created_at));
    } catch {
      return '';
    }
  }, [story?.created_at]);

  if (loading) {
    return (
      <div className="public-story-screen">
        <div className="public-story-shell">
          <div className="public-story-loading" role="status" aria-live="polite">
            <div className="public-story-spinner" />
            <p>Loading your story...</p>
          </div>
        </div>
        <PublicStoryStyles />
      </div>
    );
  }

  if (error || !story) {
    return (
      <div className="public-story-screen">
        <div className="public-story-shell">
          <div className="public-story-error">
            <h2>{error || 'This story is not available'}</h2>
            <p>
              Private stories are only visible to their creators. Please sign in
              with the account that originally saved this headline.
            </p>
            <div className="public-story-error-actions">
              <Button onClick={loadStory}>Retry</Button>
              <Link to="/" className="public-story-link">
                Return to DigiTimes
              </Link>
            </div>
          </div>
        </div>
        <PublicStoryStyles />
      </div>
    );
  }

  return (
    <div className="public-story-screen">
      <div className="public-story-shell">
        <header className="public-story-masthead">
          <p className="masthead-subtitle">Vol. 1 · Kid Edition</p>
          <h1>DigiTimes</h1>
          <p className="masthead-tagline">
            Reporting bright adventures for curious readers
          </p>
          {formattedDate && <p className="masthead-date">{formattedDate}</p>}
          <div className="masthead-rule" />
        </header>

        <article className="public-story-article">
          <h2>{story.title || 'Untitled Story'}</h2>
          {story.imageUrl && (
            <figure className="public-story-figure">
              <img src={story.imageUrl} alt={story.title || 'Story illustration'} />
            </figure>
          )}
          <div
            className="public-story-body"
            dangerouslySetInnerHTML={{ __html: getArticleHtml(story) }}
          />
        </article>

        <footer className="public-story-footer">
          <p>Created with DigiTimes</p>
          <Link to="/">Make your own cheery headlines</Link>
        </footer>
      </div>
      <PublicStoryStyles />
    </div>
  );
}

function PublicStoryStyles() {
  return (
    <style>{`
      .public-story-screen {
        min-height: 100vh;
        background: #f6f1e7;
        padding: 2rem 1rem;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .public-story-shell {
        width: 100%;
        max-width: 900px;
        background: #fffdfa;
        border: 1px solid rgba(34, 23, 7, 0.15);
        box-shadow: 0 20px 60px rgba(0, 0, 0, 0.12);
        font-family: 'Playfair Display', 'Libre Baskerville', Georgia, serif;
      }

      .public-story-masthead {
        text-align: center;
        padding: 2.5rem 2rem 1.5rem;
        background: linear-gradient(180deg, #fffdfa 0%, #f2e7d0 100%);
      }

      .public-story-masthead h1 {
        margin: 0;
        font-size: clamp(2.5rem, 5vw, 4rem);
        letter-spacing: 0.25em;
        text-transform: uppercase;
      }

      .masthead-subtitle {
        font-size: 0.85rem;
        text-transform: uppercase;
        letter-spacing: 0.2em;
        margin: 0 0 0.5rem;
        color: #7b674a;
      }

      .masthead-tagline,
      .masthead-date {
        font-size: 1rem;
        font-style: italic;
        margin: 0.75rem 0 0;
        color: #5e4b32;
      }

      .masthead-rule {
        height: 3px;
        margin-top: 1.5rem;
        background: repeating-linear-gradient(
          to right,
          #221907,
          #221907 20px,
          transparent 20px,
          transparent 40px
        );
      }

      .public-story-article {
        padding: 2rem;
      }

      .public-story-article h2 {
        font-size: clamp(2rem, 4vw, 3rem);
        margin: 0 0 1rem;
        text-align: center;
        line-height: 1.2;
      }

      .public-story-figure {
        margin: 1rem auto 2rem;
        border: 1px solid rgba(34, 23, 7, 0.15);
        overflow: hidden;
        max-width: 100%;
      }

      .public-story-figure img {
        display: block;
        width: 100%;
        height: auto;
        object-fit: cover;
      }

      .public-story-body {
        font-size: 1.15rem;
        line-height: 1.8;
        color: #2c2010;
      }

      .public-story-body p {
        margin: 0 0 1.25rem;
      }

      .public-story-footer {
        border-top: 2px solid #e3d4bb;
        padding: 1.5rem 2rem 2rem;
        text-align: center;
        font-size: 0.95rem;
      }

      .public-story-footer a {
        color: #8b5d16;
        text-decoration: none;
        font-weight: 600;
      }

      .public-story-loading,
      .public-story-error {
        padding: 3rem 2rem;
        text-align: center;
        font-family: 'Libre Baskerville', Georgia, serif;
      }

      .public-story-spinner {
        width: 48px;
        height: 48px;
        margin: 0 auto 1rem;
        border-radius: 50%;
        border: 4px solid rgba(139, 93, 22, 0.2);
        border-top-color: #8b5d16;
        animation: public-story-spin 1s linear infinite;
      }

      @keyframes public-story-spin {
        to {
          transform: rotate(360deg);
        }
      }

      .public-story-error h2 {
        margin: 0 0 1rem;
        font-size: 1.75rem;
      }

      .public-story-error p {
        margin: 0 auto 1.5rem;
        max-width: 420px;
        color: #5a4934;
      }

      .public-story-error-actions {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 0.75rem;
      }

      .public-story-link {
        color: #8b5d16;
        text-decoration: underline;
      }

      @media (max-width: 640px) {
        .public-story-article {
          padding: 1.5rem;
        }

        .public-story-body {
          font-size: 1.05rem;
        }
      }
    `}</style>
  );
}
