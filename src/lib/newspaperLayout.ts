import { storyPhotos, type PhotoStory } from './storyPhotos';
import jsPDF from 'jspdf';
import { sanitizeHtml } from '../utils/sanitizeHtml';
import { getHistorySelection } from '../data/historicalEvents';

export type PaperSize = 'a4' | 'letter';
export interface EditionStory extends PhotoStory { id: string; title: string | null; article: string | null; prompt: string | null; imageUrl: string | null; created_at: string; }
export interface EditionOptions { title: string; paper: PaperSize; showHistory: boolean; date: string; }
export interface TextBlock { kind: 'text'; x: number; y: number; width: number; text: string; size: number; lineHeight: number; bold?: boolean; }
export interface ImageBlock { kind: 'image'; x: number; y: number; width: number; height: number; url: string; alt: string; }
export type PaperBlock = TextBlock | ImageBlock;
export interface EditionLayout { width: number; height: number; pages: PaperBlock[][]; options: EditionOptions; }
const MARGIN = 36;

// Decode entities and retain paragraph/list boundaries, without injecting article HTML.
export function articleParagraphs(story: EditionStory): string[] {
  const doc = new DOMParser().parseFromString(sanitizeHtml(story.article || ''), 'text/html');
  doc.querySelectorAll('p,div,h1,h2,h3,h4,h5,h6,li,br').forEach(node => node.append('\n'));
  return (doc.body.textContent || story.prompt || 'A memory worth keeping.')
    .split('\n').map(text => text.replace(/\s+/g, ' ').trim()).filter(Boolean);
}

