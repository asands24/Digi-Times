import { useState } from 'react';
import { Archive as ArchiveIcon, Calendar, Eye, RefreshCcw, Share2, Newspaper } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import {
  loadStoriesWithDetails,
  type ArchiveItem,
} from '../hooks/useStoryLibrary';
import { escapeHtml } from '../utils/sanitizeHtml';
import { useAuth } from '../providers/AuthProvider';
import toast from 'react-hot-toast';

interface StoryArchiveProps {
  stories: ArchiveItem[];
  isLoading: boolean;
  errorMessage?: string | null;
  onPreview: (story: ArchiveItem) => void;
  onRefresh: () => void;
  onToggleShare: (storyId: string, nextValue: boolean) => void;
}

const formatTimestamp = (value: string | null) => {
  if (!value) {
    return 'Never';
  }

  try {
    return new Intl.DateTimeFormat('en', {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(new Date(value));
  } catch {
    return 'Recently';
  }
};

const handleShareStory = async (storyId: string) => {
  const shareUrl = `${window.location.origin}/read/${storyId}`;

  // Try native share if available
  if (navigator.share) {
    try {
      await navigator.share({
        title: 'DigiTimes Story',
        url: shareUrl,
      });
      return;
    } catch (err) {
      // User cancelled or share failed, fall back to clipboard
      if ((err as Error).name !== 'AbortError') {
        console.warn('Share failed, falling back to clipboard', err);
      }
    }
  }

  // Fallback to clipboard
  try {
    await navigator.clipboard.writeText(shareUrl);
    toast.success('Share link copied to clipboard!');
  } catch (err) {
    console.error('Failed to copy share link', err);
    toast.error('Failed to copy share link');
  }
};

const buildArticleHtml = (story: ArchiveItem) => {
  if (story.article && story.article.trim().length > 0) {
    return story.article;
  }
  if (story.prompt && story.prompt.trim().length > 0) {
    return `<p>${escapeHtml(story.prompt.trim())}</p>`;
  }
  return '<p>This story is still drafting.</p>';
};

const openEditionPreview = async (storyIds: string[], userId: string) => {
  if (typeof window === 'undefined') {
    return;
  }
  if (storyIds.length === 0) {
    return;
  }

  // Fetch full story details with article/prompt content
  console.log('[StoryArchive] Loading full story details for export...');
  const stories = await loadStoriesWithDetails(storyIds, userId);

  if (stories.length === 0) {
    toast.error('No stories found to export.');
    return;
  }

  const win = window.open('', '_blank', 'noopener,noreferrer');
  if (!win) {
    toast.error('Pop-up blocked. Allow pop-ups to export edition.');
    return;
  }
  const doc = win.document;
  const articles = stories
    .map((story) => {
      const articleHtml = buildArticleHtml(story);
      return `
        <article class="edition-story">
          <h2>${story.title ?? 'Untitled story'}</h2>
          <div class="edition-story__meta">${formatTimestamp(story.created_at)}</div>
          <div class="edition-story__body">${articleHtml}</div>
        </article>
      `;
    })
    .join('');
  doc.open();
  doc.write(`<!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8"/>
        <title>DigiTimes Edition</title>
        <link rel="preconnect" href="https://fonts.googleapis.com">
        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
        <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700&family=Libre+Baskerville:wght@400;700&display=swap" rel="stylesheet">
        <style>
          body {
            margin: 0;
            padding: 2rem;
            font-family: 'Libre Baskerville', serif;
            background: #fdfaf2;
            color: #2b241c;
          }
          .edition-grid {
            display: grid;
            gap: 2rem;
            grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          }
          h1 {
            text-transform: uppercase;
            font-family: 'Playfair Display', serif;
            letter-spacing: 0.3em;
            text-align: center;
            margin-bottom: 2rem;
          }
          .edition-story {
            border: 1px solid rgba(196, 165, 116, 0.6);
            border-radius: 18px;
            padding: 1.5rem;
            background: linear-gradient(180deg, #fffdf8 0%, #f7ecd6 100%);
            box-shadow: 0 18px 36px rgba(59, 48, 34, 0.08);
          }
          .edition-story h2 {
            margin-top: 0;
            font-family: 'Playfair Display', serif;
            letter-spacing: 0.08em;
            text-transform: uppercase;
          }
          .edition-story__meta {
            font-size: 0.8rem;
            letter-spacing: 0.15em;
            text-transform: uppercase;
            margin-bottom: 1rem;
            color: #7a6d5b;
          }
          .edition-story__body p {
            line-height: 1.7;
          }
        </style>
      </head>
      <body>
        <h1>DigiTimes Edition</h1>
        <section class="edition-grid">${articles}</section>
      </body>
    </html>`);
  doc.close();
  win.focus();
};

export function StoryArchive({
  stories,
  isLoading,
  errorMessage,
  onPreview,
  onRefresh,
  onToggleShare,
}: StoryArchiveProps) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [exportLoading, setExportLoading] = useState(false);
  const isError = Boolean(errorMessage);
  const hasStories = stories.length > 0;
  // Filter out sample stories and stories without titles for export
  const exportableStories = stories.filter((story) => !story.isSample && story.title);
  const canExportEdition = exportableStories.length > 0;
  const showExportHint = !isLoading && !isError && !canExportEdition;

  const handleBuildNewspaper = () => {
    const ids = exportableStories.map((story) => story.id).join(',');
    navigate(`/newspaper?ids=${ids}`);
  };

  const handleExportEdition = async () => {
    if (!user || exportableStories.length === 0) {
      return;
    }

    setExportLoading(true);
    try {
      const storyIds = exportableStories.map((story) => story.id);
      await openEditionPreview(storyIds, user.id);
    } catch (error) {
      console.error('[StoryArchive] Export failed', error);
      toast.error('Failed to export edition. Please try again.');
    } finally {
      setExportLoading(false);
    }
  };

  return (
    <section className="story-archive">
      <header className="story-archive__header">
        <div>
          <div className="story-archive__eyebrow">Edition Archive</div>
          <h2>Your curated front page</h2>
          <p>
            Every saved story is kept here with its photo and article so you can
            edit, preview, and publish a polished newspaper spread.
          </p>
        </div>
        <div className="story-archive__header-actions">
          <Button type="button" variant="outline" onClick={onRefresh} disabled={isLoading}>
            <RefreshCcw size={16} strokeWidth={1.75} />
            Refresh
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={handleBuildNewspaper}
            disabled={!canExportEdition || isLoading}
          >
            <Newspaper size={16} strokeWidth={1.75} />
            Build Newspaper
          </Button>
          <Button
            type="button"
            onClick={handleExportEdition}
            disabled={!canExportEdition || exportLoading || isLoading}
          >
            <ArchiveIcon size={16} strokeWidth={1.75} />
            {exportLoading ? 'Loading...' : 'Export edition'}
          </Button>
          {showExportHint ? (
            <span className="story-archive__hint">Add a story to enable export.</span>
          ) : null}
        </div>
      </header>

      {isLoading ? (
        <div className="story-archive__empty" role="status" aria-live="polite">
          <p>
            Loading your stories...
            <span className="story-archive__loading-icon" aria-hidden="true">
              ⏳
            </span>
          </p>
        </div>
      ) : isError ? (
        <div className="story-archive__empty story-archive__error" role="alert" aria-live="assertive">
          <h3>We couldn't load your stories right now.</h3>
          {errorMessage ? (
            <p className="story-archive__error-message">{errorMessage}</p>
          ) : null}
          <Button type="button" variant="outline" onClick={onRefresh}>
            Retry
          </Button>
        </div>
      ) : hasStories ? (
        <div className="story-archive__grid">
          {stories.map((story) => (
            <article key={story.id} className="story-archive__card">
              <div className="story-archive__image">
                {story.imageUrl ? (
                  <img
                    src={story.imageUrl}
                    alt={story.title ?? 'Archived story image'}
                  />
                ) : null}
              </div>
              <div className="story-archive__content">
                <header>
                  <h3>{story.title ?? 'Untitled story'}</h3>
                  <span className="story-archive__template">
                    Layout: {story.template_id ? `Template ${story.template_id}` : 'Unassigned'}
                  </span>
                  {story.isSample ? (
                    <Badge variant="secondary" className="story-archive__sample-badge">
                      Starter example
                    </Badge>
                  ) : null}
                </header>
                <footer>
                  <div className="story-archive__details">
                    <span className="story-archive__dateline">
                      <Calendar size={14} strokeWidth={1.75} />
                      {formatTimestamp(story.created_at)}
                    </span>
                  </div>
                  <div className="story-archive__buttons">
                    <label className="story-archive__share-toggle">
                      <input
                        type="checkbox"
                        checked={Boolean(story.is_public)}
                        onChange={(event) => onToggleShare(story.id, event.target.checked)}
                        disabled={Boolean(story.isSample)}
                        title={
                          story.isSample
                            ? 'Archive your own story to enable sharing.'
                            : 'Toggle sharing'
                        }
                      />
                      Public
                    </label>
                    {story.is_public && !story.isSample && (
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => handleShareStory(story.id)}
                      >
                        <Share2 size={14} strokeWidth={1.75} />
                        Share
                      </Button>
                    )}
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => onPreview(story)}
                    >
                      <Eye size={14} strokeWidth={1.75} />
                      Preview
                    </Button>
                  </div>
                </footer>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="story-archive__empty">
          <p>No stories yet. Start by adding a photo and story idea.</p>
          <Button type="button" variant="outline" onClick={onRefresh}>
            Refresh archive
          </Button>
        </div>
      )}
    </section>
  );
}

export default StoryArchive;
