import { useEffect, useMemo, useState } from 'react';
import { Check, Eye, X } from 'lucide-react';
import { fetchAllTemplates, getLocalTemplates } from '../lib/templates';
import { buildPreviewDocument } from '../lib/templatePreview';
import type { StoryTemplate } from '../types/story';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from './ui/dialog';
import { Button } from './ui/button';

interface TemplatesGalleryProps {
  selectedTemplateId: string | null;
  onSelect: (template: StoryTemplate) => void;
  autoSelectFirst?: boolean;
  browse?: boolean;
}
const sample = {
  title: 'A little moment makes the front page',
  article: '<p>Some days deserve a place in the family paper. A shared laugh, a new adventure, and the people who made it special.</p><p>Add your photo and tell us what happened. Your words and memories will take the place of this sample story.</p>',
  created_at: '2026-10-01T12:00:00Z',
};
function previewDocument(template: StoryTemplate) {
  return buildPreviewDocument({ ...sample, imageUrl: new URL('/images/placeholders/newspapers1.jpeg', window.location.origin).href }, template.html, template.css);
}
export function TemplatesGallery({ selectedTemplateId, onSelect, autoSelectFirst = true, browse = false }: TemplatesGalleryProps) {
  const [templates, setTemplates] = useState<StoryTemplate[]>(getLocalTemplates);
  const [query, setQuery] = useState('');
  const [preview, setPreview] = useState<StoryTemplate | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    let cancelled = false;
    setLoading(true); setError(false);
    fetchAllTemplates().then(data => { if (!cancelled) setTemplates(data); })
      .catch(() => { if (!cancelled) setError(true); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [attempt]);
  useEffect(() => {
    // Never overwrite a deliberate selection when the remote catalog arrives.
    if (autoSelectFirst && !selectedTemplateId && templates[0]) onSelect(templates[0]);
  }, [autoSelectFirst, selectedTemplateId, templates, onSelect]);
  const filtered = useMemo(() => templates.filter(t => `${t.title} ${t.description || ''}`.toLowerCase().includes(query.trim().toLowerCase())), [query, templates]);
  return <section className="template-gallery" aria-label="Newspaper templates">
    {browse && <div className="template-catalog__search"><label htmlFor="template-search">Find your edition</label><input id="template-search" type="search" value={query} onChange={event => setQuery(event.target.value)} placeholder="Try family, travel, or wedding…" /><span role="status">{filtered.length} {filtered.length === 1 ? 'layout' : 'layouts'}</span></div>}
    {loading && templates.length === 0 && <p role="status">Loading templates…</p>}
    {error && <div role="status"><p>Showing available layouts. The catalog could not refresh.</p><Button variant="outline" onClick={() => setAttempt(value => value + 1)}>Retry templates</Button></div>}
    {!loading && templates.length === 0 && <p>No templates available right now.</p>}
    {templates.length > 0 && filtered.length === 0 && <div className="templates-empty"><p>No layouts match “{query}”.</p><Button variant="outline" onClick={() => setQuery('')}>Clear search</Button></div>}
    <div className="template-gallery__grid">
      {filtered.map(template => <article key={template.id} className={`template-card template-card--layout ${template.id === selectedTemplateId ? 'template-card--active' : ''}`}>
        {browse && <div className="template-card__sample" aria-hidden="true"><iframe title={`Sample: ${template.title}`} tabIndex={-1} sandbox="" loading="lazy" srcDoc={previewDocument(template)} /></div>}
        <div className="template-card__details">
          <span className="template-card__badge">{template.isSystem ? 'Editorial collection' : 'Community layout'}</span>
          <h3 className="template-card__title">{template.title}</h3>
          <p className="template-card__body">{template.description || 'An editorial layout for your next memorable story.'}</p>
          <div className="template-card__actions">
            <Button variant="outline" size="sm" onClick={() => setPreview(template)} aria-label={`Preview ${template.title}`}><Eye size={15} /> Preview</Button>
            <Button size="sm" aria-label={`${browse ? 'Use' : 'Select'} ${template.title}`} aria-pressed={browse ? undefined : selectedTemplateId === template.id} onClick={() => onSelect(template)}>{selectedTemplateId === template.id && <Check size={15} />}{browse ? 'Use template' : selectedTemplateId === template.id ? 'Selected' : 'Select'}</Button>
          </div>
        </div>
      </article>)}
    </div>
    <Dialog open={Boolean(preview)} onOpenChange={open => { if (!open) setPreview(null); }}>
      <DialogContent className="template-preview-dialog">
        <header><div><DialogTitle>{preview?.title}</DialogTitle><DialogDescription>Sample story. Your photo and writing will appear in this layout.</DialogDescription></div><Button variant="ghost" aria-label="Close template preview" onClick={() => setPreview(null)}><X size={20} /></Button></header>
        {preview && <iframe title={`Template preview: ${preview.title}`} sandbox="" srcDoc={previewDocument(preview)} />}
        <footer><p>Story layouts carry into your reader. Combined newspapers use the print layout.</p><Button onClick={() => { if (preview) onSelect(preview); setPreview(null); }}>{browse ? 'Use this template' : 'Select this template'}</Button></footer>
      </DialogContent>
    </Dialog>
  </section>;
}
export default TemplatesGallery;
