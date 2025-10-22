import { useCallback } from 'react';
import { ExternalLink, Printer, Copy } from 'lucide-react';
import toast from 'react-hot-toast';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import type { StoryRecord } from '../types/story';

interface StoryPreviewDialogProps {
  story: StoryRecord | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function StoryPreviewDialog({
  story,
  open,
  onOpenChange,
}: StoryPreviewDialogProps) {
  const handlePrint = useCallback(() => {
    if (!story) {
      return;
    }

    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      toast.error('Pop-up blocked. Allow pop-ups to print the page.');
      return;
    }

    const doc = printWindow.document;
    doc.open();
    doc.write(
      '<!doctype html><html lang="en"><head><meta charset="utf-8"><title>Print</title></head><body></body></html>',
    );
    doc.close();

    const style = doc.createElement('style');
    style.textContent = `
      body {
        font-family: 'Libre Baskerville', serif;
        margin: 0;
        padding: 2rem;
        background: #fdfcfa;
        color: #2b241c;
      }
      .headline {
        font-family: 'Playfair Display', Georgia, serif;
        font-size: 2.75rem;
        margin-bottom: 0.75rem;
        text-transform: uppercase;
        letter-spacing: 0.08em;
      }
      .subheadline {
        font-size: 1.1rem;
        margin-bottom: 1.5rem;
      }
      .meta {
        font-size: 0.75rem;
        letter-spacing: 0.22em;
        text-transform: uppercase;
        margin-bottom: 1.25rem;
      }
      .story-image {
        width: 100%;
        border-radius: 12px;
        margin-bottom: 1.75rem;
      }
      blockquote {
        margin: 1.5rem 0;
        padding-left: 1rem;
        border-left: 3px solid #c4a574;
        font-style: italic;
      }
      .body p {
        line-height: 1.7;
        font-size: 1rem;
      }
    `;
    doc.head.appendChild(style);

    const articleNode = doc.createElement('article');
    const meta = doc.createElement('div');
    meta.className = 'meta';
    const metaParts = [story.article.dateline, story.article.byline].filter(
      (value) => Boolean(value && value.trim()),
    );
    meta.textContent = metaParts.join(' • ');
    if (meta.textContent) {
      articleNode.appendChild(meta);
    }

    const title = doc.createElement('h1');
    title.className = 'headline';
    title.textContent = story.article.headline || 'Story';
    articleNode.appendChild(title);

    const subtitle = doc.createElement('p');
    subtitle.className = 'subheadline';
    subtitle.textContent = story.article.subheadline ?? '';
    if (subtitle.textContent) {
      articleNode.appendChild(subtitle);
    }

    const imageUrl = story.image?.publicUrl ?? '';
    if (imageUrl && /^https?:\/\//i.test(imageUrl)) {
      const img = doc.createElement('img');
      img.className = 'story-image';
      img.src = imageUrl;
      img.alt =
        story.image?.caption ??
        story.article.headline ??
        'Story photo';
      articleNode.appendChild(img);
    }

    const quote = doc.createElement('blockquote');
    quote.textContent = story.article.quote ?? '';
    if (quote.textContent) {
      articleNode.appendChild(quote);
    }

    const body = doc.createElement('div');
    body.className = 'body';
    const paragraphs = Array.isArray(story.article.body)
      ? story.article.body
      : [];
    paragraphs.forEach((paragraph) => {
      const trimmed = paragraph.trim();
      if (!trimmed) {
        return;
      }
      const p = doc.createElement('p');
      p.textContent = trimmed;
      body.appendChild(p);
    });
    if (body.childNodes.length > 0) {
      articleNode.appendChild(body);
    }

    doc.body.appendChild(articleNode);

    window.setTimeout(() => {
      printWindow.focus();
      printWindow.print();
    }, 200);
  }, [story]);

  const handleCopy = useCallback(() => {
    if (!story) {
      return;
    }

    const plainText = [
      story.article.dateline,
      story.article.byline,
      story.article.headline,
      story.article.subheadline,
      '',
      story.article.body.join('\n\n'),
      '',
      `Quote: ${story.article.quote}`,
    ].join('\n');

    navigator.clipboard
      .writeText(plainText)
      .then(() => toast.success('Story copied to clipboard'))
      .catch(() => toast.error('Could not copy to clipboard'));
  }, [story]);

  if (!story) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="story-preview">
        <DialogHeader>
          <DialogTitle>{story.article.headline}</DialogTitle>
          <DialogDescription>
            {story.article.subheadline}
          </DialogDescription>
        </DialogHeader>

        <article className="story-preview__article">
          {story.image ? (
            <img
              src={story.image.publicUrl}
              alt={story.image.caption ?? story.article.headline}
            />
          ) : null}
          <div className="story-preview__meta">
            <span>{story.article.dateline}</span>
            <span>{story.article.byline}</span>
          </div>
          {story.article.body.map((paragraph, index) => (
            <p key={index}>{paragraph}</p>
          ))}
          <blockquote>{story.article.quote}</blockquote>
        </article>

        <DialogFooter className="story-preview__footer">
          <Button type="button" onClick={handlePrint}>
            <Printer size={16} strokeWidth={1.75} />
            Print layout
          </Button>
          <Button type="button" variant="outline" onClick={handleCopy}>
            <Copy size={16} strokeWidth={1.75} />
            Copy text
          </Button>
          <Button
            type="button"
            variant="ghost"
            onClick={() => onOpenChange(false)}
          >
            <ExternalLink size={16} strokeWidth={1.75} />
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default StoryPreviewDialog;
