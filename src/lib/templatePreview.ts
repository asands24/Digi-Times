import { escapeHtml, sanitizeHtml } from '../utils/sanitizeHtml';

export interface PreviewStory { title?: string | null; article?: string | null; prompt?: string | null; imageUrl?: string | null; created_at?: string; byline?: string; }

export function buildPreviewDocument(story: PreviewStory, templateHtml: string, templateCss = '') {
  const body = sanitizeHtml(story.article || `<p>${escapeHtml(story.prompt || 'This story is still drafting.')}</p>`);
  const title = escapeHtml(story.title || 'Untitled story');
  const image = escapeHtml(story.imageUrl || '');
  const replacements: Record<string, string> = {
    headline: title, title, body, bodyHtml: body, article: body, image, imageUrl: image,
    dateline: escapeHtml(new Date(story.created_at || Date.now()).toLocaleDateString()),
    byline: escapeHtml(story.byline || 'By the DigiTimes family desk'),
    dek: '', imageAlt: title,
  };
  // One pass prevents replacement values containing template syntax from being
  // interpreted a second time. The entire result is sanitized as well.
  const compiled = templateHtml.replace(/{{\s*(\w+)\s*}}/g, (match, key) => replacements[key] ?? match);
  let markup = sanitizeHtml(compiled);
  if (image && !/<img\b/i.test(markup)) {
    markup = sanitizeHtml(`<img src="${image}" alt="" />${markup}`);
  }
  // Isolate template CSS from the app; the sandbox forbids script execution,
  // forms, popups, and parent navigation. Also restrict document resources.
  const localImageOrigin = typeof window !== 'undefined' && ['localhost', '127.0.0.1'].includes(window.location.hostname) ? window.location.origin : '';
  const css = templateCss.replace(/</g, '\\3c ');
  return `<!doctype html><html lang="en"><head><meta charset="utf-8">
    <meta name="viewport" content="width=device-width,initial-scale=1">
    <meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src https: data: blob: ${localImageOrigin}; style-src 'unsafe-inline';">
    <title>${title}</title><style>
      *{box-sizing:border-box}body{margin:0;padding:24px;background:#fffdf8;color:#0b1d36;font-family:Georgia,serif;line-height:1.75;overflow-wrap:anywhere}
      img{max-width:100%;height:auto;border-radius:12px}h1,h2{line-height:1.2}article{max-width:760px;margin:auto}
      ${css}
    </style></head><body>${markup}</body></html>`;
}

