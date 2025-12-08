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

const handleShareStory = async (story: ArchiveItem) => {
  // Use slug if available, otherwise fallback to ID (though ID route might not exist for public view)
  // The plan is to use /s/:slug. If no slug, we can't really share effectively unless we added a /s/:id route, 
  // but the requirement is to use slugs.
  // If slug is missing, we might need to prompt user to toggle private/public to generate it?
  // But we just added logic to generate it on toggle.
  // If it's already public but has no slug (legacy), we might have an issue.
  // For now, let's assume slug exists or fallback to ID if we must, but the route is /s/:slug.

  const shareId = story.public_slug || story.id;
  const shareUrl = `${window.location.origin}/s/${shareId}`;

  // Try native share if available
  if (navigator.share) {
    try {
      await navigator.share({
        title: story.title || 'DigiTimes Story',
        text: 'Check out this story I created with DigiTimes!',
        url: shareUrl,
      });
      return;
    } catch (err) {
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

const SocialShareButtons = ({ story }: { story: ArchiveItem }) => {
  const shareId = story.public_slug || story.id;
  const shareUrl = encodeURIComponent(`${window.location.origin}/s/${shareId}`);
  const text = encodeURIComponent(story.title || 'Check out my story!');

  return (
    <div className="flex gap-1">
      <Button
        variant="ghost"
        size="sm"
        className="text-[#1877F2] hover:bg-[#1877F2]/10"
        onClick={() => window.open(`https://www.facebook.com/sharer/sharer.php?u=${shareUrl}`, '_blank')}
        title="Share on Facebook"
      >
        <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.791-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" /></svg>
      </Button>
      <Button
        variant="ghost"
        size="sm"
        className="text-[#1DA1F2] hover:bg-[#1DA1F2]/10"
        onClick={() => window.open(`https://twitter.com/intent/tweet?url=${shareUrl}&text=${text}`, '_blank')}
        title="Share on Twitter"
      >
        <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z" /></svg>
      </Button>
      <Button
        variant="ghost"
        size="sm"
        className="text-[#25D366] hover:bg-[#25D366]/10"
        onClick={() => window.open(`https://wa.me/?text=${text}%20${shareUrl}`, '_blank')}
        title="Share on WhatsApp"
      >
        <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.008-.57-.008-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.305-5.235c0-5.438 4.411-9.847 9.839-9.847 2.62 0 5.092 1.02 6.944 2.876 1.85 1.858 2.87 4.33 2.87 6.962 0 5.437-4.411 9.846-9.839 9.846m0-18C5.514 3.785 2 7.314 2 11.649c0 1.724.555 3.356 1.513 4.697L2.5 20.5l4.232-1.111A9.76 9.76 0 0112.051 20.5c6.537 0 11.949-5.427 11.949-11.949 0-3.178-1.24-6.165-3.49-8.411C18.26 1.24 15.274 0 12.051 0z" /></svg>
      </Button>
    </div>
  );
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

    // Check if any stories are private
    const hasPrivateStories = exportableStories.some((story) => !story.is_public);

    if (hasPrivateStories) {
      toast('📰 Building newspaper... Tip: Set stories to "Public" if you want to share this with others!', {
        duration: 5000,
        icon: '💡',
      });
    }

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
          <p style={{ fontSize: '2rem', marginBottom: '1rem' }}>🗞️</p>
          <p style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem' }}>
            Gathering your headlines...
            <span className="story-archive__loading-icon" aria-hidden="true">
              ⏳
            </span>
          </p>
          <div style={{ marginTop: '1rem', opacity: 0, animation: 'fadeIn 0.5s ease 5s forwards' }}>
            <Button variant="ghost" size="sm" onClick={() => window.location.reload()}>
              Taking too long? Reload
            </Button>
          </div>
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
                      <>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleShareStory(story)}
                          className="text-ink-muted hover:text-ink"
                          title="Copy Link"
                        >
                          <Share2 size={16} />
                        </Button>
                        <SocialShareButtons story={story} />
                      </>
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
          <p style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>📰✨</p>
          <p style={{ fontSize: '1.1rem', fontFamily: 'var(--font-display)', marginBottom: '0.5rem' }}>
            Your newsroom is ready!
          </p>
          <p style={{ color: 'var(--ink-soft)', maxWidth: '400px', margin: '0 auto 1.5rem' }}>
            Start creating stories from your photos and watch your personal newspaper come to life.
            Every memory deserves a headline!
          </p>
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
