import { useState } from 'react';
import { Archive as ArchiveIcon, Calendar, Eye, RefreshCcw, Share2, Newspaper, Trash2 } from 'lucide-react';
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

type StorySection = 'family' | 'travel' | 'holidays' | 'everyday';

interface StoryArchiveProps {
  stories: ArchiveItem[];
  isLoading: boolean;
  errorMessage?: string | null;
  onPreview: (story: ArchiveItem) => void;
  onRefresh: () => void;
  onToggleShare: (storyId: string, nextValue: boolean) => void;
  onDelete: (storyId: string) => Promise<void> | void;
  onLoadMore: () => void;
  hasMore: boolean;
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

const deriveSection = (story: ArchiveItem): StorySection => {
  const source = `${story.title ?? ''} ${story.prompt ?? ''}`.toLowerCase();
  if (source.match(/holiday|christmas|hanukkah|thanksgiving|halloween/)) {
    return 'holidays';
  }
  if (source.match(/trip|travel|journey|flight|airport|beach|mountain/)) {
    return 'travel';
  }
  if (source.match(/family|grandma|grandpa|kids|mom|dad|cousin/)) {
    return 'family';
  }
  return 'everyday';
};

const getWordCount = (story: ArchiveItem) => {
  const source = [story.article, story.prompt, story.title].filter(Boolean).join(' ');
  return source.split(/\s+/).filter(Boolean).length || 0;
};

const getExcerpt = (story: ArchiveItem) => {
  const html = buildArticleHtml(story);
  const stripped = html.replace(/<[^>]+>/g, ' ');
  const words = stripped.split(/\s+/).filter(Boolean);
  return words.slice(0, 24).join(' ') + (words.length > 24 ? '…' : '');
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
  onDelete,
  onLoadMore,
  hasMore,
}: StoryArchiveProps) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [exportLoading, setExportLoading] = useState(false);
  const [sectionFilter, setSectionFilter] = useState<StorySection | 'all'>('all');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'length'>('newest');

  const decoratedStories = stories.map(
    (story) =>
    ({
      ...story,
      section: deriveSection(story),
      wordCount: getWordCount(story),
    } as ArchiveItem & { section: StorySection; wordCount: number }),
  );
  const sortedStories = [...decoratedStories].sort((a, b) => {
    const aDate = a.created_at ? new Date(a.created_at).getTime() : 0;
    const bDate = b.created_at ? new Date(b.created_at).getTime() : 0;
    if (sortBy === 'oldest') return aDate - bDate;
    if (sortBy === 'length') return b.wordCount - a.wordCount;
    return bDate - aDate;
  });
  const filteredStories = sortedStories.filter((story) =>
    sectionFilter === 'all' ? true : story.section === sectionFilter,
  );
  const isError = Boolean(errorMessage);
  const hasStories = filteredStories.length > 0;
  // Filter out sample stories and stories without titles for export
  const exportableStories = filteredStories.filter((story) => !story.isSample && story.title);
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
          <div className="story-archive__filters">
            <div>
              <p className="story-archive__filter-label">Filter by section</p>
              <div className="story-archive__chips" role="group" aria-label="Filter stories">
                {[
                  { label: 'All', value: 'all' as const },
                  { label: 'Family', value: 'family' as const },
                  { label: 'Trips', value: 'travel' as const },
                  { label: 'Holidays', value: 'holidays' as const },
                  { label: 'Everyday', value: 'everyday' as const },
                ].map((chip) => (
                  <button
                    key={chip.value}
                    className={`story-archive__chip ${sectionFilter === chip.value ? 'is-active' : ''
                      }`}
                    onClick={() => setSectionFilter(chip.value)}
                    type="button"
                  >
                    {chip.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="story-archive__sort">
              <label htmlFor="sortStories">Sort by</label>
              <select
                id="sortStories"
                value={sortBy}
                onChange={(event) =>
                  setSortBy(event.target.value as 'newest' | 'oldest' | 'length')
                }
              >
                <option value="newest">Newest</option>
                <option value="oldest">Oldest</option>
                <option value="length">Story length</option>
              </select>
            </div>
          </div>
        </div>
        <div className="story-archive__header-actions">
          <Button type="button" variant="outline" onClick={onRefresh} disabled={isLoading}>
            <RefreshCcw size={16} strokeWidth={1.75} />
            Refresh
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate('/issues')}
            disabled={isLoading}
          >
            <Newspaper size={16} strokeWidth={1.75} />
            View Issues
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
        <>
          <div className="story-archive__grid">
            {filteredStories.map((story) => (
              <article
                key={story.id}
                className="story-archive__card story-archive__card--front group hover:shadow-hard transition-all duration-300 hover:-translate-y-1"
              >
                <div className="story-archive__front">
                  <div className="story-archive__front-masthead">
                    <div>
                      <p className="story-archive__front-kicker">{story.section}</p>
                      <h3 className="group-hover:text-ink-black transition-colors">{story.title ?? 'Untitled story'}</h3>
                      <span className="story-archive__dateline">
                        <Calendar size={14} strokeWidth={1.75} />
                        {formatTimestamp(story.created_at)}
                      </span>
                    </div>
                    {story.isSample ? (
                      <Badge variant="secondary" className="story-archive__sample-badge">
                        Starter example
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="story-archive__section-badge">
                        {story.section}
                      </Badge>
                    )}
                  </div>
                  <div className="story-archive__front-body">
                    <div className="story-archive__image overflow-hidden">
                      {story.imageUrl ? (
                        <img
                          src={story.imageUrl}
                          alt={story.title ?? 'Archived story image'}
                          className="transition-transform duration-700 group-hover:scale-105"
                        />
                      ) : (
                        <div className="story-archive__image--placeholder">📰</div>
                      )}
                    </div>
                    <div className="story-archive__front-text">
                      <p className="story-archive__excerpt">{getExcerpt(story)}</p>
                      <p className="story-archive__meta">
                        ~{story.wordCount} words · Layout {story.template_id ?? 'unassigned'}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="story-archive__buttons story-archive__buttons--row">
                  <div className="story-archive__actions">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onPreview(story)}
                      className="text-ink-muted hover:text-ink"
                    >
                      <Eye size={16} className="mr-2" />
                      Read
                    </Button>

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onToggleShare(story.id, !story.is_public)}
                      className={story.is_public ? "text-green-600 hover:text-green-700" : "text-ink-muted hover:text-ink"}
                    >
                      <Share2 size={16} className="mr-2" />
                      {story.is_public ? 'Public' : 'Private'}
                    </Button>

                    {story.is_public && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleShareStory(story.id)}
                        className="text-ink-muted hover:text-ink"
                        title="Copy Link"
                      >
                        <Share2 size={16} />
                      </Button>
                    )}

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => navigate(`/newspaper?ids=${story.id}`)}
                      className="text-ink-muted hover:text-ink"
                    >
                      <Newspaper size={16} className="mr-2" />
                      Issue
                    </Button>

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={async () => {
                        const confirmed = window.confirm(
                          'Delete this story from your archive? This cannot be undone.',
                        );
                        if (!confirmed) return;
                        try {
                          await onDelete(story.id);
                          toast.success('Story deleted from your archive.');
                        } catch (error) {
                          console.error('[StoryArchive] Delete failed', error);
                          toast.error('Could not delete story. Please try again.');
                        }
                      }}
                      className="text-red-500 hover:text-red-600 hover:bg-red-50"
                    >
                      <Trash2 size={16} />
                    </Button>
                  </div>
                </div>
              </article>
            ))}
          </div>
          {hasMore && (
            <div className="flex justify-center pt-8 pb-4">
              <Button
                variant="outline"
                onClick={onLoadMore}
                disabled={isLoading}
                className="min-w-[200px]"
              >
                {isLoading ? (
                  <>
                    <RefreshCcw className="mr-2 h-4 w-4 animate-spin" />
                    Loading...
                  </>
                ) : (
                  'Load More Stories'
                )}
              </Button>
            </div>
          )}
        </>
      ) : (
        <div className="story-archive__empty">
          <p>You don’t have stories yet — let’s turn your first moment into a feature!</p>
          <Button type="button" variant="outline" onClick={onRefresh}>
            Refresh archive
          </Button>
        </div>
      )
      }
    </section >
  );
}

export default StoryArchive;
