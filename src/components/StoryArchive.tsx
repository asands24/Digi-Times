import { Calendar, Eye, RefreshCcw } from 'lucide-react';
import { Button } from './ui/button';
import type { ArchiveItem } from '../hooks/useStoryLibrary';

interface StoryArchiveProps {
  stories: ArchiveItem[];
  loading: boolean;
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

export function StoryArchive({
  stories,
  loading,
  onPreview,
  onRefresh,
  onToggleShare,
}: StoryArchiveProps) {
  const hasStories = stories.length > 0;

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
        <Button type="button" variant="outline" onClick={onRefresh} disabled={loading}>
          <RefreshCcw size={16} strokeWidth={1.75} />
          Refresh
        </Button>
      </header>

      {loading ? (
        <div className="story-archive__empty">
          <p>Loading your saved stories…</p>
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
                      />
                      Share preview
                    </label>
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
          <p>
            You haven’t saved any stories yet. Archive a generated article to see it
            appear here, or refresh if you recently saved one on another device.
          </p>
          <Button type="button" variant="outline" onClick={onRefresh}>
            Refresh archive
          </Button>
        </div>
      )}
    </section>
  );
}

export default StoryArchive;
