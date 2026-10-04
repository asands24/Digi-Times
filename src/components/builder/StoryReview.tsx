import { useState } from 'react';
import { Loader2, RefreshCcw, Archive, Trash2 } from 'lucide-react';
import { Button } from '../ui/button';
import { GeneratedArticle, buildBodyHtml, parseBodyDraft } from '../../utils/storyGenerator';
import { StoryPaper } from '../StoryPaper';

export interface StoryEntry {
  id: string;
  file: File;
  previewUrl: string;
  status: 'idle' | 'generating' | 'ready';
  loadingLabel?: string;
  headlineDraft?: string;
  bodyDraft?: string;
  article?: GeneratedArticle;
  prompt: string;
}
interface StoryReviewProps {
  entry: StoryEntry;
  onUpdate: (id: string, updates: Partial<StoryEntry>) => void;
  onRegenerate: (id: string) => void;
  onSave: (entry: StoryEntry) => void;
  onRemove: (id: string) => void;
  isSaving: boolean;
  canSave: boolean;
  templateName?: string;
  toEditableBody: (article: GeneratedArticle) => string;
}
export function StoryReview({ entry, onUpdate, onRegenerate, onSave, onRemove, isSaving, canSave, templateName, toEditableBody }: StoryReviewProps) {
  const [mode, setMode] = useState<'edit' | 'preview'>('edit');
  const article = entry.article;
  return <article className="story-review">
    <div className="story-review__toolbar">
      <span>{entry.status === 'ready' ? 'Your editor’s desk' : entry.file.name}</span>
      <Button variant="ghost" size="sm" disabled={isSaving} onClick={() => onRemove(entry.id)} aria-label={`Remove ${entry.file.name}`}><Trash2 size={16} /></Button>
    </div>
    {entry.status === 'ready' && article ? <>
      <div className="story-review__tabs" role="group" aria-label="Story view">
        <Button variant={mode === 'edit' ? 'default' : 'outline'} size="sm" aria-pressed={mode === 'edit'} onClick={() => setMode('edit')}>Edit story</Button>
        <Button variant={mode === 'preview' ? 'default' : 'outline'} size="sm" aria-pressed={mode === 'preview'} onClick={() => setMode('preview')}>Newspaper preview</Button>
      </div>
      {mode === 'preview' ? <StoryPaper headline={entry.headlineDraft ?? article.headline} body={buildBodyHtml({ ...article, body: parseBodyDraft(entry.bodyDraft, article.body) })} imageUrl={entry.previewUrl} templateName={templateName} byline={article.byline} /> : <div className="story-review__editor ink-reveal">
        <img src={entry.previewUrl} alt={entry.file.name} className="upload-reveal" />
        <p className="studio-note">Make it yours. Check names and details before saving.</p>
        <label htmlFor={`headline-${entry.id}`}>Headline</label>
        <textarea id={`headline-${entry.id}`} className="story-review__headline" value={entry.headlineDraft ?? article.headline} onChange={e => onUpdate(entry.id, { headlineDraft: e.target.value })} rows={2} />
        <label htmlFor={`body-${entry.id}`}>The story</label>
        <textarea id={`body-${entry.id}`} value={entry.bodyDraft ?? toEditableBody(article)} onChange={e => onUpdate(entry.id, { bodyDraft: e.target.value })} rows={9} />
      </div>}
      <div className="story-review__actions">
        <Button variant="outline" size="sm" disabled={isSaving} onClick={() => { if (window.confirm('Write a fresh draft? This replaces your edits.')) onRegenerate(entry.id); }}><RefreshCcw size={14} /> Rewrite</Button>
        <Button disabled={isSaving || !canSave} onClick={() => onSave(entry)}>{isSaving ? <Loader2 size={16} className="animate-spin" /> : <Archive size={16} />}{isSaving ? 'Saving memory…' : 'Save Story'}</Button>
      </div>
    </> : <div className="story-review__waiting">
      <img src={entry.previewUrl} alt={entry.file.name} className="upload-reveal" />
      {entry.status === 'generating' ? <div role="status"><Loader2 className="animate-spin" size={26} /><p>{entry.loadingLabel || 'Drafting your headline…'}</p><small>There’s a front-page moment in every photo.</small></div> : <div><p>Your photo is ready. Tell us the moment above.</p><Button onClick={() => onRegenerate(entry.id)}>Generate article</Button></div>}
    </div>}
  </article>;
}
