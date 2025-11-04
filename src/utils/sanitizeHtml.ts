import DOMPurify from 'dompurify';

const DEFAULT_ALLOWED_TAGS = [
  'a',
  'article',
  'blockquote',
  'br',
  'div',
  'em',
  'figure',
  'figcaption',
  'footer',
  'h1',
  'h2',
  'h3',
  'h4',
  'h5',
  'h6',
  'header',
  'hr',
  'img',
  'li',
  'main',
  'ol',
  'p',
  'section',
  'span',
  'strong',
  'ul',
];

const DEFAULT_ALLOWED_ATTR = ['href', 'src', 'alt', 'title', 'class', 'id', 'role', 'aria-label'];

export const escapeHtml = (value: string): string =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');

export const sanitizeHtml = (
  dirty: string,
  options: DOMPurify.Config = {},
): string => {
  if (!dirty) {
    return '';
  }

  try {
    if (typeof window === 'undefined') {
      return escapeHtml(dirty);
    }

    return DOMPurify.sanitize(dirty, {
      ALLOWED_TAGS: DEFAULT_ALLOWED_TAGS,
      ALLOWED_ATTR: DEFAULT_ALLOWED_ATTR,
      ...options,
    });
  } catch {
    // Fallback: escape everything to avoid introducing unsafe markup
    return escapeHtml(dirty);
  }
};

export const sanitize = sanitizeHtml;
