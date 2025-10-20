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

const createPrintMarkup = (story: StoryRecord) => `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <title>${story.article.headline}</title>
    <style>
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
    </style>
  </head>
  <body>
    <article>
      <div class="meta">${story.article.dateline} • ${story.article.byline}</div>
      <h1 class="headline">${story.article.headline}</h1>
      <p class="subheadline">${story.article.subheadline}</p>
      <img class="story-image" src="${story.image.dataUrl}" alt="${story.image.name}" />
      <blockquote>${story.article.quote}</blockquote>
      <div class="body">
        ${story.article.body.map((paragraph) => `<p>${paragraph}</p>`).join('')}
      </div>
    </article>
  </body>
</html>`;

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

    printWindow.document.open();
    printWindow.document.write(createPrintMarkup(story));
    printWindow.document.close();

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
          <img src={story.image.dataUrl} alt={story.image.name} />
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
