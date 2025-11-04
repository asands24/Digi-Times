import { useEffect, useState } from 'react';
import { Save, X } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { TemplatesGallery } from './TemplatesGallery';
import type { StoryRecord, StoryTemplate } from '../types/story';
import type { GeneratedArticle } from '../utils/storyGenerator';

interface StoryEditorDialogProps {
  story: StoryRecord | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (
    storyId: string,
    payload: {
      prompt: string;
      article: GeneratedArticle;
      templateId: string | null;
      template?: StoryTemplate | null;
    },
  ) => void;
}

export function StoryEditorDialog({
  story,
  open,
  onOpenChange,
  onSave,
}: StoryEditorDialogProps) {
  const [headline, setHeadline] = useState('');
  const [subheadline, setSubheadline] = useState('');
  const [byline, setByline] = useState('');
  const [dateline, setDateline] = useState('');
  const [quote, setQuote] = useState('');
  const [bodyText, setBodyText] = useState('');
  const [prompt, setPrompt] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState<StoryTemplate | null>(null);

  useEffect(() => {
    if (!story) {
      return;
    }

    setHeadline(story.article.headline);
    setSubheadline(story.article.subheadline);
    setByline(story.article.byline);
    setDateline(story.article.dateline);
    setQuote(story.article.quote);
    setBodyText(story.article.body.join('\n\n'));
    setPrompt(story.prompt);
    setSelectedTemplate(story.template ?? null);
  }, [story]);

  if (!story) {
    return null;
  }

  const handleSave = () => {
    const body = bodyText
      .split('\n')
      .map((paragraph) => paragraph.trim())
      .filter(Boolean);

    onSave(story.id, {
      prompt,
      article: {
        headline: headline.trim(),
        subheadline: subheadline.trim(),
        byline: byline.trim(),
        dateline: dateline.trim(),
        body: body.length > 0 ? body : story.article.body,
        quote: quote.trim() || story.article.quote,
        tags: story.article.tags,
      },
      templateId: selectedTemplate?.id ?? story.templateId ?? null,
      template: selectedTemplate ?? story.template ?? null,
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="story-editor">
        <DialogHeader>
          <DialogTitle>Edit story details</DialogTitle>
          <DialogDescription>
            Fine-tune the headline, subheadline, and body to perfectly match the memory.
          </DialogDescription>
          {selectedTemplate ? (
            <span className="story-editor__template-badge">
              Layout: {selectedTemplate.title}
            </span>
          ) : null}
        </DialogHeader>

        <div className="story-editor__form">
          <label>
            <span>Headline</span>
            <input
              type="text"
              value={headline}
              onChange={(event) => setHeadline(event.target.value)}
            />
          </label>
          <label>
            <span>Subheadline</span>
            <input
              type="text"
              value={subheadline}
              onChange={(event) => setSubheadline(event.target.value)}
            />
          </label>
          <div className="story-editor__grid">
            <label>
              <span>Byline</span>
              <input
                type="text"
                value={byline}
                onChange={(event) => setByline(event.target.value)}
              />
            </label>
            <label>
              <span>Dateline</span>
              <input
                type="text"
                value={dateline}
                onChange={(event) => setDateline(event.target.value)}
              />
            </label>
          </div>
          <label>
            <span>Feature quote</span>
            <textarea
              rows={2}
              value={quote}
              onChange={(event) => setQuote(event.target.value)}
            />
          </label>
          <label>
            <span>Article body</span>
            <textarea
              rows={8}
              value={bodyText}
              onChange={(event) => setBodyText(event.target.value)}
              placeholder="Separate paragraphs with a blank line."
            />
          </label>
          <label>
            <span>Story idea</span>
            <textarea
              rows={2}
              value={prompt}
              onChange={(event) => setPrompt(event.target.value)}
            />
          </label>
        </div>

        <TemplatesGallery
          selectedTemplateId={selectedTemplate?.id ?? story.templateId ?? null}
          onSelect={setSelectedTemplate}
          autoSelectFirst={false}
        />

        <DialogFooter className="story-editor__footer">
          <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
            <X size={16} strokeWidth={1.75} />
            Cancel
          </Button>
          <Button type="button" onClick={handleSave}>
            <Save size={16} strokeWidth={1.75} />
            Save changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default StoryEditorDialog;
