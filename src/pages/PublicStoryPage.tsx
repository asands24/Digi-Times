import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Newspaper, Share2, Loader2 } from 'lucide-react';
import { Button } from '../components/ui/button';
import { fetchPublicStory } from '../lib/storiesApi';
import type { StoryArchiveRow } from '../types/story';
import { escapeHtml } from '../utils/sanitizeHtml';
import toast from 'react-hot-toast';

export default function PublicStoryPage() {
  const { slug } = useParams<{ slug: string }>();
  const [story, setStory] = useState<StoryArchiveRow | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      if (!slug) return;
      try {
        const data = await fetchPublicStory(slug);
        if (!data) {
          setError('Story not found or is private.');
        } else {
          setStory(data);
        }
      } catch (err) {
        console.error('Failed to load public story', err);
        setError('Could not load story.');
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, [slug]);

  const handleShare = async () => {
    const url = window.location.href;
    try {
      await navigator.clipboard.writeText(url);
      toast.success('Link copied to clipboard!');
    } catch {
      toast.error('Failed to copy link.');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-paper">
        <Loader2 className="animate-spin text-ink-muted" size={32} />
      </div>
    );
  }

  if (error || !story) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-paper p-4 text-center">
        <h1 className="font-display text-3xl mb-4 text-ink">Story Not Found</h1>
        <p className="text-ink-muted mb-8 max-w-md">
          This story might be private, deleted, or the link is incorrect.
        </p>
        <Link to="/">
          <Button>Go Home</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-paper font-serif">
      <header className="border-b border-ink/10 bg-paper-soft/50 sticky top-0 z-10 backdrop-blur-sm">
        <div className="max-w-3xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 text-ink hover:text-ink-soft transition-colors">
            <Newspaper size={20} />
            <span className="font-display font-bold text-lg">DigiTimes</span>
          </Link>
          <Button variant="ghost" size="sm" onClick={handleShare}>
            <Share2 size={16} className="mr-2" />
            Share
          </Button>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-12">
        <article className="prose prose-lg prose-stone mx-auto">
          <header className="mb-8 text-center">
            <h1 className="font-display text-4xl md:text-5xl font-bold text-ink mb-4 leading-tight">
              {story.title || 'Untitled Story'}
            </h1>
            <time className="text-ink-muted text-sm font-sans uppercase tracking-wider">
              {new Date(story.created_at).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </time>
          </header>

          {story.image_path && (
            <figure className="mb-12 -mx-4 md:mx-0">
              <img
                src={`${process.env.REACT_APP_SUPABASE_URL}/storage/v1/object/public/photos/${story.image_path}`}
                alt={story.title || 'Story image'}
                className="w-full h-auto rounded-sm shadow-hard"
              />
              {story.prompt && (
                <figcaption className="text-center text-sm text-ink-muted mt-4 italic font-sans">
                  Prompt: {story.prompt}
                </figcaption>
              )}
            </figure>
          )}

          <div
            className="font-serif text-lg leading-relaxed text-ink-black"
            dangerouslySetInnerHTML={{
              __html: story.article || `<p>${escapeHtml(story.prompt || '')}</p>`
            }}
          />
        </article>

        <footer className="mt-16 pt-8 border-t border-ink/10 text-center">
          <p className="text-ink-muted mb-6 font-sans">
            Created with DigiTimes — Turn your photos into stories.
          </p>
          <Link to="/">
            <Button size="lg" className="font-sans">Create Your Own</Button>
          </Link>
        </footer>
      </main>
    </div>
  );
}
