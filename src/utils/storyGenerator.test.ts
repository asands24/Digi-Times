import { generateArticle } from './storyGenerator';

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

  it('selects celebration palette for party prompts', () => {
    const article = generateArticle({
      ...baseOptions,
      prompt: 'Surprise anniversary party celebration',
    });

    expect(article.tags).toContain('Celebrations');
    expect(article.body.length).toBeGreaterThanOrEqual(3);
  });
});
