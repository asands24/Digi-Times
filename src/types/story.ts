import type { GeneratedArticle } from '../utils/storyGenerator';

export interface StoryImage {
  id: string;
  fileName: string;
  filePath: string;
  publicUrl: string;
  caption: string | null;
  uploadedBy: string;
}

export interface StoryTemplate {
  id: string;
  title: string;
  slug: string;
  html: string;
  css: string;
  isSystem: boolean;
  owner: string | null;
}

export interface StoryRecord {
  id: string;
  prompt: string;
  article: GeneratedArticle;
  image: StoryImage | null;
  templateId: string | null;
  template: StoryTemplate | null;
  createdAt: string;
  updatedAt: string;
}

export interface StoryArchive {
  version: number;
  stories: StoryRecord[];
}
