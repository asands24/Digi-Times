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
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={handleShare}>
              <Share2 size={16} className="mr-2" />
              Share
            </Button>
            {story && (
              <div className="hidden sm:flex gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-[#1877F2] hover:bg-[#1877F2]/10 px-2"
                  onClick={() => window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.href)}`, '_blank')}
                  title="Share on Facebook"
                >
                  <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.791-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" /></svg>
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-[#1DA1F2] hover:bg-[#1DA1F2]/10 px-2"
                  onClick={() => window.open(`https://twitter.com/intent/tweet?url=${encodeURIComponent(window.location.href)}&text=${encodeURIComponent(story.title || 'Check out this story!')}`, '_blank')}
                  title="Share on Twitter"
                >
                  <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z" /></svg>
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-[#25D366] hover:bg-[#25D366]/10 px-2"
                  onClick={() => window.open(`https://wa.me/?text=${encodeURIComponent(story.title || 'Check out this story!')}%20${encodeURIComponent(window.location.href)}`, '_blank')}
                  title="Share on WhatsApp"
                >
                  <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.008-.57-.008-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.305-5.235c0-5.438 4.411-9.847 9.839-9.847 2.62 0 5.092 1.02 6.944 2.876 1.85 1.858 2.87 4.33 2.87 6.962 0 5.437-4.411 9.846-9.839 9.846m0-18C5.514 3.785 2 7.314 2 11.649c0 1.724.555 3.356 1.513 4.697L2.5 20.5l4.232-1.111A9.76 9.76 0 0112.051 20.5c6.537 0 11.949-5.427 11.949-11.949 0-3.178-1.24-6.165-3.49-8.411C18.26 1.24 15.274 0 12.051 0z" /></svg>
                </Button>
              </div>
            )}
          </div>
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
