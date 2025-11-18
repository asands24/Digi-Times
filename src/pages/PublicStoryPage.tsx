import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { Button } from '../components/ui/button';
import type { Database } from '../types/supabase';

type StoryArchiveRow = Database['public']['Tables']['story_archives']['Row'];

interface StoryWithImageUrl extends StoryArchiveRow {
  imageUrl?: string | null;
}

export default function PublicStoryPage() {
  const { id } = useParams<{ id: string }>();
  const [story, setStory] = useState<StoryWithImageUrl | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadStory = async () => {
    if (!id) {
      setError('No story ID provided');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { data, error: fetchError } = await supabase
        .from('story_archives')
        .select('*')
        .eq('id', id)
        .single();

      if (fetchError) {
        if (fetchError.code === 'PGRST116') {
          setError('This story is not available');
        } else {
          setError('Failed to load story');
        }
        setLoading(false);
        return;
      }

      if (!data) {
        setError('This story is not available');
        setLoading(false);
        return;
      }

      // Build image URL if image_path exists
      let imageUrl: string | null = null;
      if (data.image_path) {
        const { data: pubData } = supabase.storage
          .from('photos')
          .getPublicUrl(data.image_path);
        imageUrl = pubData?.publicUrl ?? null;
      }

      setStory({ ...data, imageUrl });
    } catch (err) {
      console.error('Error loading story:', err);
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadStory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  if (loading) {
    return (
      <div className="public-story-page">
        <div className="public-story-container">
          <div className="public-story-loading">
            <p>Loading story...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !story) {
    return (
      <div className="public-story-page">
        <div className="public-story-container">
          <div className="public-story-error">
            <h2>{error || 'Story not found'}</h2>
            <p>
              {error === 'This story is not available'
                ? 'This story may be private or may have been removed.'
                : 'Please check the URL and try again.'}
            </p>
            <Button onClick={loadStory} variant="outline">
              Retry
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const formattedDate = story.created_at
    ? new Intl.DateTimeFormat('en', {
        dateStyle: 'long',
      }).format(new Date(story.created_at))
    : '';

  return (
    <div className="public-story-page">
      <div className="public-story-container">
        <header className="public-story-header">
          <div className="public-story-masthead">
            <h1 className="public-story-masthead-title">DigiTimes</h1>
            <p className="public-story-masthead-tagline">Where Family Stories Make Headlines</p>
          </div>
        </header>

        <article className="public-story-article">
          {story.imageUrl && (
            <div className="public-story-image">
              <img src={story.imageUrl} alt={story.title || 'Story image'} />
            </div>
          )}

          <div className="public-story-content">
            <h2 className="public-story-headline">{story.title || 'Untitled Story'}</h2>

            {formattedDate && (
              <p className="public-story-dateline">{formattedDate}</p>
            )}

            <div
              className="public-story-body"
              dangerouslySetInnerHTML={{
                __html:
                  story.article ||
                  (story.prompt
                    ? `<p>${story.prompt}</p>`
                    : '<p>This story is still being written...</p>'),
              }}
            />
          </div>
        </article>

        <footer className="public-story-footer">
          <p>Created with DigiTimes</p>
          <p>
            <a href="/">Create your own family newspaper</a>
          </p>
        </footer>
      </div>

      <style>{`
        .public-story-page {
          min-height: 100vh;
          background: #fdfaf2;
          padding: 2rem 1rem;
        }

        .public-story-container {
          max-width: 800px;
          margin: 0 auto;
          background: white;
          border: 1px solid rgba(196, 165, 116, 0.3);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
        }

        .public-story-header {
          border-bottom: 3px double #2b241c;
          padding: 2rem 2rem 1rem;
        }

        .public-story-masthead {
          text-align: center;
        }

        .public-story-masthead-title {
          font-family: 'Playfair Display', 'Georgia', serif;
          font-size: 3rem;
          font-weight: 700;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          margin: 0 0 0.25rem;
          color: #2b241c;
        }

        .public-story-masthead-tagline {
          font-family: 'Georgia', serif;
          font-size: 0.875rem;
          font-style: italic;
          letter-spacing: 0.05em;
          color: #7a6d5b;
          margin: 0;
        }

        .public-story-article {
          padding: 2rem;
        }

        .public-story-image {
          margin: 0 0 2rem;
          border: 1px solid rgba(196, 165, 116, 0.3);
          overflow: hidden;
        }

        .public-story-image img {
          width: 100%;
          height: auto;
          display: block;
        }

        .public-story-content {
          font-family: 'Georgia', serif;
        }

        .public-story-headline {
          font-family: 'Playfair Display', 'Georgia', serif;
          font-size: 2rem;
          font-weight: 700;
          line-height: 1.2;
          margin: 0 0 0.5rem;
          color: #2b241c;
        }

        .public-story-dateline {
          font-size: 0.875rem;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          color: #7a6d5b;
          margin: 0 0 1.5rem;
          border-bottom: 1px solid rgba(196, 165, 116, 0.3);
          padding-bottom: 0.75rem;
        }

        .public-story-body {
          font-size: 1.125rem;
          line-height: 1.8;
          color: #2b241c;
        }

        .public-story-body p {
          margin: 0 0 1rem;
        }

        .public-story-body p:last-child {
          margin-bottom: 0;
        }

        .public-story-footer {
          border-top: 3px double #2b241c;
          padding: 1.5rem 2rem;
          text-align: center;
          font-family: 'Georgia', serif;
          font-size: 0.875rem;
          color: #7a6d5b;
        }

        .public-story-footer p {
          margin: 0.25rem 0;
        }

        .public-story-footer a {
          color: #2b241c;
          text-decoration: underline;
        }

        .public-story-loading,
        .public-story-error {
          padding: 3rem 2rem;
          text-align: center;
        }

        .public-story-error h2 {
          font-family: 'Playfair Display', 'Georgia', serif;
          margin: 0 0 1rem;
          color: #2b241c;
        }

        .public-story-error p {
          margin: 0 0 1.5rem;
          color: #7a6d5b;
        }

        @media (max-width: 640px) {
          .public-story-masthead-title {
            font-size: 2rem;
          }

          .public-story-headline {
            font-size: 1.5rem;
          }

          .public-story-article {
            padding: 1.5rem;
          }

          .public-story-header {
            padding: 1.5rem 1.5rem 1rem;
          }

          .public-story-footer {
            padding: 1rem 1.5rem;
          }
        }
      `}</style>
    </div>
  );
}
