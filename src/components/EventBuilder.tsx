import {
  ChangeEvent,
  DragEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  Archive,
  ImageIcon,
  Loader2,
  RefreshCcw,
  Sparkles,
  Trash2,
  Upload,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { TemplatesGallery } from './TemplatesGallery';
import { generateArticle, GeneratedArticle } from '../utils/storyGenerator';
import { persistStory } from '../hooks/useStoryLibrary';
import { getSupabase } from '../lib/supabaseClient';
import { escapeHtml } from '../utils/sanitizeHtml';
import type { StoryTemplate } from '../types/story';

const MAX_FILE_SIZE = 10 * 1024 * 1024;

interface StoryEntry {
  id: string;
  file: File;
  previewUrl: string;
  imageDataUrl: string;
  prompt: string;
  createdAt: Date;
  status: 'idle' | 'generating' | 'ready';
  article?: GeneratedArticle;
}

interface EventBuilderProps {
  onArchiveSaved?: () => Promise<unknown> | unknown;
}

const createId = () =>
  `story-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

export const __TEST__BYPASS_DEBOUNCE = process.env.NODE_ENV === 'test';

const schedule = (fn: () => void, delay: number) => {
  if (__TEST__BYPASS_DEBOUNCE) {
    fn();
    return 0;
  }
  return window.setTimeout(fn, delay);
};

const readFileAsDataUrl = (file: File) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });

const toParagraphHtml = (value: string) => {
  const trimmed = value.trim();
  if (!trimmed) {
    return '';
  }
  return `<p>${escapeHtml(trimmed)}</p>`;
};

const buildBodyHtml = (article: GeneratedArticle) => {
  const decoParts = [
    article.subheadline
      ? `<p class="dek">${escapeHtml(article.subheadline)}</p>`
      : '',
    article.dateline || article.byline
      ? `<div class="meta">${[
          article.dateline
            ? `<span class="dateline">${escapeHtml(article.dateline)}</span>`
            : '',
          article.byline
            ? `<span class="byline">${escapeHtml(article.byline)}</span>`
            : '',
        ]
          .filter(Boolean)
          .join(' ')}</div>`
      : '',
  ]
    .filter(Boolean)
    .join('');

  const body = article.body.map(toParagraphHtml).filter(Boolean).join('');
  const quote = article.quote ? `<blockquote>${escapeHtml(article.quote)}</blockquote>` : '';
  const tags =
    article.tags.length > 0
      ? `<ul class="tags">${article.tags
          .map((tag) => `<li>${escapeHtml(tag)}</li>`)
          .join('')}</ul>`
      : '';

  return [decoParts, body, quote, tags].filter(Boolean).join('');
};

export function EventBuilder({ onArchiveSaved }: EventBuilderProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [globalPrompt, setGlobalPrompt] = useState('');
  const [entries, setEntries] = useState<StoryEntry[]>([]);
  const entryUrlsRef = useRef<string[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<StoryTemplate | null>(null);

  const handleFiles = useCallback(
    async (list: FileList | null) => {
      if (!list || list.length === 0) {
        return;
      }

      const files = Array.from(list);
      if (files.length === 0) {
        return;
      }

      const processed = await Promise.all(
        files.map(async (file): Promise<StoryEntry | null> => {
          if (!file.type.startsWith('image/')) {
            toast.error(`Unsupported file: ${file.name}`);
            return null;
          }

          if (file.size > MAX_FILE_SIZE) {
            toast.error(`${file.name} is larger than 10MB`);
            return null;
          }

          try {
            const imageDataUrl = await readFileAsDataUrl(file);
            const previewUrl = URL.createObjectURL(file);
            const entry: StoryEntry = {
              id: createId(),
              file,
              previewUrl,
              imageDataUrl,
              prompt: globalPrompt.trim(),
              createdAt: new Date(),
              status: 'idle' as const,
            };
            return entry;
          } catch (error) {
            console.error('Failed to process file', error);
            toast.error(`Could not read ${file.name}`);
            return null;
          }
        }),
      );

      const validEntries = processed.filter(
        (candidate): candidate is StoryEntry => candidate !== null,
      );

      if (validEntries.length === 0) {
        return;
      }

      setEntries((prev) => [...prev, ...validEntries]);
    },
    [globalPrompt],
  );

  useEffect(() => {
    entryUrlsRef.current = entries.map((entry) => entry.previewUrl);
  }, [entries]);

  useEffect(
    () => () => {
      entryUrlsRef.current.forEach((url) => URL.revokeObjectURL(url));
    },
    [],
  );

  const onFileInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    void handleFiles(event.target.files);
    event.target.value = '';
  };

  const onDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(false);
    void handleFiles(event.dataTransfer.files);
  };

  const onDragOver = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    if (!isDragging) {
      setIsDragging(true);
    }
  };

  const onDragLeave = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(false);
  };

  const removeEntry = useCallback((id: string) => {
    setEntries((prev) => {
      const target = prev.find((entry) => entry.id === id);
      if (target) {
        URL.revokeObjectURL(target.previewUrl);
      }
      return prev.filter((entry) => entry.id !== id);
    });
  }, []);

  const clearEntries = useCallback(() => {
    entryUrlsRef.current.forEach((url) => URL.revokeObjectURL(url));
    setEntries([]);
  }, []);

  const updatePrompt = useCallback((id: string, prompt: string) => {
    setEntries((prev) =>
      prev.map((entry) =>
        entry.id === id
          ? {
              ...entry,
              prompt,
              status: entry.status === 'ready' ? 'idle' : entry.status,
              article: entry.status === 'ready' ? undefined : entry.article,
            }
          : entry,
      ),
    );
  }, []);

  const applyPromptToDrafts = useCallback(() => {
    const trimmed = globalPrompt.trim();
    if (!trimmed) {
      return;
    }

    setEntries((prev) =>
      prev.map((entry) =>
        entry.status === 'idle' && !entry.prompt.trim()
          ? { ...entry, prompt: trimmed }
          : entry,
      ),
    );
  }, [globalPrompt]);

  const generateStory = useCallback(
    (id: string) => {
      const target = entries.find((entry) => entry.id === id);
      if (!target) {
        return;
      }

      const idea = target.prompt.trim() || globalPrompt.trim();
      if (!idea) {
        toast.error('Add a story idea to guide the article.');
        return;
      }

      setEntries((prev) =>
        prev.map((entry) =>
          entry.id === id ? { ...entry, status: 'generating' } : entry,
        ),
      );

      const delay = 420 + (idea.length % 6) * 90;
      const article = generateArticle({
        prompt: idea,
        fileName: target.file.name,
        capturedAt: target.createdAt,
      });

      schedule(() => {
        setEntries((prev) =>
          prev.map((entry) =>
            entry.id === id
              ? {
                  ...entry,
                  status: 'ready',
                  article,
                }
              : entry,
          ),
        );
      }, delay);
    },
    [entries, globalPrompt],
  );

  const archiveStory = useCallback(
    async (id: string) => {
      const entry = entries.find((item) => item.id === id);
      if (!entry || entry.status !== 'ready' || !entry.article) {
        toast.error('Generate the story before archiving.');
        return;
      }

      if (!selectedTemplate) {
        toast.error('Choose a layout template before saving.');
        return;
      }

      const supabase = getSupabase();
      const { data: userRes, error: userErr } = await supabase.auth.getUser();
      if (userErr) {
        toast.error('Failed to confirm your session.');
        return;
      }

      const userId = userRes?.user?.id;
      if (!userId) {
        toast.error('You need to sign in before saving.');
        return;
      }

      try {
        await persistStory({
          file: entry.file,
          meta: {
            headline: entry.article.headline,
            bodyHtml: buildBodyHtml(entry.article),
            prompt: entry.prompt,
          },
          templateId: selectedTemplate.id,
          userId,
        });

        toast.success('Story archived in your edition.');
        removeEntry(entry.id);
        if (onArchiveSaved) {
          await onArchiveSaved();
        }
      } catch (error) {
        console.error('Failed to save:', error);
        toast.error('Could not save to archive.');
      }
    },
    [entries, onArchiveSaved, removeEntry, selectedTemplate],
  );

  const hasEntries = entries.length > 0;
  const hasDraftsWithoutPrompt = useMemo(
    () =>
      entries.some(
        (entry) => entry.status === 'idle' && entry.prompt.trim().length === 0,
      ),
    [entries],
  );

  return (
    <section className="story-builder">
      <header className="story-builder__header">
        <div className="story-builder__eyebrow">
          <Sparkles size={16} strokeWidth={1.75} />
          <span>Front Page Studio</span>
        </div>
        <h1>Transform every snapshot into a headline-worthy event.</h1>
        <p>
          Start with an idea, add a photo, and let the newsroom generator craft
          rich editorial coverage ready for your family chronicle.
        </p>
      </header>

      <div className="story-builder__controls">
        <label className="story-builder__label" htmlFor="globalPrompt">
          Story idea (optional)
        </label>
        <textarea
          id="globalPrompt"
          className="story-builder__textarea"
          placeholder="e.g. Sunset picnic celebrating grandma's 80th birthday"
          value={globalPrompt}
          onChange={(event) => setGlobalPrompt(event.target.value)}
          rows={3}
        />
        <div className="story-builder__control-actions">
          <span className="story-builder__control-hint">
            We&apos;ll pre-fill new uploads with this idea, and it shapes the
            tone of each article.
          </span>
          <Button
            type="button"
            variant="outline"
            onClick={applyPromptToDrafts}
            disabled={!hasDraftsWithoutPrompt || !globalPrompt.trim()}
          >
            <RefreshCcw size={16} strokeWidth={1.75} />
            Apply to empty drafts
          </Button>
        </div>
      </div>

      <TemplatesGallery
        selectedTemplateId={selectedTemplate?.id ?? null}
        onSelect={setSelectedTemplate}
      />

      <div
        className={`story-dropzone ${
          isDragging ? 'story-dropzone--active' : ''
        }`}
        onDrop={onDrop}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        role="button"
        tabIndex={0}
        onKeyDown={(event) => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            fileInputRef.current?.click();
          }
        }}
        aria-label="Upload photos to generate articles"
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          className="story-dropzone__input"
          onChange={onFileInputChange}
        />

        <div className="story-dropzone__icon">
          <Upload size={28} strokeWidth={1.75} />
        </div>
        <div className="story-dropzone__text">
          <strong>Drag & drop photos here</strong>
          <span>or click to browse your library</span>
        </div>
        <p className="story-dropzone__hint">
          We support JPG, PNG, and WebP files up to 10MB.
        </p>
      </div>

      {hasEntries ? (
        <>
          <div className="story-builder__actions">
            <span>
              {entries.length}{' '}
              {entries.length === 1 ? 'draft ready' : 'drafts ready'}
            </span>
            <Button variant="outline" type="button" onClick={clearEntries}>
              <Trash2 size={16} strokeWidth={1.75} />
              Clear all
            </Button>
          </div>

          <div className="story-grid">
            {entries.map((entry) => (
              <article key={entry.id} className="story-card">
                <div className="story-card__media">
                  <img
                    src={entry.previewUrl}
                    alt={entry.file.name}
                    className="story-card__image"
                  />
                  <div className="story-card__file">
                    <ImageIcon size={14} strokeWidth={1.6} />
                    <span>{entry.file.name}</span>
                  </div>
                </div>

                <div className="story-card__body">
                  <label className="story-builder__label" htmlFor={entry.id}>
                    Story angle
                  </label>
                  <textarea
                    id={entry.id}
                    className="story-builder__textarea story-card__textarea"
                    placeholder="What should we highlight about this moment?"
                    value={entry.prompt}
                    rows={3}
                    onChange={(event) =>
                      updatePrompt(entry.id, event.target.value)
                    }
                  />

                  <div className="story-card__controls">
                    <Button
                      type="button"
                      onClick={() => generateStory(entry.id)}
                      disabled={
                        entry.status === 'generating' ||
                        (!entry.prompt.trim() && !globalPrompt.trim())
                      }
                    >
                      {entry.status === 'generating' ? (
                        <>
                          <Loader2
                            className="story-card__spinner"
                            size={16}
                            strokeWidth={1.75}
                          />
                          Writing article...
                        </>
                      ) : entry.status === 'ready' ? (
                        <>
                          <RefreshCcw size={16} strokeWidth={1.75} />
                          Regenerate article
                        </>
                      ) : (
                        <>
                          <Sparkles size={16} strokeWidth={1.75} />
                          Generate article
                        </>
                      )}
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      className="story-card__remove"
                      onClick={() => removeEntry(entry.id)}
                    >
                      <Trash2 size={16} strokeWidth={1.75} />
                      Remove photo
                    </Button>
                  </div>

                  {entry.status === 'ready' && entry.article ? (
                    <div className="story-article">
                      <div className="story-article__status">
                        <Badge variant="secondary">Draft ready</Badge>
                        <span>
                          Generated{' '}
                          {entry.createdAt.toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                      <div className="story-article__template">
                        <span>Template:</span>
                        <strong>{selectedTemplate?.title ?? 'Choose a template above'}</strong>
                      </div>
                      <div className="story-article__meta">
                        <span className="story-article__dateline">
                          {entry.article.dateline}
                        </span>
                        <span className="story-article__byline">
                          {entry.article.byline}
                        </span>
                      </div>
                      <h2 className="story-article__headline">
                        {entry.article.headline}
                      </h2>
                      <p className="story-article__subheadline">
                        {entry.article.subheadline}
                      </p>
                      <blockquote className="story-article__quote">
                        {entry.article.quote}
                      </blockquote>
                      <div className="story-article__body">
                        {entry.article.body.map((paragraph, index) => (
                          <p key={index}>{paragraph}</p>
                        ))}
                      </div>
                      <div className="story-article__tags">
                        {entry.article.tags.map((tag) => (
                          <Badge key={tag} variant="outline">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                      <div className="story-article__actions">
                        <Button
                          type="button"
                          size="sm"
                          onClick={() => archiveStory(entry.id)}
                          disabled={!selectedTemplate}
                        >
                          <Archive size={14} strokeWidth={1.75} />
                          Save to archive
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() => removeEntry(entry.id)}
                        >
                          Discard draft
                        </Button>
                      </div>
                    </div>
                  ) : null}
                </div>
              </article>
            ))}
          </div>
        </>
      ) : (
        <div className="story-builder__empty">
          <ImageIcon size={48} strokeWidth={1.4} />
          <p>
            Start by uploading a photo and we&apos;ll take it from there with a
            fully written feature spread.
          </p>
        </div>
      )}
    </section>
  );
}

export default EventBuilder;
