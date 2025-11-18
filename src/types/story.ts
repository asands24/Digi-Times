import type { GeneratedArticle } from '../utils/storyGenerator';
import type { Database } from './supabase';

export type StoryArchiveRow = Database['public']['Tables']['story_archives']['Row'];
export type TemplateTableRow = Database['public']['Tables']['templates']['Row'];
export type ProfileRow = Database['public']['Tables']['profiles']['Row'];
export type PhotoRow = Database['public']['Tables']['photos']['Row'];

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
  description?: string | null;
  isSystem: boolean;
  owner: string | null;
}

export type ArchiveItem = StoryArchiveRow & { imageUrl?: string | null; isSample?: boolean };

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
