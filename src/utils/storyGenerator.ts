import { visionPhoto } from '../lib/storyPhotos';
import { escapeHtml } from './sanitizeHtml';
interface StoryGeneratorOptions {
  prompt?: string;
  fileName?: string;
  capturedAt?: Date;
  templateName?: string;
  storyIndex?: number;
}

interface GeneratedArticle {
  headline: string;
  subheadline: string;
  byline: string;
  dateline: string;
  body: string[];
  quote: string;
  tags: string[];
}

const formatDate = (value: Date) => value.toLocaleDateString('en-US');

export const generateArticle = (options: StoryGeneratorOptions): GeneratedArticle => ({
  headline: 'A moment worth keeping', subheadline: '', byline: 'By the DigiTimes desk',
  dateline: formatDate(options.capturedAt ?? new Date()),
  body: options.prompt?.trim() ? [options.prompt.trim()] : ['Add facts about this moment to begin.'],
  quote: '', tags: [],
});
export type { GeneratedArticle };
export interface GroundedStory {
  headline: string; article: string; observations: { index: number; description: string }[];
  unknowns: string[]; userFacts: string; source: 'openai' | 'local'; fallbackReason?: string;
}
export async function generateGroundedStory(facts: string, files: File[] = []): Promise<GroundedStory> {
  const images = await Promise.all(files.map(visionPhoto));
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 60000);
  try {
    const response = await fetch('/.netlify/functions/generateStory', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, signal: controller.signal,
      body: JSON.stringify({ prompt: facts.trim(), images }),
    });
    if (!response.ok) throw new Error('Story service is unavailable. Your photos and facts are kept; retry generation.');
    const result = await response.json();
    if (typeof result.headline !== 'string' || typeof result.article !== 'string') throw new Error('Invalid story response. Try again.');
    return { ...result, observations: result.observations || [], unknowns: result.unknowns || [] };
  } finally { clearTimeout(timer); }
}
// Legacy text-only callers retain a safe, explicitly factual fallback.
export async function generateStoryWithOpenAI(prompt: string): Promise<string> { return (await generateGroundedStory(prompt)).article; }
export async function generateStoryFromPrompt(prompt: string): Promise<string> {
  if (!prompt.trim()) throw new Error('Prompt is empty');
  try { return await generateStoryWithOpenAI(prompt); }
  catch { return prompt.trim(); }
}

export const toStoryParagraphs = (text: string): string[] => {
  return text.split(/\n\n+/).map(p => p.trim()).filter(Boolean);
};

export const toEditableBody = (article: GeneratedArticle): string => {
  return article.body.join('\n\n');
};

export const parseBodyDraft = (draft: string | undefined, originalBody: string[]): string[] => {
  if (!draft) return originalBody;
  return toStoryParagraphs(draft);
};

export const buildBodyHtml = (article: GeneratedArticle): string => {
  return article.body.map(p => `<p>${escapeHtml(p)}</p>`).join('');
};
