import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { Button } from '../components/ui/button';
import { Printer } from 'lucide-react';
import '../styles/newspaper-print.css';
import type { Database } from '../types/supabase';

type StoryArchiveRow = Database['public']['Tables']['story_archives']['Row'];

interface StoryWithImageUrl extends StoryArchiveRow {
  imageUrl?: string | null;
}

export default function NewspaperPage() {
  const [searchParams] = useSearchParams();
  const [stories, setStories] = useState<StoryWithImageUrl[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadStories = async () => {
    const idsParam = searchParams.get('ids');

    if (!idsParam) {
      setError('No stories selected');
      setLoading(false);
      return;
    }

    const ids = idsParam.split(',').filter(Boolean);

    if (ids.length === 0) {
      setError('No stories selected');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { data, error: fetchError } = await supabase
        .from('story_archives')
        .select('id, title, article, prompt, image_path, created_at, is_public, user_id')
        .in('id', ids);

      if (fetchError) {
        console.error('Error loading stories:', fetchError);
        setError('Failed to load stories');
        setLoading(false);
        return;
      }

      if (!data || data.length === 0) {
        setError('No stories found');
        setLoading(false);
        return;
      }

      // Build image URLs
      const storiesWithImages = data.map((story) => {
        let imageUrl: string | null = null;
        if (story.image_path) {
          const { data: pubData } = supabase.storage
            .from('photos')
            .getPublicUrl(story.image_path);
          imageUrl = pubData?.publicUrl ?? null;
        }
        return { ...story, imageUrl };
      });

      setStories(storiesWithImages);
    } catch (err) {
      console.error('Error loading stories:', err);
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadStories();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const handlePrint = () => {
    window.print();
  };

  const today = new Date();
  const formattedDate = new Intl.DateTimeFormat('en', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(today);

  if (loading) {
    return (
      <div className="newspaper-page">
        <div className="newspaper-container">
          <div className="newspaper-loading">
            <p>Loading newspaper...</p>
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
            <h2>{error || 'No stories found'}</h2>
            <p>
              {error === 'No stories selected'
                ? 'Please select some stories to build your newspaper.'
                : 'Some stories may be private or unavailable.'}
            </p>
            <Button onClick={() => window.history.back()} variant="outline">
              Go Back
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Split stories: first one is the lead, rest are secondary
  const [leadStory, ...secondaryStories] = stories;

  return (
    <div className="newspaper-page">
      <div className="newspaper-container">
        {/* Print button - hidden during print */}
        <div className="newspaper-controls no-print">
          <Button onClick={handlePrint} size="lg">
            <Printer size={18} strokeWidth={1.75} />
            Print Newspaper
          </Button>
        </div>

        {/* Masthead */}
        <header className="newspaper-masthead">
          <div className="masthead-title">DigiTimes Gazette</div>
          <div className="masthead-meta">
            <span className="masthead-date">{formattedDate}</span>
            <span className="masthead-separator">•</span>
            <span className="masthead-volume">Vol. 1</span>
          </div>
          <div className="masthead-border"></div>
        </header>

        {/* Lead Story */}
        {leadStory && (
          <article className="newspaper-lead-story">
            <h2 className="lead-story-headline">{leadStory.title || 'Untitled Story'}</h2>

            {leadStory.imageUrl && (
              <figure className="lead-story-image">
                <img src={leadStory.imageUrl} alt={leadStory.title || 'Story image'} />
              </figure>
            )}

            <div
              className="lead-story-content"
              dangerouslySetInnerHTML={{
                __html:
                  leadStory.article ||
                  (leadStory.prompt ? `<p>${leadStory.prompt}</p>` : '<p>Story in progress...</p>'),
              }}
            />
          </article>
        )}

        {/* Secondary Stories Grid */}
        {secondaryStories.length > 0 && (
          <div className="newspaper-grid">
            {secondaryStories.map((story) => (
              <article key={story.id} className="newspaper-story">
                <h3 className="story-headline">{story.title || 'Untitled Story'}</h3>

                {story.imageUrl && (
                  <figure className="story-image">
                    <img src={story.imageUrl} alt={story.title || 'Story image'} />
                  </figure>
                )}

                <div
                  className="story-content"
                  dangerouslySetInnerHTML={{
                    __html:
                      story.article ||
                      (story.prompt ? `<p>${story.prompt}</p>` : '<p>Story in progress...</p>'),
                  }}
                />
              </article>
            ))}
          </div>
        )}

        {/* Footer */}
        <footer className="newspaper-footer">
          <p>Published with DigiTimes • Your Family News, Your Way</p>
        </footer>
      </div>
    </div>
  );
}
