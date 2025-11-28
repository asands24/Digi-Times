import { supaRest } from './supaRest';
import type { StoryArchiveRow } from '../types/story';

const TABLE = 'story_archives';
const BASE_PATH = `/rest/v1/${TABLE}`;

/**
 * Fetches all stories created by a specific user.
 * Orders by inserted_at descending (newest first).
 */
export async function fetchStoriesForUser(userId: string) {
  const query = new URLSearchParams({
    created_by: `eq.${userId}`,
    select: '*',
    order: 'inserted_at.desc',
  });
  
  return supaRest<StoryArchiveRow[]>('GET', `${BASE_PATH}?${query.toString()}`);
}

/**
 * Inserts a new story into the archive.
 */
export async function insertStory(payload: Partial<StoryArchiveRow>) {
  return supaRest<StoryArchiveRow[]>('POST', BASE_PATH, {
    headers: {
      'Prefer': 'return=representation',
    },
    body: JSON.stringify(payload),
  });
}

/**
 * Deletes a story by ID.
 */
export async function deleteStory(id: string) {
  const query = new URLSearchParams({
    id: `eq.${id}`,
  });

  return supaRest<void>('DELETE', `${BASE_PATH}?${query.toString()}`);
}

/**
 * Updates a story by ID.
 */
export async function updateStory(id: string, payload: Partial<StoryArchiveRow>) {
  const query = new URLSearchParams({
    id: `eq.${id}`,
  });

  return supaRest<StoryArchiveRow[]>('PATCH', `${BASE_PATH}?${query.toString()}`, {
    headers: {
      'Prefer': 'return=representation',
    },
    body: JSON.stringify(payload),
  });
}