/** One measured layout drives the preview, browser print and text-based PDF. Units are points. */
export function layoutEdition(stories: EditionStory[], options: EditionOptions): EditionLayout {
  const width = options.paper === 'letter' ? 612 : 595.28;
  const height = options.paper === 'letter' ? 792 : 841.89;
  const colWidth = (width - MARGIN * 2 - 24) / 2;
  const bottom = height - 54;
  const measure = new jsPDF({ unit: 'pt', format: options.paper });
  const pages: PaperBlock[][] = [[]];
  let page = 0, column = 0, y = 128;
  const top = () => page === 0 ? 128 : 100;
  const x = () => MARGIN + column * (colWidth + 24);
  const nextColumn = () => { column++; if (column === 2) { column = 0; page++; pages.push([]); } y = top(); };
  const lines = (text: string, size: number, bold = false, available = colWidth): string[] => {
    // Browser print can cover scripts/emoji that the downloadable PDF's core fonts cannot.
    if (/[^\u0020-\u00ff\u2013-\u2014\u2018-\u201d\u2022\u2026\u20ac]/.test(text) && typeof CanvasRenderingContext2D !== 'undefined') {
      const context = document.createElement('canvas').getContext('2d');
      if (context) {
        context.font = `${bold ? 'bold ' : ''}${size}px "Times New Roman", Times, serif`;
        const wrapped: string[] = [];
        let current = '';
        for (const word of text.split(/\s+/)) {
          const candidate = current ? `${current} ${word}` : word;
          if (context.measureText(candidate).width <= available) { current = candidate; continue; }
          if (current) wrapped.push(current);
          current = '';
          for (const character of Array.from(word)) {
            if (current && context.measureText(current + character).width > available) { wrapped.push(current); current = ''; }
            current += character;
          }
        }
        if (current) wrapped.push(current);
        return wrapped;
      }
    }
    measure.setFont('times', bold ? 'bold' : 'normal'); measure.setFontSize(size);
    return measure.splitTextToSize(text, available);
  };
  const line = (text: string, size: number, lineHeight: number, bold = false) => {
    if (y + lineHeight > bottom) nextColumn();
    pages[page].push({ kind: 'text', x: x(), y, width: colWidth, text, size, lineHeight, bold });
    y += lineHeight;
  };
  const text = (value: string, size = 11.5, leading = 16, bold = false) => lines(value, size, bold).forEach(value => line(value, size, leading, bold));
  const writeStory = (story: EditionStory, history = false) => {
    const photos = storyPhotos(story);
    const heading = story.title || 'Untitled Story';
    const headingLines = lines(heading, 20, true);
    const initialHeight = Math.min(headingLines.length, 5) * 24 + (photos.length ? 166 : 0) + 48;
    if (y > top() && y + initialHeight > bottom) nextColumn();
    text(heading, 20, 24, true);
    text(history ? 'LITTLE WONDERS FROM HISTORY' : new Date(story.created_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }), 9, 14);
    y += 6;
    // Place every photo, advancing columns/pages rather than dropping overflow.
    // Portraits take a taller slot; paired landscapes share rows for larger sets.
    for (let index = 0; index < photos.length;) {
      const photo = photos[index];
      const portrait = Boolean(photo.width && photo.height && photo.height > photo.width);
      const paired = photos.length >= 4 && !portrait && index + 1 < photos.length && !(photos[index + 1].height! > photos[index + 1].width!);
      const count = paired ? 2 : 1;
      const slotWidth = paired ? (colWidth - 10) / 2 : colWidth;
      const slotHeight = portrait ? Math.min(290, slotWidth * (photo.height! / photo.width!)) : paired ? 115 : 175;
      if (y + slotHeight + 10 > bottom) { nextColumn(); text(`${heading} (photos continued)`, 10, 14, true); y += 6; }
      for (let offset = 0; offset < count; offset++) {
        pages[page].push({ kind: 'image', x: x() + offset * (slotWidth + 10), y, width: slotWidth, height: slotHeight, url: photos[index + offset].url, alt: `${heading} — photo ${index + offset + 1}` });
      }
      index += count; y += slotHeight + 10;
    }
    const paragraphs = articleParagraphs(story);
    paragraphs.forEach(paragraph => {
      const paragraphLines = lines(paragraph, 11.5);
      paragraphLines.forEach((value, i) => {
        if (y + 16 > bottom || (i === 0 && paragraphLines.length > 1 && y + 32 > bottom)) {
          nextColumn();
          text(`${heading} (continued)`, 10, 14, true); y += 6;
        }
        line(value, 11.5, 16);
      });
      y += 8;
    });
    y += 18;
  };
  stories.forEach(story => writeStory(story));
  if (options.showHistory && stories.length) {
    const { exact, nearby } = getHistorySelection(new Date(stories[0].created_at));
    if (exact.length || nearby.length) {
      const describe = (event: typeof exact[number]) => `${event.month}/${event.day}, ${event.year}: ${event.description}`;
      const history = [exact.map(describe).join('\n'), nearby.length ? `${exact.length ? 'Elsewhere this month:\n' : ''}${nearby.map(describe).join('\n')}` : ''].filter(Boolean).join('\n');
      writeStory({ id: 'history', title: exact.length ? 'On This Day in History' : 'This Month in History', article: null, prompt: history, imageUrl: null, created_at: stories[0].created_at }, true);
    }
  }
  // Repeat the masthead and page folio without consuming article space.
  pages.forEach((blocks, index) => {
    const full = width - 2 * MARGIN;
    const heading = index === 0 ? 'DIGITIMES' : 'DIGITIMES · THE FAMILY EDITION';
    const header: TextBlock[] = [{ kind: 'text', x: MARGIN, y: 28, width: full, text: heading, size: index === 0 ? 42 : 18, lineHeight: index === 0 ? 48 : 24, bold: true }];
    let titleSize = 12;
    let titleLines = lines(options.title.trim() || 'My Daily Edition', titleSize, true, full);
    while (titleLines.length > 2 && titleSize > 6) { titleSize -= 0.5; titleLines = lines(options.title.trim() || 'My Daily Edition', titleSize, true, full); }
    titleLines.forEach((value, i) => header.push({ kind: 'text', x: MARGIN, y: (index === 0 ? 80 : 53) + i * 14, width: full, text: value, size: titleSize, lineHeight: 14, bold: true }));
    blocks.unshift(...header);
    blocks.push({ kind: 'text', x: MARGIN, y: height - 34, width: full, text: `${options.date}  ·  Your memories, front page news  ·  ${index + 1} / ${pages.length}`, size: 9, lineHeight: 12 });
  });
  return { width, height, pages, options };
}

export function editionShareUrl(origin: string, ids: string[], options: EditionOptions): string {
  const params = new URLSearchParams({ ids: ids.join(','), title: options.title, paper: options.paper, showHistory: String(options.showHistory), date: options.date });
  return `${origin}/edition?${params}`;
}

export function savedEditionSettings(description: string | null): Pick<EditionOptions, 'paper' | 'showHistory' | 'date'> | null {
  try {
    const value = JSON.parse(description || '');
    if (value?.type !== 'digitimes-edition' || value.version !== 1 || !['a4', 'letter'].includes(value.paper) || typeof value.showHistory !== 'boolean' || !/^\d{4}-\d{2}-\d{2}$/.test(value.date) || Number.isNaN(Date.parse(value.date))) return null;
    return { paper: value.paper, showHistory: value.showHistory, date: value.date };
  } catch { return null; }
}
