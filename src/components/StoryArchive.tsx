import { useMemo } from 'react';
import { Calendar, Download, Eye, Pencil, Trash2 } from 'lucide-react';
import { Button } from './ui/button';
import type { StoryRecord } from '../types/story';

interface StoryArchiveProps {
  stories: StoryRecord[];
  onPreview: (storyId: string) => void;
  onEdit: (storyId: string) => void;
  onRemove: (storyId: string) => void;
  onClear: () => void;
  onExport: () => void;
  stats: {
    lastUpdated: string | null;
  };
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
  onPreview,
  onEdit,
  onRemove,
  onClear,
  onExport,
  stats,
}: StoryArchiveProps) {
  const hasStories = stories.length > 0;
  const sortedStories = useMemo(
    () =>
      [...stories].sort(
        (a, b) =>
          new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
      ),
    [stories],
  );

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
        <div className="story-archive__meta">
          <span>{stories.length} saved stories</span>
          <span>Last updated: {formatTimestamp(stats.lastUpdated)}</span>
        </div>
      </header>

      <div className="story-archive__actions">
        <Button type="button" onClick={onExport} disabled={!hasStories}>
          <Download size={16} strokeWidth={1.75} />
          Export archive
        </Button>
        <Button type="button" variant="outline" onClick={onClear} disabled={!hasStories}>
          <Trash2 size={16} strokeWidth={1.75} />
          Clear archive
        </Button>
      </div>

      {hasStories ? (
        <div className="story-archive__grid">
          {sortedStories.map((story) => (
            <article key={story.id} className="story-archive__card">
              <div className="story-archive__image">
                <img src={story.image.dataUrl} alt={story.image.name} />
              </div>
              <div className="story-archive__content">
                <header>
                  <h3>{story.article.headline}</h3>
                  <p>{story.article.subheadline}</p>
                </header>
                <footer>
                  <div className="story-archive__details">
                    <span>{story.article.byline}</span>
                    <span className="story-archive__dateline">
                      <Calendar size={14} strokeWidth={1.75} />
                      {story.article.dateline}
                    </span>
                  </div>
                  <div className="story-archive__buttons">
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => onPreview(story.id)}
                    >
                      <Eye size={14} strokeWidth={1.75} />
                      Preview
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => onEdit(story.id)}
                    >
                      <Pencil size={14} strokeWidth={1.75} />
                      Edit
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      className="story-archive__remove"
                      onClick={() => onRemove(story.id)}
                    >
                      <Trash2 size={14} strokeWidth={1.75} />
                      Remove
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
            Your archive is waiting. Save a drafted story to begin building an
            edition you can print or share.
          </p>
        </div>
      )}
    </section>
  );
}

export default StoryArchive;
