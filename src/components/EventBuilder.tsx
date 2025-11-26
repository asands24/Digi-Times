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
  Camera,
  ImageIcon,
  Loader2,
  RefreshCcw,
  Share2,
  Sparkles,
  Trash2,
  Upload,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { TemplatesGallery } from './TemplatesGallery';
import {
  generateArticle,
  generateStoryFromPrompt,
  GeneratedArticle,
} from '../utils/storyGenerator';
import type {
  SaveDraftToArchiveOptions,
  SaveDraftToArchiveResult,
} from '../hooks/useStoryLibrary';
import { escapeHtml } from '../utils/sanitizeHtml';
import type { StoryTemplate } from '../types/story';
import { getLocalTemplates } from '../lib/templates';
import { useAuth } from '../providers/AuthProvider';

const MAX_FILE_SIZE = 10 * 1024 * 1024;

interface StoryEntry {
  id: string;
  file: File;
  previewUrl: string;
  imageDataUrl: string;
  prompt: string;
  promptSource: 'global' | 'custom';
  createdAt: Date;
  status: 'idle' | 'generating' | 'ready';
  article?: GeneratedArticle;
  generationId: number;
}

interface EventBuilderProps {
  onArchiveSaved?: () => Promise<unknown> | unknown;
  hasArchivedStories?: boolean;
  saveDraftToArchive: (options: SaveDraftToArchiveOptions) => Promise<SaveDraftToArchiveResult>;
}

