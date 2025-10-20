import type { GeneratedArticle } from '../utils/storyGenerator';

export interface StoryImage {
  name: string;
  type: string;
  size: number;
  dataUrl: string;
}

export interface StoryRecord {
  id: string;
  prompt: string;
  article: GeneratedArticle;
  image: StoryImage;
  createdAt: string;
  updatedAt: string;
}

export interface StoryArchive {
  version: number;
  stories: StoryRecord[];
}
