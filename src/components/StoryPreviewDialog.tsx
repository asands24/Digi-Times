import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getTemplateById } from '../lib/templates';
import { loadStoryDetails, type ArchiveItem } from '../hooks/useStoryLibrary';
import { sanitizeHtml, escapeHtml } from '../utils/sanitizeHtml';
import { useAuth } from '../providers/AuthProvider';
import { StoryPaper } from './StoryPaper';
import { Button } from './ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';

export function StoryPreviewDialog({ story, open, onOpenChange }: { story: ArchiveItem | null; open: boolean; onOpenChange: (open: boolean) => void }) {
  const { user } = useAuth();
  const userId = user?.id;
  const [fullStory, setFullStory] = useState<ArchiveItem | null>(null);
  const [templateDocument, setTemplateDocument] = useState('');
  const [templateName, setTemplateName] = useState('Family edition');
  const [error, setError] = useState('');
  const [mode, setMode] = useState<'paper' | 'template'>('paper');
  useEffect(() => {
    if (!open || !story) return;
    let cancelled = false;
    setFullStory(null); setTemplateDocument(''); setError(''); setMode('paper'); setTemplateName('Family edition');
    async function load() {
      try {
        const details = !story!.article && !story!.prompt && userId ? await loadStoryDetails(story!.id, userId) : story;
        if (!details) throw new Error('This memory could not be loaded. Try refreshing your library.');
        if (cancelled) return;
        setFullStory(details);
        if (!details.template_id) return;
        // Preserve custom templates in an isolated document, never apply their CSS to the app.
        const template = await getTemplateById(details.template_id);
        if (cancelled) return;
        setTemplateName(template.title);
        const replacements: Record<string, string> = {
          headline: escapeHtml(details.title || 'Your story'), title: escapeHtml(details.title || 'Your story'),
          body: sanitizeHtml(details.article || ''), bodyHtml: sanitizeHtml(details.article || ''), article: sanitizeHtml(details.article || ''),
          image: escapeHtml(details.imageUrl || ''), imageUrl: escapeHtml(details.imageUrl || ''),
          dateline: escapeHtml(new Date(details.created_at).toLocaleDateString()),
        };
        const compiled = template.html.replace(/{{\s*(\w+)\s*}}/g, (_, key) => replacements[key] ?? '');
        const css = (template.css || '').replace(/<\/style/gi, '');
        setTemplateDocument(`<!doctype html><html><head><meta charset="utf-8"><meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src https: data: blob:; style-src 'unsafe-inline'; font-src 'none';"><style>body{margin:20px;background:#fffdf7;color:#212d26;font-family:Georgia,serif}img{max-width:100%;height:auto}${css}</style></head><body>${sanitizeHtml(compiled)}</body></html>`);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'We couldn’t load this preview.');
      }
    }
    void load();
    return () => { cancelled = true; };
  }, [open, story, userId]);
  return <Dialog open={open} onOpenChange={onOpenChange}><DialogContent className="story-preview-dialog">
    <DialogHeader><DialogTitle>Your front-page memory</DialogTitle><DialogDescription>Read your story, explore its original template, or add it to a printable issue.</DialogDescription></DialogHeader>
    <div className="story-review__tabs">
      <Button size="sm" variant={mode === 'paper' ? 'default' : 'outline'} onClick={() => setMode('paper')}>Newspaper</Button>
      {templateDocument && <Button size="sm" variant={mode === 'template' ? 'default' : 'outline'} onClick={() => setMode('template')}>Original template</Button>}
      <Button size="sm" variant="ghost" onClick={() => onOpenChange(false)}>Close</Button>
    </div>
    {error && <p role="alert">{error}</p>}
    {!fullStory && !error && <p role="status">Opening the family album…</p>}
    {fullStory && (mode === 'template' ? <iframe title="Original story template" sandbox="" srcDoc={templateDocument} className="template-document" /> : <StoryPaper headline={fullStory.title || 'Your story'} body={fullStory.article || `<p>${escapeHtml(fullStory.prompt || '')}</p>`} date={fullStory.created_at} imageUrl={fullStory.imageUrl} templateName={templateName} />)}
    {fullStory && <Link to={`/newspaper?ids=${fullStory.id}`} onClick={() => onOpenChange(false)}><Button>Add to Newspaper →</Button></Link>}
  </DialogContent></Dialog>;
}
export default StoryPreviewDialog;
