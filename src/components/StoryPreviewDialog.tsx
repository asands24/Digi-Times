import { useEffect } from 'react';
import toast from 'react-hot-toast';
import { getTemplateById } from '../lib/templates';
import type { ArchiveItem } from '../hooks/useStoryLibrary';
import { escapeHtml, sanitizeHtml } from '../utils/sanitizeHtml';

interface StoryPreviewDialogProps {
  story: ArchiveItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const applyTemplate = (template: string, replacements: Record<string, string>) => {
  return Object.entries(replacements).reduce((compiled, [key, value]) => {
    const pattern = new RegExp(`{{\\s*${key}\\s*}}`, 'gi');
    return compiled.replace(pattern, value);
  }, template);
};

const buildPreviewMarkup = (story: ArchiveItem, templateHtml: string) => {
  const safeBody = sanitizeHtml(story.article ?? '');
  const safeHeadline = escapeHtml(story.title ?? 'Preview');
  const safeImage = story.imageUrl ? escapeHtml(story.imageUrl) : '';

  const compiled = applyTemplate(templateHtml, {
    headline: safeHeadline,
    title: safeHeadline,
    body: safeBody,
    bodyHtml: safeBody,
    article: safeBody,
    image: safeImage,
    imageUrl: safeImage,
  });

  return sanitizeHtml(compiled);
};

const openPreviewWindow = async (story: ArchiveItem) => {
  if (!story.template_id) {
    throw new Error('Template not assigned to this story.');
  }

  const template = await getTemplateById(story.template_id);
  const win = window.open('', '_blank', 'noopener,noreferrer');
  if (!win) {
    throw new Error('Pop-up blocked. Allow pop-ups to preview the story.');
  }

  const safeBody = buildPreviewMarkup(story, template.html ?? '<article>{{bodyHtml}}</article>');
  const doc = win.document;
  const htmlEl =
    doc.documentElement ??
    doc.appendChild(doc.createElement('html')) ??
    doc.documentElement;
  const headEl =
    doc.head ??
    (() => {
      const head = doc.createElement('head');
      htmlEl.insertBefore(head, htmlEl.firstChild);
      return head;
    })();
  const bodyEl =
    doc.body ??
    (() => {
      const body = doc.createElement('body');
      htmlEl.appendChild(body);
      return body;
    })();

  headEl.innerHTML = '';
  bodyEl.innerHTML = '';

  doc.title = story.title ?? 'Preview';

  const charsetMeta = doc.createElement('meta');
  charsetMeta.setAttribute('charset', 'utf-8');
  headEl.appendChild(charsetMeta);

  const httpEquivMeta = doc.createElement('meta');
  httpEquivMeta.setAttribute('http-equiv', 'X-UA-Compatible');
  httpEquivMeta.setAttribute('content', 'IE=edge');
  headEl.appendChild(httpEquivMeta);

  const viewportMeta = doc.createElement('meta');
  viewportMeta.name = 'viewport';
  viewportMeta.content = 'width=device-width,initial-scale=1';
  headEl.appendChild(viewportMeta);

  if (template.css) {
    const styleTag = doc.createElement('style');
    styleTag.textContent = template.css;
    headEl.appendChild(styleTag);
  }

  const root = doc.createElement('div');
  root.id = 'root';
  bodyEl.appendChild(root);

  const article = doc.createElement('article');
  article.innerHTML = safeBody;

  if (story.imageUrl) {
    const figures = article.querySelectorAll('img');
    if (figures.length === 0) {
      const img = doc.createElement('img');
      img.src = story.imageUrl;
      img.alt = '';
      article.prepend(img);
    }
  }

  root.appendChild(article);
  return win;
};

export function StoryPreviewDialog({ story, open, onOpenChange }: StoryPreviewDialogProps) {
  useEffect(() => {
    if (!open || !story) {
      return;
    }

    let cancelled = false;

    const preview = async () => {
      try {
        const win = await openPreviewWindow(story);
        if (!cancelled && win) {
          win.focus();
        }
      } catch (error) {
        console.error('Preview failed', error);
        if (!cancelled) {
          toast.error(error instanceof Error ? error.message : 'Failed to open preview.');
        }
      } finally {
        if (!cancelled) {
          onOpenChange(false);
        }
      }
    };

    void preview();

    return () => {
      cancelled = true;
    };
  }, [open, onOpenChange, story]);

  return null;
}

export default StoryPreviewDialog;
