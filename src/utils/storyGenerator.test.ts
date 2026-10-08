import { generateArticle, generateStoryFromPrompt } from './storyGenerator';

const baseOptions = {
  fileName: 'family-photo.jpg',
  capturedAt: new Date('2024-05-01T18:30:00.000Z'),
};

describe('generateArticle', () => {
  it('returns deterministic output for identical inputs', () => {
    const first = generateArticle({
      ...baseOptions,
      prompt: 'Golden hour birthday celebration at the park',
    });
    const second = generateArticle({
      ...baseOptions,
      prompt: 'Golden hour birthday celebration at the park',
    });

    expect(second).toEqual(first);
  });

  it('uses only user facts without fictional places or witnesses', () => {
    const article = generateArticle({
      ...baseOptions,
      prompt: 'Surprise anniversary party celebration',
    });

    expect(article.body).toEqual(['Surprise anniversary party celebration']);
    expect(article.quote).toBe('');
    expect(article.dateline).not.toMatch(/Ballroom|Hall|Park/);
  });
});

it('fills local fallback placeholders and returns article paragraphs without a duplicate headline', async () => {
  const originalFetch = global.fetch;
  global.fetch = jest.fn().mockRejectedValue(new Error('Offline'));
  try {
    const body = await generateStoryFromPrompt('The family made pancakes together on a sunny Sunday morning.');
    expect(body).not.toMatch(/\{(?:subject|subjectLower|tonal)\}/);
    expect(body).toBe('The family made pancakes together on a sunny Sunday morning.');
  } finally { global.fetch = originalFetch; }
});
