import { useEffect, useRef, useState } from 'react';
import { X, BookOpen } from 'lucide-react';
import { getTemplateById } from '../lib/templates';
import { loadStoryDetails, type ArchiveItem } from '../hooks/useStoryLibrary';
import { escapeHtml } from '../utils/sanitizeHtml';
import { useAuth } from '../providers/AuthProvider';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from './ui/dialog';
import { Button } from './ui/button';
import { Link } from 'react-router-dom';
import { StoryPaper } from './StoryPaper';

interface StoryPreviewDialogProps {
  story: ArchiveItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export { buildPreviewDocument } from '../lib/templatePreview';
import { buildPreviewDocument } from '../lib/templatePreview';

export function StoryPreviewDialog({ story: selectedStory, open, onOpenChange }: StoryPreviewDialogProps) {
  // Keep the last article mounted during Radix's exit animation.
  const retainedStory = useRef<ArchiveItem | null>(selectedStory);
  if (selectedStory) retainedStory.current = selectedStory;
  const story = selectedStory ?? retainedStory.current;
  const { user } = useAuth();
  const userId = user?.id;
  const [result, setResult] = useState<{ id: string; userId?: string; fullStory?: ArchiveItem; document?: string; templateName?: string; error?: string } | null>(null);
  const [attempt, setAttempt] = useState(0);
  const [mode, setMode] = useState<'paper' | 'template'>('template');

  useEffect(() => {
    if (!open || !story) return;
    let cancelled = false;
    setResult(null);
    setMode('template');
    async function load() {
      try {
        let fullStory = story!;
        if (!fullStory.article && !fullStory.prompt && !fullStory.isSample) {
          if (!userId) throw new Error('Sign in to read your saved story.');
          const details = await loadStoryDetails(fullStory.id, userId);
          if (!details) throw new Error('This story could not be found.');
          fullStory = details;
        }
        if (!fullStory.isSample && !fullStory.is_public && fullStory.created_by !== userId) {
          throw new Error('Sign in as the story owner to read this private memory.');
        }
        if (cancelled) return;
        setResult({ id: story!.id, userId, fullStory });
        const template = fullStory.template_id ? await getTemplateById(fullStory.template_id) : null;
        const document = buildPreviewDocument(fullStory, template?.html || '<article><h1>{{headline}}</h1>{{bodyHtml}}</article>', template?.css);
        if (!cancelled) setResult({ id: story!.id, userId, fullStory, document: template ? document : undefined, templateName: template?.title });
      } catch (error) {
        if (!cancelled) setResult(previous => ({ ...previous, id: story!.id, userId, error: error instanceof Error ? error.message : 'Could not load your story.' }));
      }
    }
    void load();
    return () => { cancelled = true; };
  }, [story, open, userId, attempt]);

  const current = result?.id === story?.id && result?.userId === userId ? result : null;
  return (
    <Dialog open={open && Boolean(story)} onOpenChange={onOpenChange}>
      <DialogContent className="story-reader">
        <div className="story-reader__handle" aria-hidden />
        <header className="story-reader__header">
          <div>
            <span className="story-reader__kicker"><BookOpen size={14} aria-hidden /> The reading room</span>
            <DialogTitle>{story?.title || 'Your story'}</DialogTitle>
            <DialogDescription>A moment worth keeping. Read your newspaper below.</DialogDescription>
          </div>
          <div className="story-reader__tools">
            <Button variant="ghost" size="sm" onClick={() => onOpenChange(false)} aria-label="Close story"><X size={21} aria-hidden /></Button>
          </div>
        </header>
        {current?.error && (
          <div className="story-reader__status" role="alert">
            <p>{current.error}</p>
            <Button variant="outline" onClick={() => setAttempt(value => value + 1)}>Try again</Button>
          </div>
        )}
        {current?.fullStory ? <>
          <div className="story-reader__tabs" role="group" aria-label="Reader view">
            <Button size="sm" variant={mode === 'paper' ? 'default' : 'outline'} aria-pressed={mode === 'paper'} onClick={() => setMode('paper')}>Newspaper</Button>
            {current.document && <Button size="sm" variant={mode === 'template' ? 'default' : 'outline'} aria-pressed={mode === 'template'} onClick={() => setMode('template')}>Original template</Button>}
          </div>
          {mode === 'template' && current.document ? <iframe className="story-reader__frame" title={`Newspaper preview: ${story?.title || 'Your story'}`} sandbox="" srcDoc={current.document} /> :
            <div className="story-reader__paper"><StoryPaper headline={current.fullStory.title || 'Your story'} body={current.fullStory.article || `<p>${escapeHtml(current.fullStory.prompt || '')}</p>`} date={current.fullStory.created_at} imageUrl={current.fullStory.imageUrl} templateName={current.templateName || 'Family edition'} /></div>}
        </> : !current?.error && (
          <div className="story-reader__status" role="status"><span className="reader-skeleton" aria-hidden /><p>Opening your front page…</p></div>
        )}
        {story && !story.isSample && (
          <footer className="story-reader__footer">
            <Link className="dt-button dt-button--outline dt-button--sm" to={`/newspaper?ids=${encodeURIComponent(story.id)}`} onClick={() => onOpenChange(false)}>Open print layout</Link>
          </footer>
        )}
      </DialogContent>
    </Dialog>
  );
}

export default StoryPreviewDialog;
