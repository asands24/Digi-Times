import { getLocalTemplates } from '../lib/templates';
import type { ArchiveItem } from '../types/story';

const SAMPLE_IMAGE =
  'https://images.unsplash.com/photo-1521737604893-d14cc237f11d?auto=format&fit=crop&w=900&q=80';
const SAMPLE_BODY = `
  <p>From the heart of your family newsroom, DigiTimes shows how everyday snapshots can become treasured headlines. This starter story walks you through what a fully formatted article will look like once you archive your own photo.</p>
  <p>Upload a favorite memory, choose the layout you love, and save it to your edition. We’ll stash it here—and you can export, share, or print whenever you’re ready.</p>
`;

export function buildStarterStory(userId: string): ArchiveItem {
  const template = getLocalTemplates()[0] ?? null;
  const now = new Date().toISOString();

  return {
    id: `starter-${userId}`,
    created_by: userId,
    title: 'Sample Feature: Family Newsroom',
    prompt: 'See how a polished article could look in your edition.',
    article: SAMPLE_BODY.trim(),
    image_path: null,
    photo_id: null,
    template_id: template?.id ?? null,
    is_public: false,
    public_slug: null,
    created_at: now,
    updated_at: now,
    imageUrl: SAMPLE_IMAGE,
    isSample: true,
  };
}
