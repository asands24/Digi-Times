import React, { useState, useRef, useCallback, useEffect, ChangeEvent, DragEvent, useMemo } from 'react';
import { Camera, ImageIcon, Sparkles, Trash2, RefreshCcw, Share2, Archive, Loader2 } from 'lucide-react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import toast from 'react-hot-toast';
import { useStoryLibrary } from '../hooks/useStoryLibrary';
import { useAuth } from '../providers/AuthProvider';
import { TemplatesGallery } from './TemplatesGallery';
import {
  generateArticle,
  toStoryParagraphs,
  toEditableBody,
  parseBodyDraft,
  buildBodyHtml,
  generateStoryFromPrompt,
  GeneratedArticle
} from '../utils/storyGenerator';
import { StoryTemplate } from '../types/story';

// Simple ID generator
const createId = () => `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

const LOADING_MESSAGES = [
  'Drafting your headline…',
  'Interviewing the witnesses…',
  'Checking the spelling…',
  'Calling the editor…',
  'Developing the photos…',
  'Setting the type…',
];

interface StoryEntry {
  id: string;
  file: File;
  previewUrl: string;
  imageDataUrl: string;
  prompt: string;
  promptSource: 'global' | 'custom';
  createdAt: Date;
  status: 'idle' | 'generating' | 'ready';
  generationId: number;
  article?: GeneratedArticle;
  loadingLabel?: string;
  headlineDraft?: string;
  subheadlineDraft?: string;
  bodyDraft?: string;
}

// Helper to read file as data URL
const readFileAsDataUrl = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result);
      } else {
        reject(new Error('Failed to read file'));
      }
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

function EventBuilder() {
  const [entries, setEntries] = useState<StoryEntry[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [globalPrompt, setGlobalPrompt] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState<StoryTemplate | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const entryUrlsRef = useRef<string[]>([]);
  const shareUrlRef = useRef<string | null>(null);

  const { saveDraftToArchive, stories } = useStoryLibrary();
  const { user } = useAuth();
  const hasArchivedStories = stories.length > 0;

  // Helper to save draft to archive
  const handleSaveToArchive = async (params: {
    entry: StoryEntry;
    template: StoryTemplate | null;
    userId: string;
    headline: string;
    bodyHtml: string;
    prompt: string;
  }) => {
    try {
      const { entry, template, userId, headline, bodyHtml, prompt } = params;
      const result = await saveDraftToArchive({
        entry: {
          id: entry.id,
          file: entry.file,
          prompt: prompt,
          article: entry.article,
        },
        template,
        userId,
        headline,
        bodyHtml,
        prompt
      });
      return result;
    } catch (error: any) {
      console.error('Save failed', error);
      return { story: null, error };
    }
  };

  const getEffectivePrompt = (entry: StoryEntry, global: string) => {
    if (entry.promptSource === 'custom' && entry.prompt.trim().length > 0) {
      return entry.prompt;
    }
    return global.trim();
  };

  const hasEffectivePrompt = (entry: StoryEntry, global: string) => {
    return getEffectivePrompt(entry, global).length > 0;
  };

  const getEditableArticle = (entry: StoryEntry) => {
    if (entry.status !== 'ready' || !entry.article) {
      return null;
    }
    return entry.article;
  };

  const handleFiles = useCallback(
    async (fileList: FileList | null) => {
      if (!fileList || fileList.length === 0) return;

      const files = Array.from(fileList);
      const trimmedGlobalPrompt = globalPrompt.trim();

      const processed = await Promise.all(
        files.map(async (file) => {
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
      const loadingLabel = LOADING_MESSAGES[nextGenerationId % LOADING_MESSAGES.length];

      setEntries((prev) =>
        prev.map((entry) =>
          entry.id === id
            ? {
              ...entry,
              prompt: entry.promptSource === 'global' ? effectivePrompt : entry.prompt,
              status: 'generating',
              article: undefined,
              generationId: nextGenerationId,
              loadingLabel,
              headlineDraft: undefined,
              subheadlineDraft: undefined,
              bodyDraft: undefined,
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
                headlineDraft: resolvedArticle.headline,
                subheadlineDraft: resolvedArticle.subheadline,
                bodyDraft: toEditableBody(resolvedArticle),
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

  const updateEntry = (id: string, updates: Partial<StoryEntry>) => {
    setEntries((prev) =>
      prev.map((entry) => (entry.id === id ? { ...entry, ...updates } : entry))
    );
  };

  return (
    <section className="story-builder">
      <header className="story-builder__header">
        <div className="story-builder__eyebrow">
          <Sparkles size={16} strokeWidth={1.75} />
          <span>Front Page Studio</span>
        </div>
        <h1>Build tomorrow’s front page in three guided steps.</h1>
        <p>
          Add your photo, tell us what’s happening, then review and tweak the article before saving
          it to your newspaper issue.
        </p>
      </header>

      <div className="story-steps mb-4">
        <div
          className={`story-step ${hasEntries ? 'story-step--done' : 'story-step--active'}`}
        >
          <span className="story-step__number">1</span>
          <div>
            <p className="story-step__label">Upload</p>
          </div>
        </div>
        <div
          className={`story-step ${hasDraftWithArticle ? 'story-step--done' : hasEntries ? 'story-step--active' : ''
            }`}
        >
          <span className="story-step__number">2</span>
          <div>
            <p className="story-step__label">Refine</p>
          </div>
        </div>
        <div className={`story-step ${hasDraftWithArticle ? 'story-step--active' : ''}`}>
          <span className="story-step__number">3</span>
          <div>
            <p className="story-step__label">Review</p>
          </div>
        </div>
      </div>

      {!hasEntries && (
        <div className="story-dropzone text-center py-5">
          <div className="story-dropzone__header mb-4">
            <h2 className="text-2xl font-display mb-2">Start your story</h2>
            <p className="text-muted">Select a photo from your library to get started.</p>
          </div>

          <div className="story-dropzone__actions flex justify-center gap-4 mb-4">
            <Button
              type="button"
              size="lg"
              onClick={() => fileInputRef.current?.click()}
            >
              <ImageIcon size={20} strokeWidth={1.75} className="mr-2" />
              Upload Photo
            </Button>
            <Button
              type="button"
              variant="outline"
              size="lg"
              onClick={() => cameraInputRef.current?.click()}
            >
              <Camera size={20} strokeWidth={1.75} className="mr-2" />
              Take Photo
            </Button>
          </div>
          <p className="text-sm text-muted">
            Tip: photos with people make the best stories.
          </p>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={onFileInputChange}
          />
          <input
            ref={cameraInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={onFileInputChange}
          />
        </div>
      )}

      {hasEntries && !hasDraftWithArticle && (
        <div className="step-container animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-display mb-2">Tell us what’s happening</h2>
            <p className="text-muted">Add a prompt and choose a style for your story.</p>
          </div>

          <div className="max-w-2xl mx-auto space-y-8">
            <section className="bg-surface p-6 rounded-xl border border-accent-border shadow-sm">
              <label className="block text-sm font-medium uppercase tracking-wider text-ink-muted mb-3">
                Global Story Idea
              </label>
              <textarea
                id="globalPrompt"
                className="w-full p-4 rounded-lg border border-accent-border bg-paper-soft focus:ring-2 focus:ring-ink focus:border-transparent transition-all"
                placeholder="e.g. Halloween in Navy Yard with the kids..."
                value={globalPrompt}
                onChange={(event) => setGlobalPrompt(event.target.value)}
                rows={3}
              />
              <p className="text-xs text-ink-muted mt-2 text-right">
                1–2 sentences is perfect.
              </p>

              <div className="mt-4 flex justify-end">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={applyPromptToDrafts}
                  disabled={!hasDraftsWithoutPrompt || !globalPrompt.trim()}
                >
                  <RefreshCcw size={14} className="mr-2" />
                  Apply to all drafts
                </Button>
              </div>
            </section>

            <section>
              <h3 className="text-lg font-display mb-4">Choose a Template</h3>
              <TemplatesGallery
                selectedTemplateId={selectedTemplate?.id ?? null}
                onSelect={setSelectedTemplate}
              />
            </section>

            <div className="flex justify-center pt-4">
              <Button
                size="lg"
                onClick={generateAllStories}
                className="w-full md:w-auto min-w-[200px]"
              >
                <Sparkles size={18} className="mr-2" />
                Generate Stories
              </Button>
            </div>

            <div className="text-center">
              <Button variant="ghost" onClick={clearEntries} className="text-muted">
                Start Over
              </Button>
            </div>
          </div>
        </div>
      )}

      {hasEntries && hasDraftWithArticle && (
        <div className="step-container animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="story-builder__actions mb-6 flex justify-between items-center">
            <span className="text-muted">
              {entries.length} {entries.length === 1 ? 'story' : 'stories'} ready
            </span>
            <Button variant="outline" type="button" onClick={clearEntries}>
              <Trash2 size={16} strokeWidth={1.75} className="mr-2" />
              Clear & Restart
            </Button>
          </div>

          <div className="story-grid">
            {entries.map((entry) => {
              const editableArticle = getEditableArticle(entry);

              return (
                <article key={entry.id} className="story-card">
                  <div className="story-card__media">
                    <img
                      src={entry.previewUrl}
                      alt={entry.file.name}
                      className="story-card__image"
                    />
                  </div>

                  <div className="story-card__body">
                    {entry.status === 'generating' ? (
                      <div className="py-12 text-center">
                        <Loader2 className="animate-spin mx-auto mb-4 text-accent-gold" size={32} />
                        <p className="text-lg font-display animate-pulse">
                          {entry.loadingLabel || 'Writing your story...'}
                        </p>
                      </div>
                    ) : entry.status === 'ready' && editableArticle ? (
                      <div className="story-article">
                        <div className="story-article__status mb-4">
                          <Badge variant="secondary" className="bg-green-100 text-green-800 border-green-200">
                            Ready to Publish
                          </Badge>
                        </div>

                        <div className="space-y-4">
                          <input
                            className="w-full font-display text-2xl font-bold bg-transparent border-none p-0 focus:ring-0 placeholder-ink-muted/50"
                            value={entry.headlineDraft ?? editableArticle.headline}
                            onChange={(e) => updateEntry(entry.id, { headlineDraft: e.target.value })}
                            placeholder="Headline"
                          />
                          <textarea
                            className="w-full font-serif text-base leading-relaxed bg-transparent border-none p-0 focus:ring-0 resize-none placeholder-ink-muted/50"
                            value={entry.bodyDraft ?? (entry.article ? toEditableBody(entry.article) : '')}
                            onChange={(e) => updateEntry(entry.id, { bodyDraft: e.target.value })}
                            rows={6}
                            placeholder="Story body..."
                          />
                        </div>

                        <div className="mt-6 pt-4 border-t border-accent-border flex justify-between items-center">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => generateStory(entry.id)}
                          >
                            <RefreshCcw size={14} className="mr-2" />
                            Regenerate
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => handleSaveToArchive({
                              entry,
                              template: selectedTemplate,
                              userId: user?.id || '',
                              headline: entry.headlineDraft ?? editableArticle.headline,
                              bodyHtml: buildBodyHtml({ ...editableArticle, body: parseBodyDraft(entry.bodyDraft, editableArticle.body) }),
                              prompt: entry.prompt,
                            }).then((res) => {
                              if (res.error) {
                                toast.error('Failed to save story');
                              } else {
                                toast.success('Story saved to archive!');
                                removeEntry(entry.id);
                              }
                            })}
                            disabled={!user}
                          >
                            Save to Archive
                          </Button>
                        </div>
                      </div>
                    ) : (
                      // Fallback for idle state in view mode (shouldn't happen often in this flow)
                      <div className="text-center py-8">
                        <p className="mb-4">Ready to write?</p>
                        <Button onClick={() => generateStory(entry.id)}>Generate</Button>
                      </div>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      )}
    </section>
  );
}

export default EventBuilder;
