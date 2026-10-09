import { Link } from 'react-router-dom';
import { useState } from 'react';
import { Loader2, RefreshCcw, Archive, Trash2 } from 'lucide-react';
import { Button } from '../ui/button';
import { GeneratedArticle, buildBodyHtml, parseBodyDraft } from '../../utils/storyGenerator';
import { StoryPaper } from '../StoryPaper';
import type { StoryTemplate } from '../../types/story';
import { buildPreviewDocument } from '../../lib/templatePreview';

export interface StoryEntry {
  id: string;
  file: File;
  photos?: { file: File; previewUrl: string; included: boolean; sourcePath?: string }[];
  generationError?: string;
  saveError?: string;
  grounding?: { source: string; observations: { index: number; description: string }[]; unknowns: string[] };
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
  template?: StoryTemplate | null;
  toEditableBody: (article: GeneratedArticle) => string;
}
export const entryPhotos = (entry: StoryEntry): NonNullable<StoryEntry['photos']> => entry.photos || [{ file: entry.file, previewUrl: entry.previewUrl, included: true }];

export function StoryReview({ entry, onUpdate, onRegenerate, onSave, onRemove, isSaving, canSave, template, toEditableBody }: StoryReviewProps) {
  const [mode, setMode] = useState<'edit' | 'preview'>('edit');
  const article = entry.article;
  const photos = entryPhotos(entry);
  const included = photos.filter(photo => photo.included);
  return <article className="story-review">
    <div className="story-review__toolbar">
      <span>{entry.status === 'ready' ? 'Your editor’s desk' : entry.file.name}</span>
      <Button variant="ghost" size="sm" disabled={isSaving} onClick={() => onRemove(entry.id)} aria-label={`Remove ${entry.file.name}`}><Trash2 size={16} /></Button>
    </div>
    <div className="story-photo-list" aria-label="Story photos">{photos.map((photo, index) => <figure key={`${index}-${photo.previewUrl}`}>
      <img src={photo.previewUrl} alt={photo.file.name} />
      <label><input type="checkbox" checked={photo.included} disabled={isSaving || entry.status === 'generating'} onChange={event => onUpdate(entry.id, { photos: photos.map((item, i) => i === index ? { ...item, included: event.target.checked } : item) })} /> Include photo {index + 1}</label>
    </figure>)}</div>
    <label className="story-facts" htmlFor={`facts-${entry.id}`}>Confirmed facts for this story<textarea id={`facts-${entry.id}`} value={entry.prompt} disabled={entry.status === 'generating' || isSaving} onChange={event => onUpdate(entry.id, { prompt: event.target.value })} placeholder="Names, place, date, and what happened. Leave unknown details out." /></label>
    {entry.saveError && <p role="alert">{entry.saveError} Your photos and edits are kept. Use Retry save below.</p>}
    {entry.generationError && <p role="alert">{entry.generationError} <Button disabled={isSaving || entry.status === 'generating'} onClick={() => onRegenerate(entry.id)}>Retry generation</Button> <Link to="/login?next=%2Fcreate" target="_blank" rel="noopener noreferrer">Sign in again in a new tab</Link></p>}
    {entry.grounding && <details className="story-grounding"><summary>{entry.grounding.source === 'openai' ? 'Review photo observations and missing context' : 'AI unavailable — factual starter draft'}</summary>
      <h4>Visible descriptions (check before saving)</h4><ul>{entry.grounding.observations.map(photo => <li key={photo.index}>Photo {photo.index + 1}: {photo.description}</li>)}</ul>
      <h4>Questions for you</h4><ul>{entry.grounding.unknowns.map(question => <li key={question}>{question}</li>)}</ul><p>Add answers to Confirmed facts and regenerate. Your photos are retained.</p>
    </details>}
    {entry.status === 'ready' && article ? <>
      <div className="story-review__tabs" role="group" aria-label="Story view">
        <Button variant={mode === 'edit' ? 'default' : 'outline'} size="sm" aria-pressed={mode === 'edit'} onClick={() => setMode('edit')}>Edit story</Button>
        <Button variant={mode === 'preview' ? 'default' : 'outline'} size="sm" aria-pressed={mode === 'preview'} onClick={() => setMode('preview')}>Newspaper preview</Button>
      </div>
      {mode === 'preview' ? template?.html ? <iframe className="draft-template-preview" title={`Draft preview: ${template.title}`} sandbox="" srcDoc={buildPreviewDocument({ title: entry.headlineDraft ?? article.headline, article: buildBodyHtml({ ...article, body: parseBodyDraft(entry.bodyDraft, article.body) }), imageUrl: included[0]?.previewUrl, imageUrls: included.map(photo => ({ url: photo.previewUrl })), byline: article.byline }, template.html, template.css)} /> : <StoryPaper headline={entry.headlineDraft ?? article.headline} body={buildBodyHtml({ ...article, body: parseBodyDraft(entry.bodyDraft, article.body) })} imageUrl={included[0]?.previewUrl} imageUrls={included.map(photo => ({ url: photo.previewUrl }))} templateName={template?.title} byline={article.byline} /> : <div className="story-review__editor ink-reveal">
        <p className="studio-note">Make it yours. Check names and details before saving.</p>
        <label htmlFor={`headline-${entry.id}`}>Headline</label>
        <textarea id={`headline-${entry.id}`} className="story-review__headline" disabled={isSaving} value={entry.headlineDraft ?? article.headline} onChange={e => onUpdate(entry.id, { headlineDraft: e.target.value })} rows={2} />
        <label htmlFor={`body-${entry.id}`}>The story</label>
        <textarea id={`body-${entry.id}`} disabled={isSaving} value={entry.bodyDraft ?? toEditableBody(article)} onChange={e => onUpdate(entry.id, { bodyDraft: e.target.value })} rows={9} />
      </div>}
      <div className="story-review__actions">
        <Button variant="outline" size="sm" disabled={isSaving} onClick={() => { if (window.confirm('Write a fresh draft? This replaces your edits.')) onRegenerate(entry.id); }}><RefreshCcw size={14} /> Rewrite</Button>
        <Button disabled={isSaving || !canSave || !included.length} onClick={() => onSave(entry)}>{isSaving ? <Loader2 size={16} className="animate-spin" /> : <Archive size={16} />}{isSaving ? 'Saving memory…' : entry.saveError ? 'Retry save' : 'Save Story'}</Button>
      </div>
    </> : <div className="story-review__waiting">
      {entry.status === 'generating' ? <div role="status"><Loader2 className="animate-spin" size={26} /><p>{entry.loadingLabel || 'Drafting your headline…'}</p><small>There’s a front-page moment in every photo.</small></div> : <div><p>Your photo is ready. Tell us the moment above.</p><Button disabled={isSaving || !included.length} onClick={() => onRegenerate(entry.id)}>Generate article</Button></div>}
    </div>}
  </article>;
}
