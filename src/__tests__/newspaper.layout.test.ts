import { articleParagraphs, layoutEdition, editionShareUrl, savedEditionSettings, EditionStory, EditionOptions } from '../lib/newspaperLayout';
import { createEditionPDF, waitForEditionImages } from '../lib/pdfExport';
const options: EditionOptions = { title: 'The Family Gazette', paper: 'a4', showHistory: false, date: '2026-09-30' };
const story: EditionStory = { id: 'one', title: 'A day worth remembering', article: '<p>First paragraph &amp; memories.</p><p>Second paragraph.</p>', prompt: 'fallback', imageUrl: null, created_at: '2026-04-16T12:00:00Z' };

it('preserves paragraphs, decodes entities and removes unsafe content', () => {
  expect(articleParagraphs({ ...story, article: '<p>Hello &amp; goodbye.</p><script>danger()</script><ul><li>Another memory</li></ul>' })).toEqual(['Hello & goodbye.', 'Another memory']);
  expect(articleParagraphs({ ...story, article: null, prompt: 'All sentences. One. Two. Three. Four. Five. Six.' }).join(' ')).toContain('Five. Six.');
});
it.each(['a4', 'letter'] as const)('keeps all long-story words within %s pages and produces native PDF text', paper => {
  const words = Array.from({ length: 1800 }, (_, i) => `memory${i}`);
  const layout = layoutEdition([{ ...story, article: `<p>${words.join(' ')}</p>` }], { ...options, paper });
  expect(layout.pages.length).toBeGreaterThan(2);
  const body = layout.pages.flat().filter(block => block.kind === 'text').map(block => block.kind === 'text' ? block.text : '').join(' ');
  words.forEach(word => expect(body.split(' ')).toContain(word));
  layout.pages.flat().forEach(block => {
    expect(block.y).toBeGreaterThanOrEqual(0);
    expect(block.y + (block.kind === 'image' ? block.height : block.lineHeight)).toBeLessThan(layout.height);
    expect(block.x + block.width).toBeLessThanOrEqual(layout.width - 35);
  });
  expect(body).toContain('(continued)');
  const pdf = createEditionPDF(layout);
  expect(pdf.getNumberOfPages()).toBe(layout.pages.length);
  expect(pdf.internal.pageSize.getHeight()).toBeCloseTo(layout.height, 1);
  expect(pdf.output()).toContain('/BaseFont /Times-Roman');
});
it('keeps photos whole, preserves selected story order and includes history only when enabled', () => {
  const stories = [story, { ...story, id: 'two', title: 'Second memory', imageUrl: 'https://example.com/photo.jpg' }];
  const layout = layoutEdition(stories, { ...options, showHistory: true });
  const blocks = layout.pages.flat();
  expect(blocks.filter(block => block.kind === 'image')).toHaveLength(1);
  const text = blocks.filter(block => block.kind === 'text').map(block => block.kind === 'text' ? block.text : '').join(' ');
  expect(text.indexOf(story.title!)).toBeLessThan(text.indexOf('Second memory'));
  expect(text).toContain('On This Day in History');
  expect(text).toContain('Giant pandas');
});
it('round trips sharing preferences and safely rejects old or malformed metadata', () => {
  const value = { ...options, title: 'Mom & Dad’s edition', paper: 'letter' as const, showHistory: false };
  const url = new URL(editionShareUrl('https://digitimes.example', ['a', 'b'], value));
  expect(url.pathname).toBe('/edition');
  expect(url.searchParams.get('ids')).toBe('a,b');
  expect(url.searchParams.get('title')).toBe(value.title);
  expect(url.searchParams.get('showHistory')).toBe('false');
  expect(url.searchParams.get('paper')).toBe('letter');
  expect(savedEditionSettings(JSON.stringify({ type: 'digitimes-edition', version: 1, ...value }))).toEqual({ paper: 'letter', showHistory: false, date: options.date });
  expect(savedEditionSettings('Old family newspaper')).toBeNull();
  expect(savedEditionSettings('{broken')).toBeNull();
});
it('does not export missing photos or silently corrupt unsupported characters', async () => {
  const element = document.createElement('div');
  const image = document.createElement('img');
  element.append(image);
  await expect(waitForEditionImages(element)).rejects.toThrow('photo could not be loaded');
  expect(() => createEditionPDF(layoutEdition([{ ...story, title: '東京' }], options))).toThrow('Print / Save PDF');
});

it('waits for a slow photo and reports a bounded load failure before export', async () => {
  jest.useFakeTimers();
  try {
    const element = document.createElement('div');const image = document.createElement('img');element.append(image);
    Object.defineProperty(image,'complete',{value:false});
    const pending = expect(waitForEditionImages(element)).rejects.toThrow('taking too long');
    await Promise.resolve();jest.advanceTimersByTime(15000);await pending;
  } finally {jest.useRealTimers();}
});