const createId = () =>
  `story-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

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

const toStoryParagraphs = (value: string) =>
  value
    .split(/\n\s*\n/g)
    .map((paragraph) => paragraph.trim())
    .filter((paragraph) => paragraph.length > 0);

const normalizePrompt = (value: string) => value.trim();

const getEffectivePrompt = (entry: StoryEntry, globalPrompt: string) => {
  const trimmedGlobal = normalizePrompt(globalPrompt);
  if (entry.promptSource === 'global') {
    return trimmedGlobal;
  }
  const trimmedEntry = normalizePrompt(entry.prompt);
  return trimmedEntry || trimmedGlobal;
};

const hasEffectivePrompt = (entry: StoryEntry, globalPrompt: string) =>
  getEffectivePrompt(entry, globalPrompt).length > 0;

export function EventBuilder({
  onArchiveSaved,
  hasArchivedStories = false,
  saveDraftToArchive,
}: EventBuilderProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const cameraInputRef = useRef<HTMLInputElement | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [globalPrompt, setGlobalPrompt] = useState('');
  const [entries, setEntries] = useState<StoryEntry[]>([]);
  const entryUrlsRef = useRef<string[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<StoryTemplate | null>(() => {
    const [firstTemplate] = getLocalTemplates();
    return firstTemplate ?? null;
  });
  const shareUrlRef = useRef<string | null>(null);
  const { user } = useAuth();

  const handleFiles = useCallback(
    async (list: FileList | null) => {
      if (!list || list.length === 0) {
        return;
      }

      const files = Array.from(list);
      if (files.length === 0) {
        return;
      }

      const trimmedGlobalPrompt = globalPrompt.trim();
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
              prompt: trimmedGlobalPrompt,
              promptSource: 'global',
              createdAt: new Date(),
              status: 'idle' as const,
              generationId: 0,
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

  const handleShareLink = useCallback(async () => {
    if (typeof window === 'undefined') {
      return;
    }
    const url =
      shareUrlRef.current ||
      (() => {
        const next = new URL(window.location.href);
        next.searchParams.set('guest', '1');
        const result = next.toString();
        shareUrlRef.current = result;
        return result;
      })();

    try {
      if (navigator.share) {
        await navigator.share({ url, title: 'DigiTimes Edition' });
      } else if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(url);
        toast.success('Share link copied');
      } else {
        toast.error('Sharing isn’t supported on this browser.');
      }
    } catch (error) {
      if (process.env.NODE_ENV !== 'production') {
        console.error('Share failed', error);
      }
    }
  }, []);

  const clearEntries = useCallback(() => {
    entryUrlsRef.current.forEach((url) => URL.revokeObjectURL(url));
    setEntries([]);
  }, []);

  const updatePrompt = useCallback((id: string, prompt: string) => {
    setEntries((prev) =>
      prev.map((entry) => {
        if (entry.id !== id) {
          return entry;
        }
        const trimmed = prompt.trim();
        const nextSource: StoryEntry['promptSource'] = trimmed.length === 0 ? 'global' : 'custom';
        return {
          ...entry,
          prompt,
          promptSource: nextSource,
          status: entry.status === 'ready' ? 'idle' : entry.status,
          article: entry.status === 'ready' ? undefined : entry.article,
        };
      }),
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
          ? { ...entry, prompt: trimmed, promptSource: 'global' }
          : entry,
      ),
    );
  }, [globalPrompt]);

  useEffect(() => {
    const trimmed = globalPrompt.trim();
    const idsToRefresh: string[] = [];
    setEntries((prev) => {
      if (prev.length === 0) {
        return prev;
      }
      let didChange = false;
      const nextEntries = prev.map((entry) => {
        if (entry.promptSource !== 'global') {
          return entry;
        }
        if (entry.prompt === trimmed) {
          return entry;
        }
        idsToRefresh.push(entry.id);
        didChange = true;
        return {
          ...entry,
          prompt: trimmed,
          status: 'idle' as const,
          article: undefined,
        };
      });
      return didChange ? nextEntries : prev;
    });

    if (idsToRefresh.length > 0) {
      const count = idsToRefresh.length;
      toast(
        count === 1
          ? 'Story idea updated—press Generate to refresh that draft.'
          : `${count} drafts updated. Press Generate on each to refresh them.`,
      );
    }
  }, [globalPrompt]);

  const generateStory = useCallback(
    (id: string) => {
      const target = entries.find((entry) => entry.id === id);
      if (!target || target.status === 'generating') {
        return;
      }

      const effectivePrompt = getEffectivePrompt(target, globalPrompt);
      const cleanFileName = target.file.name.replace(/\.[^/.]+$/, '');
      const fallbackIdea = `Front-page spotlight: ${cleanFileName || target.file.name || 'Feature'}`;
      const idea = effectivePrompt || fallbackIdea || 'Front-page spotlight';

      const entryIndex = Math.max(entries.findIndex((entry) => entry.id === id), 0);
      const nextGenerationId = target.generationId + 1;

      setEntries((prev) =>
        prev.map((entry) =>
          entry.id === id
            ? {
                ...entry,
                prompt: entry.promptSource === 'global' ? effectivePrompt : entry.prompt,
                status: 'generating',
                article: undefined,
                generationId: nextGenerationId,
              }
            : entry,
        ),
      );

      const localArticle = generateArticle({
        prompt: idea,
        fileName: target.file.name,
        capturedAt: target.createdAt,
        templateName: selectedTemplate?.title,
        storyIndex: entryIndex + nextGenerationId,
      });

      const run = async () => {
        let resolvedArticle = localArticle;
        try {
          const storyText = await generateStoryFromPrompt(idea);
          const paragraphs = toStoryParagraphs(storyText);
          if (paragraphs.length > 0) {
            resolvedArticle = {
              ...localArticle,
              body: paragraphs,
            };
          }
        } catch (error) {
          console.error('[DigiTimes] Story generation failed, using local article:', error);
        }

        setEntries((prev) =>
          prev.map((entry) =>
            entry.id === id && entry.generationId === nextGenerationId
              ? {
                  ...entry,
                  status: 'ready',
                  article: resolvedArticle,
                }
              : entry,
          ),
        );
      };

      void run();
    },
    [entries, globalPrompt, selectedTemplate],
  );


  const generateAllStories = useCallback(() => {
    if (entries.length === 0) {
      toast.error('Add at least one photo to generate an article.');
      return;
    }

    if (!globalPrompt.trim()) {
      const missingPrompt = entries.some((entry) => !entry.prompt.trim());
      if (missingPrompt) {
        toast.error('Add a story idea or fill each prompt before generating all stories.');
        return;
      }
    }

    entries.forEach((entry) => {
      if (entry.status === 'idle') {
        generateStory(entry.id);
      }
    });
    toast.success('Generating newsroom drafts for every photo…');
  }, [entries, generateStory, globalPrompt]);

  const hasEntries = entries.length > 0;
  const hasDraftsWithoutPrompt = useMemo(
    () =>
      entries.some(
        (entry) => entry.status === 'idle' && entry.prompt.trim().length === 0,
      ),
    [entries],
  );
  const hasDraftWithPrompt = useMemo(
    () => entries.some((entry) => hasEffectivePrompt(entry, globalPrompt)),
    [entries, globalPrompt],
  );
  const hasDraftWithArticle = useMemo(
    () => entries.some((entry) => Boolean(entry.article)),
    [entries],
  );
  const hasShareableDraft = hasDraftWithPrompt || hasDraftWithArticle;
  const canShareStories = hasShareableDraft || hasArchivedStories;

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
        <input
          ref={cameraInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="story-dropzone__input"
          onChange={onFileInputChange}
        />

        <div className="story-dropzone__icon">
          <Upload size={28} strokeWidth={1.75} />
        </div>
        <div className="story-dropzone__text">
          <strong>Drag & drop photos here</strong>
          <span>or use the buttons below to choose from your photo library.</span>
        </div>
        <div className="story-dropzone__actions">
          <Button
            type="button"
            className="story-dropzone__cta"
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
          >
            <ImageIcon size={16} strokeWidth={1.75} />
            Choose from photos
          </Button>
          <Button
            type="button"
            className="story-dropzone__cta"
            variant="ghost"
            onClick={() => cameraInputRef.current?.click()}
          >
            <Camera size={16} strokeWidth={1.75} />
            Take a photo
          </Button>
        </div>
        <p className="story-dropzone__hint">
          We support JPG, PNG, and WebP files up to 10MB. After uploading, add a prompt for each
          photo and press Generate to create the article.
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
                    placeholder="Describe the scene so we can write the perfect article."
                    value={entry.prompt}
                    rows={3}
                    onChange={(event) =>
                      updatePrompt(entry.id, event.target.value)
                    }
                  />
                  <p className="story-card__hint">
                    Tell us what makes this photo special, then press Generate to draft the story.
                  </p>

                  <div className="story-card__controls">
                    <Button
                      type="button"
                      onClick={() => generateStory(entry.id)}
                      disabled={
                        entry.status === 'generating' ||
                        !hasEffectivePrompt(entry, globalPrompt)
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
                          onClick={async () => {
                            console.log('[EventBuilder] Save button clicked', {
                              entryId: entry.id,
                              hasArticle: !!entry.article,
                              hasUser: !!user?.id,
                              selectedTemplate,
                            });

                            if (!entry.article) {
                              console.error('[EventBuilder] saveDraftToArchive was NOT called');
                              console.warn('[SaveToArchive] ⚠️ No article on entry, not saving');
                              return;
                            }
                            if (!user?.id) {
                              console.error('[EventBuilder] saveDraftToArchive was NOT called');
                              console.warn('[SaveToArchive] ⚠️ No user id present, require login to save');
                              toast.error('Sign in to save drafts to your archive.');
                              return;
                            }

                            const payloadPrompt = getEffectivePrompt(entry, globalPrompt);
                            const result = await saveDraftToArchive({
                              entry,
                              template: selectedTemplate,
                              userId: user.id,
                              headline: entry.article.headline,
                              bodyHtml: buildBodyHtml(entry.article),
                              prompt: payloadPrompt,
                            });

                            if (result.error) {
                              toast.error(`Could not save story: ${result.error.message}`);
                              return;
                            }

                            if (!result.story) {
                              toast.error('Could not save to archive.');
                              return;
                            }

                            toast.success('Story archived in your edition.');
                            removeEntry(entry.id);
                            if (onArchiveSaved) {
                              await onArchiveSaved();
                            }
                          }}
                          disabled={!entry.article || !user}
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

          <div className="story-bulk-actions">
            <div className="story-bulk-actions__copy">
              <strong>Generate all stories</strong>
              <p>We’ll write a draft for every photo automatically.</p>
            </div>
            <Button
              type="button"
              onClick={generateAllStories}
              disabled={!entries.some((entry) => entry.status === 'idle')}
            >
              <Sparkles size={16} strokeWidth={1.75} />
              Generate all articles
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={handleShareLink}
              disabled={!canShareStories}
            >
              <Share2 size={16} strokeWidth={1.75} />
              Share viewing link
            </Button>
            {!canShareStories ? (
              <span className="story-bulk-actions__hint">
                Add a prompt or archive a story to enable sharing.
              </span>
            ) : null}
          </div>
        </>
      ) : (
        <div className="story-builder__empty">
          <ImageIcon size={48} strokeWidth={1.4} />
          <p>
            Upload a photo, describe what&apos;s happening, and tap Generate
            to see a newsroom-ready feature appear.
          </p>
        </div>
      )}
    </section>
  );
}

export default EventBuilder;
