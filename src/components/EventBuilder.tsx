import React, { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { Sparkles, Trash2 } from 'lucide-react';
import { Button } from './ui/button';
import toast from 'react-hot-toast';
import { useStoryLibrary } from '../hooks/useStoryLibrary';
import { useAuth } from '../providers/AuthProvider';
import { TemplatesGallery } from './TemplatesGallery';
import { SavedPhotoPicker, type ReusedPhoto } from './builder/SavedPhotoPicker';
import { PhotoUploader } from './builder/PhotoUploader';
import { StoryPromptInput } from './builder/StoryPromptInput';
import { StoryReview, StoryEntry, entryPhotos } from './builder/StoryReview';
import {
  generateArticle,
  toStoryParagraphs,
  toEditableBody,
  parseBodyDraft,
  buildBodyHtml,
  generateGroundedStory,
  StoryAuthenticationError,
} from '../utils/storyGenerator';
import { CreationSteps } from './CreationSteps';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { getTemplateById } from '../lib/templates';
import { StoryTemplate } from '../types/story';

// Simple ID generator
const createId = () => `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

const LOADING_MESSAGES = [
  'Drafting your headline…',
  'Describing visible details…',
  'Checking the spelling…',
  'Calling the editor…',
  'Developing the photos…',
  'Setting the type…',
];



export function EventBuilder({ onArchiveSaved, compactHeading = false }: { onArchiveSaved?: () => void; compactHeading?: boolean } = {}) {
  const [entries, setEntries] = useState<StoryEntry[]>([]);
  const [choosingPhotos, setChoosingPhotos] = useState(false);
  const [globalPrompt, setGlobalPrompt] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState<StoryTemplate | null>(null);
  const location = useLocation();
  const navigate = useNavigate();
  const [choosingTemplate, setChoosingTemplate] = useState(false);
  const [templateError, setTemplateError] = useState('');
  const requestedTemplate = location.pathname === '/create' ? new URLSearchParams(location.search).get('template') : null;
  useEffect(() => {
    if (!requestedTemplate) return;
    let cancelled = false;
    setTemplateError('');
    getTemplateById(requestedTemplate).then(template => {
      if (!cancelled) { setSelectedTemplate(template); setChoosingTemplate(false); }
    }).catch(() => { if (!cancelled) setTemplateError('That template could not be loaded. Choose a layout below to continue.'); });
    return () => { cancelled = true; };
  }, [requestedTemplate]);
  const chooseTemplate = useCallback((template: StoryTemplate) => {
    setSelectedTemplate(template); setChoosingTemplate(false); setTemplateError('');
    // Consume the incoming selection so a later visit cannot replay an old choice.
    if (requestedTemplate) navigate('/create', { replace: true });
  }, [requestedTemplate, navigate]);
  const savedPhotosTriggerRef = useRef<HTMLButtonElement>(null);
  const entryUrlsRef = useRef<string[]>([]);

  const { saveDraftToArchive } = useStoryLibrary();
  const { user, loading: authLoading } = useAuth();
  const previousAccountRef = useRef(user?.id);
  const currentAccountRef = useRef(user?.id);
  currentAccountRef.current = user?.id;

  const savingRef = useRef(false);
  const [savedStoryIds, setSavedStoryIds] = useState<string[]>([]);
  const [batchProgress, setBatchProgress] = useState<{ current: number; total: number } | null>(null);
  const [batchMessage, setBatchMessage] = useState('');
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
          files: entryPhotos(entry).filter(photo => photo.included).map(photo => photo.file),
          sourcePaths: entryPhotos(entry).filter(photo => photo.included).map(photo => photo.sourcePath),
          prompt: prompt,
          article: entry.article,
        },
        template,
        userId,
        headline,
        bodyHtml,
        prompt,
        onProgress: (percent) => { if (currentAccountRef.current === userId) setUploadProgress(percent); },
      });
      return result;
    } catch (error: any) {
      console.error('Save failed', error);
      return { story: null, error };
    } finally {
      if (currentAccountRef.current === params.userId) setUploadProgress(null);
    }
  };

  const getEffectivePrompt = (entry: StoryEntry, global: string) => {
    // If entry has a specific prompt (custom), use it.
    // Otherwise use global.
    // Note: In our simplified model, we mostly rely on global prompt being applied to entries.
    // But we keep this logic if we want per-story overrides later.
    if (entry.prompt.trim().length > 0) {
      return entry.prompt;
    }
    return global.trim();
  };

  const handleFiles = useCallback(
    async (fileList: FileList | null) => {
      if (savingRef.current || !currentAccountRef.current) return;
      if (!fileList || fileList.length === 0) return;

      const files = Array.from(fileList);
      const trimmedGlobalPrompt = globalPrompt.trim();

      const processed = await Promise.all(
        files.map(async (file) => {
          if (!['image/jpeg', 'image/png', 'image/webp', 'image/gif'].includes(file.type)) {
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
    entryUrlsRef.current = entries.flatMap(entry => entryPhotos(entry).map(photo => photo.previewUrl));
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
        entryPhotos(target).forEach(photo => URL.revokeObjectURL(photo.previewUrl));
      }
      return prev.filter((entry) => entry.id !== id);
    });
  }, []);

  const clearEntries = useCallback(() => {
    entryUrlsRef.current.forEach((url) => URL.revokeObjectURL(url));
    setEntries([]);
  }, []);

  useEffect(() => {
    // Release private drafts when their account signs out or switches users.
    if (previousAccountRef.current && previousAccountRef.current !== user?.id) {
      clearEntries();
      setGlobalPrompt('');
      setSelectedTemplate(null);
      setSavedStoryIds([]);
      setBatchProgress(null);
      setBatchMessage('');
      setChoosingPhotos(false);
    }
    previousAccountRef.current = user?.id;
  }, [user?.id, clearEntries]);

  useEffect(() => {
    if (!entries.length) return;
    const warnBeforeLeaving = (event: BeforeUnloadEvent) => { event.preventDefault(); event.returnValue = ''; };
    window.addEventListener('beforeunload', warnBeforeLeaving);
    return () => window.removeEventListener('beforeunload', warnBeforeLeaving);
  }, [entries.length]);

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
      if (!currentAccountRef.current || savingRef.current) return;
      const target = entries.find((entry) => entry.id === id);
      if (!target || target.status === 'generating') {
        return;
      }

      const effectivePrompt = getEffectivePrompt(target, globalPrompt);

      const photos = entryPhotos(target).filter(photo => photo.included);
      if (!photos.length) { toast.error('Include at least one photo.'); return; }
      const idea = effectivePrompt;
      const accountId = currentAccountRef.current;
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
              generationError: undefined,
              loadingLabel,

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
        try {
          const result = await generateGroundedStory(idea, photos.map(photo => photo.file));
          if (currentAccountRef.current !== accountId) return;
          const resolvedArticle = { ...localArticle, headline: result.headline, body: toStoryParagraphs(result.article) };
          setEntries(prev => prev.map(entry => entry.id === id ? { ...entry, status: 'ready', article: resolvedArticle, headlineDraft: result.headline, bodyDraft: toEditableBody(resolvedArticle), grounding: { ...result, observations: result.observations.map(observation => ({ ...observation, index: entryPhotos(target).findIndex(original => original.file === photos[observation.index]?.file) })) }, generationError: undefined } : entry));
        } catch (error) {
          if (currentAccountRef.current !== accountId) return;
          setEntries(prev => prev.map(entry => entry.id === id ? { ...entry, status: entry.article ? 'ready' : 'idle', generationError: error instanceof StoryAuthenticationError ? error.message : 'Photos could not be analyzed. Your photos, facts and edits are kept.' } : entry));
        }

      };

      void run();
    },
    [entries, globalPrompt, selectedTemplate],
  );


  const generateAllStories = useCallback(() => {
    if (!currentAccountRef.current || savingRef.current) return;
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
  const isGenerating = entries.some(entry => entry.status === 'generating');
  useEffect(() => {
    if (!isGenerating) return;
    let index = 0;
    const timer = window.setInterval(() => {
      index = (index + 1) % LOADING_MESSAGES.length;
      setEntries(prev => prev.map(entry => entry.status === 'generating' ? { ...entry, loadingLabel: LOADING_MESSAGES[index] } : entry));
    }, 2400);
    return () => window.clearInterval(timer);
  }, [isGenerating]);

  const hasDraftWithArticle = useMemo(
    () => entries.some((entry) => Boolean(entry.article)),
    [entries],
  );

  const updateEntry = (id: string, updates: Partial<StoryEntry>) => {
    setEntries((prev) =>
      prev.map((entry) => (entry.id === id ? { ...entry, ...updates } : entry))
    );
  };

  const readyEntries = entries.filter(entry => entry.status === 'ready' && entry.article);
  const isSaving = batchProgress !== null || uploadProgress !== null;
  const saveEntry = async (entry: StoryEntry, ownerId: string) => {
    if (!entry.article || currentAccountRef.current !== ownerId) return false;
    if (!(entry.headlineDraft ?? entry.article.headline).trim() || !(entry.bodyDraft ?? toEditableBody(entry.article)).trim() || !entryPhotos(entry).some(photo => photo.included)) {
      updateEntry(entry.id, { saveError: 'Add a headline, a story and at least one included photo before saving.' });
      return false;
    }
    updateEntry(entry.id, { saveError: undefined });
    const result = await handleSaveToArchive({
      entry, template: selectedTemplate, userId: ownerId,
      headline: entry.headlineDraft ?? entry.article.headline,
      bodyHtml: buildBodyHtml({ ...entry.article, body: parseBodyDraft(entry.bodyDraft, entry.article.body) }),
      prompt: entry.prompt,
    });
    if (currentAccountRef.current !== ownerId) return false;
    if (result.error || !result.story) {
      updateEntry(entry.id, { saveError: result.error?.message || 'We couldn’t confirm the save. Please retry.' });
      return false;
    }
    setSavedStoryIds(previous => [...previous, result.story!.id]);
    removeEntry(entry.id);
    return true;
  };
  const handleSaveEntry = async (entry: StoryEntry) => {
    if (!user || savingRef.current || entry.status !== 'ready') return;
    savingRef.current = true;
    const ownerId = user.id;
    try {
      const saved = await saveEntry(entry, ownerId);
      if (currentAccountRef.current !== ownerId) return;
      if (saved) { toast.success('Memory saved to your story library!'); onArchiveSaved?.(); }
      else toast.error('Could not save this story. See the retry details below.');
    } finally { savingRef.current = false; }
  };
  const handleSaveAll = async () => {
    if (!user || savingRef.current || !readyEntries.length || isGenerating) return;
    const ownerId = user.id;
    const queue = [...readyEntries];
    savingRef.current = true; setBatchMessage('');
    let saved = 0;
    try {
      for (let index = 0; index < queue.length; index++) {
        if (currentAccountRef.current !== ownerId) break;
        setBatchProgress({ current: index + 1, total: queue.length });
        if (await saveEntry(queue[index], ownerId)) saved++;
      }
      if (currentAccountRef.current === ownerId) {
        setBatchMessage(`${saved} of ${queue.length} stories saved.${saved < queue.length ? ' Unsaved stories are still below with retry details.' : ' Your stories are ready for an issue.'}`);
        if (saved) onArchiveSaved?.();
      }
    } finally {
      savingRef.current = false;
      if (currentAccountRef.current === ownerId) setBatchProgress(null);
    }
  };

  if (!user) return authLoading ? <p role="status">Checking your sign-in…</p> : <Navigate to={`/login?next=${encodeURIComponent('/create' + location.search)}`} replace />;

  return (
    <section className="front-page-studio bg-surface border border-accent-border rounded-xl shadow-soft p-4 md:p-8">
      <header className="text-center mb-10 max-w-2xl mx-auto">
        <div className="inline-flex items-center gap-2 text-accent-gold-dark font-sans text-sm uppercase tracking-widest mb-3 font-semibold">
          <Sparkles size={16} strokeWidth={2} />
          <span>Front Page Studio</span>
        </div>
        {!compactHeading && <><h2 className="font-display text-4xl md:text-5xl text-ink-black mb-4 leading-tight">
          Make a little moment headline news.
        </h2>
        <p className="text-ink-soft text-lg leading-relaxed">
          Add a photo and tell us the moment. We’ll draft the story; you make it yours.
        </p></>}
      </header>

      <CreationSteps current={uploadProgress !== null ? 4 : isGenerating ? 2 : hasDraftWithArticle ? 3 : hasEntries ? 1 : 0} />
      <div className="studio-next-step" aria-live="polite"><strong>{isSaving ? 'Keeping your memories…' : isGenerating ? 'Your stories are taking shape' : hasDraftWithArticle ? 'Review your drafts, then save them together' : hasEntries ? 'Tell us what happened' : 'Start with your photos'}</strong><p>{isSaving ? 'Keep this page open. Each successful story is added to your library; failed stories stay here for retry.' : isGenerating ? 'Each photo becomes a story unless you combined them. You can edit every word before saving.' : hasDraftWithArticle ? 'Check each headline and story below. Save all stories to create an issue from the whole batch.' : hasEntries ? 'Add names, a place and the details you know. Keep one story per photo, or combine photos into one story.' : 'Upload several photos at once or choose saved photos. We’ll guide you through facts, epic narration and saving.'}</p></div>
      {savedStoryIds.length > 0 && <div className="memory-saved" role="status"><div><strong>{savedStoryIds.length} {savedStoryIds.length === 1 ? 'story is' : 'stories are'} safely in your library.</strong><p>Next, give it a home in a family newspaper.</p></div><Link className="dt-button dt-button--primary" to={`/newspaper?ids=${savedStoryIds.join(',')}`}>Add to Newspaper →</Link><Link to="/library">View library</Link></div>}
      {entries.length > 1 && !hasDraftWithArticle && !isGenerating && <Button variant="outline" onClick={() => {
        const photos = entries.flatMap(entryPhotos);
        if (photos.length > 20) { toast.error('Combine up to 20 photos per story.'); return; }
        setEntries([{ ...entries[0], photos, prompt: Array.from(new Set([globalPrompt.trim(), ...entries.map(entry => entry.prompt.trim())].filter(Boolean))).join('\n') }]);
      }}>Combine {entries.reduce((count, entry) => count + entryPhotos(entry).length, 0)} photos into one story</Button>}
      <section className="studio-photo-sources" aria-label="Choose photo source">
        <div><h3>Already have photos here?</h3><p>Reuse saved photos for a fresh story, or choose saved stories to assemble another issue.</p></div>
        {user ? <Button ref={savedPhotosTriggerRef} variant="outline" disabled={isGenerating || isSaving} onClick={() => setChoosingPhotos(true)}>Choose saved photos</Button> : <Link to="/login">Sign in to reuse saved photos</Link>}
        <Link to="/library" target={hasEntries ? "_blank" : undefined} rel="noopener noreferrer">Create an issue from saved stories →{hasEntries && <span className="sr-only"> (opens a new tab to keep your drafts)</span>}</Link>
      </section>
      {choosingPhotos && user && <SavedPhotoPicker key={user.id} userId={user.id} returnFocus={() => savedPhotosTriggerRef.current?.focus()} onClose={() => setChoosingPhotos(false)} onAdd={(photos: ReusedPhoto[]) => {
        setEntries(previous => [...previous, ...photos.map(photo => ({ id: createId(), file: photo.file, previewUrl: photo.url, photos: [{ file: photo.file, previewUrl: photo.url, included: true, sourcePath: photo.path }], prompt: photo.facts || globalPrompt.trim(), status: 'idle' as const }))]);
        toast.success('Saved photos added. Review the facts, then draft your new story.');
      }} />}
      {/* STEP 1: UPLOAD */}
      <div className="mb-12">
        <PhotoUploader
          onFilesSelected={handleFiles}
          hasEntries={hasEntries}
          disabled={isSaving}
        />
      </div>

      <div>
      <section className="studio-layout" aria-label="Story layout">
        <div><span className="dt-eyebrow">YOUR STORY LAYOUT</span><h3>{selectedTemplate?.title || 'Choose your edition'}</h3><p>Change the design at any time. Your photos and writing stay in place.</p></div>
        <Button variant="outline" disabled={isSaving || isGenerating} aria-expanded={choosingTemplate} onClick={() => setChoosingTemplate(value => !value)}>{choosingTemplate ? 'Close layouts' : 'Change layout'}</Button>
      </section>
      {templateError && <p role="alert">{templateError}</p>}
      <div hidden={!choosingTemplate && !templateError}>
        <TemplatesGallery selectedTemplateId={selectedTemplate?.id ?? null} onSelect={chooseTemplate} autoSelectFirst={!requestedTemplate} />
      </div>
      </div>
      {hasEntries && (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-12">

          {/* STEP 2: REFINE (Prompt & Template) */}
          {entries.some(entry => entry.status === 'idle') && !isGenerating && !isSaving && (
            <div className="studio-stage">
              <div className="space-y-6">
                <StoryPromptInput
                  value={globalPrompt}
                  onChange={setGlobalPrompt}
                  onApplyToAll={applyPromptToDrafts}
                  canApplyToAll={hasDraftsWithoutPrompt && globalPrompt.trim().length > 0}
                />

                <div className="bg-blue-50 p-4 rounded-lg border border-blue-100 text-sm text-blue-800">
                  <strong>A note from the editor:</strong> Your real moment, told in an epic narrator voice. Names, places, and one little detail make it yours. AI first describes the included photos, then drafts from those observations and your confirmed facts. Unknown names, places and events are left for you to confirm.
                </div>
              </div>


            </div>
          )}

          {/* ACTION: GENERATE */}
          {entries.some(entry => entry.status === 'idle') && !isGenerating && !isSaving && (
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
          {hasEntries && (
            <div>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-display text-ink">Editor's Desk</h2>
                <Button variant="ghost" disabled={isSaving} onClick={() => { if (window.confirm('Clear these unsaved drafts?')) clearEntries(); }} className="text-red-600 hover:bg-red-50 hover:text-red-700">
                  <Trash2 size={16} className="mr-2" />
                  Clear All
                </Button>
              </div>


              <section className="studio-save-bar" aria-label="Save your stories">
                <div><strong>Review, then keep your stories</strong><p>Check names and details in each draft. Save them together, then build an issue.</p></div>
                {readyEntries.length > 1 && <Button disabled={isSaving || isGenerating} onClick={() => void handleSaveAll()}>Save all {readyEntries.length} stories</Button>}
                {batchProgress && <p role="status">Saving story {batchProgress.current} of {batchProgress.total}{uploadProgress !== null ? ` · ${uploadProgress}%` : ''}…</p>}
                {batchMessage && <p role="status">{batchMessage}</p>}
              </section>
              <div className="review-grid">
                {entries.map((entry) => (
                  <StoryReview
                    key={entry.id}
                    entry={entry}
                    onUpdate={updateEntry}
                    onRegenerate={generateStory}
                    onSave={handleSaveEntry}
                    isSaving={isSaving}
                    template={selectedTemplate}
                    canSave={Boolean(user)}
                    onRemove={removeEntry}
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
