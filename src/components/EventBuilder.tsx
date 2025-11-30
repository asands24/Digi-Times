import React, { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { Sparkles, Trash2 } from 'lucide-react';
import { Button } from './ui/button';
import toast from 'react-hot-toast';
import { useStoryLibrary } from '../hooks/useStoryLibrary';
import { useAuth } from '../providers/AuthProvider';
import { TemplatesGallery } from './TemplatesGallery';
import { PhotoUploader } from './builder/PhotoUploader';
import { StoryPromptInput } from './builder/StoryPromptInput';
import { StoryReview, StoryEntry } from './builder/StoryReview';
import {
  generateArticle,
  toStoryParagraphs,
  toEditableBody,
  parseBodyDraft,
  buildBodyHtml,
  generateStoryFromPrompt,
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



function EventBuilder() {
  const [entries, setEntries] = useState<StoryEntry[]>([]);
  const [globalPrompt, setGlobalPrompt] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState<StoryTemplate | null>(null);
  const entryUrlsRef = useRef<string[]>([]);

  const { saveDraftToArchive } = useStoryLibrary();
  const { user } = useAuth();

  const [uploadProgress, setUploadProgress] = useState<number | null>(null);

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
      setUploadProgress(0);
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
        prompt,
        onProgress: (percent) => setUploadProgress(percent),
      });
      return result;
    } catch (error: any) {
      console.error('Save failed', error);
      return { story: null, error };
    } finally {
      setUploadProgress(null);
    }
  };

  const getEffectivePrompt = (entry: StoryEntry, global: string) => {
    // If entry has a specific prompt (custom), use it.
    // Otherwise use global.
    // Note: In our simplified model, we mostly rely on global prompt being applied to entries.
    // But we keep this logic if we want per-story overrides later.
    if (entry.prompt && entry.prompt !== global && entry.prompt.trim().length > 0) {
      return entry.prompt;
    }
    return global.trim();
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
            const previewUrl = URL.createObjectURL(file);
            // MAGIC ONBOARDING: If no prompt exists, we can default to a generic one
            // or leave it empty to prompt the user.
            // For now, we initialize with current global prompt.
            const entry: StoryEntry = {
              id: createId(),
              file,
              previewUrl,
              status: 'idle' as const,
              prompt: trimmedGlobalPrompt,
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

  const applyPromptToDrafts = useCallback(() => {
    const trimmed = globalPrompt.trim();
    if (!trimmed) {
      return;
    }

    setEntries((prev) =>
      prev.map((entry) =>
        entry.status === 'idle'
          ? { ...entry, prompt: trimmed }
          : entry,
      ),
    );
    toast.success('Story idea applied to all drafts!');
  }, [globalPrompt]);

  const generateStory = useCallback(
    (id: string) => {
      const target = entries.find((entry) => entry.id === id);
      if (!target || target.status === 'generating') {
        return;
      }

      const effectivePrompt = getEffectivePrompt(target, globalPrompt);

      // MAGIC: If no prompt, use a default "Magic" prompt
      const magicPrompt = "A wonderful moment captured in time, worthy of the front page.";
      const idea = effectivePrompt || magicPrompt;

      const entryIndex = Math.max(entries.findIndex((entry) => entry.id === id), 0);
      // We don't track generationId in the simplified type, but we can simulate it or add it back if needed.
      // For now, we just use a random loading label.
      const loadingLabel = LOADING_MESSAGES[Math.floor(Math.random() * LOADING_MESSAGES.length)];

      setEntries((prev) =>
        prev.map((entry) =>
          entry.id === id
            ? {
              ...entry,
              prompt: idea,
              status: 'generating',
              article: undefined,
              loadingLabel,
              headlineDraft: undefined,
              bodyDraft: undefined,
            }
            : entry,
        ),
      );

      const localArticle = generateArticle({
        prompt: idea,
        fileName: target.file.name,
        capturedAt: new Date(), // We don't have createdAt in simplified type, use now
        templateName: selectedTemplate?.title,
        storyIndex: entryIndex,
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
            entry.id === id
              ? {
                ...entry,
                status: 'ready',
                article: resolvedArticle,
                headlineDraft: resolvedArticle.headline,
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

    // MAGIC: We don't block on missing prompt anymore. We use the magic default.

    entries.forEach((entry) => {
      if (entry.status === 'idle') {
        generateStory(entry.id);
      }
    });
    toast.success('Generating newsroom drafts for every photo…');
  }, [entries, generateStory]);

  const hasEntries = entries.length > 0;
  const hasDraftsWithoutPrompt = useMemo(
    () =>
      entries.some(
        (entry) => entry.status === 'idle' && (!entry.prompt || entry.prompt.trim().length === 0),
      ),
    [entries],
  );
  const hasDraftWithArticle = useMemo(
    () => entries.some((entry) => Boolean(entry.article)),
    [entries],
  );

  const updateEntry = (id: string, updates: Partial<StoryEntry>) => {
    setEntries((prev) =>
      prev.map((entry) => (entry.id === id ? { ...entry, ...updates } : entry))
    );
  };

  const handleSaveEntry = (entry: StoryEntry) => {
    if (!entry.article) return;

    handleSaveToArchive({
      entry,
      template: selectedTemplate,
      userId: user?.id || '',
      headline: entry.headlineDraft ?? entry.article.headline,
      bodyHtml: buildBodyHtml({ ...entry.article, body: parseBodyDraft(entry.bodyDraft, entry.article.body) }),
      prompt: entry.prompt,
    }).then((res) => {
      if (res.error) {
        toast.error('Failed to save story');
      } else {
        toast.success('Story saved to archive!');
        removeEntry(entry.id);
      }
    });
  };

  return (
    <section className="bg-surface border border-accent-border rounded-xl shadow-soft p-4 md:p-8">
      <header className="text-center mb-10 max-w-2xl mx-auto">
        <div className="inline-flex items-center gap-2 text-accent-gold-dark font-sans text-sm uppercase tracking-widest mb-3 font-semibold">
          <Sparkles size={16} strokeWidth={2} />
          <span>Front Page Studio</span>
        </div>
        <h1 className="font-display text-4xl md:text-5xl text-ink-black mb-4 leading-tight">
          Build tomorrow’s front page.
        </h1>
        <p className="text-ink-soft text-lg leading-relaxed">
          Upload your photos and let our AI Editor draft the story.
          Review the headlines, tweak the copy, and publish to your archive.
        </p>
      </header>

      {/* STEP 1: UPLOAD */}
      <div className="mb-12">
        <PhotoUploader
          onFilesSelected={handleFiles}
          hasEntries={hasEntries}
        />
      </div>

      {hasEntries && (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-12">

          {/* STEP 2: REFINE (Prompt & Template) */}
          {!hasDraftWithArticle && (
            <div className="grid md:grid-cols-2 gap-8 items-start">
              <div className="space-y-6">
                <StoryPromptInput
                  value={globalPrompt}
                  onChange={setGlobalPrompt}
                  onApplyToAll={applyPromptToDrafts}
                  canApplyToAll={hasDraftsWithoutPrompt && globalPrompt.trim().length > 0}
                />

                <div className="bg-blue-50 p-4 rounded-lg border border-blue-100 text-sm text-blue-800">
                  <strong>✨ Magic Tip:</strong> Leave the prompt blank and we'll write a surprise story for you!
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-display text-ink">Choose a Style</h3>
                <TemplatesGallery
                  selectedTemplateId={selectedTemplate?.id ?? null}
                  onSelect={setSelectedTemplate}
                />
              </div>
            </div>
          )}

          {/* ACTION: GENERATE */}
          {!hasDraftWithArticle && (
            <div className="flex justify-center pt-4 border-t border-accent-border">
              <Button
                size="lg"
                onClick={generateAllStories}
                className="w-full md:w-auto min-w-[240px] h-14 text-lg bg-ink text-white hover:bg-ink-soft shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-0.5"
              >
                <Sparkles size={20} className="mr-2" />
                Generate Stories
              </Button>
            </div>
          )}

          {/* STEP 3: REVIEW */}
          {hasDraftWithArticle && (
            <div>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-display text-ink">Editor's Desk</h2>
                <Button variant="ghost" onClick={clearEntries} className="text-red-600 hover:bg-red-50 hover:text-red-700">
                  <Trash2 size={16} className="mr-2" />
                  Clear All
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {entries.map((entry) => (
                  <StoryReview
                    key={entry.id}
                    entry={entry}
                    onUpdate={updateEntry}
                    onRegenerate={generateStory}
                    onSave={handleSaveEntry}
                    isSaving={uploadProgress !== null}
                    toEditableBody={toEditableBody}
                  />
                ))}
              </div>
            </div>
          )}

        </div>
      )}
    </section>
  );
}

export default EventBuilder;
