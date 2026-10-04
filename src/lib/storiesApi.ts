import { supaRest } from './supaRest';
import type { StoryArchiveRow } from '../types/story';

/**
 * Fetch all stories created by a specific user.
 */
export async function fetchStoriesForUser(userId: string, page = 1, pageSize = 50) {
  const start = (page - 1) * pageSize;

  
  return supaRest<StoryArchiveRow[]>('GET',
    `/rest/v1/story_archives?created_by=eq.${userId}&select=*&order=created_at.desc&offset=${start}&limit=${pageSize}`
  );
}

/**
 * Fetch a single story by ID.
 */
export async function fetchStoryById(id: string) {
  const stories = await supaRest<StoryArchiveRow[]>('GET',
    `/rest/v1/story_archives?id=eq.${id}&select=*`);
  return stories[0] || null;
}

/**
 * Insert a new story into the archive.
 */
export async function insertStory(payload: Partial<StoryArchiveRow>) {
  return supaRest<StoryArchiveRow[]>('POST',
    '/rest/v1/story_archives', {
      headers: { 
        'Content-Type': 'application/json', 
        'Prefer': 'return=representation' 
      },
      body: JSON.stringify(payload),
    });
}

/**
 * Update an existing story.
 */
export async function updateStory(id: string, payload: Partial<StoryArchiveRow>) {
  return supaRest<StoryArchiveRow[]>('PATCH',
    `/rest/v1/story_archives?id=eq.${id}`, {
      headers: { 
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      },
      body: JSON.stringify(payload),
    });
}

/**
 * Delete a story by ID.
 */
export async function deleteStory(id: string) {
  return supaRest<void>('DELETE',
    `/rest/v1/story_archives?id=eq.${id}`);
}

/**
 * Fetch a public story by its slug.
 * No auth token required (RLS handles access).
 * Only returns stories that are explicitly marked is_public=true.
 */
export async function fetchPublicStory(slug: string) {
  return supaRest<StoryArchiveRow[]>('GET',
    `/rest/v1/story_archives?public_slug=eq.${encodeURIComponent(slug)}&is_public=eq.true&select=*`)
    .then(rows => rows[0] || null);
}

/** Publish through the same path used by the archive; keep existing links stable. */
export async function setStoryVisibility(id: string, isPublic: boolean): Promise<void> {
  const payload: { is_public: boolean; public_slug?: string } = { is_public: isPublic };
  if (isPublic) {
    const current = await fetchStoryById(id);
    if (!current) throw new Error('This story is no longer available.');
    if (!current.public_slug) payload.public_slug = crypto.randomUUID();
  }
  const rows = await updateStory(id, payload);
  if (!rows[0] || rows[0].id !== id || rows[0].is_public !== isPublic) throw new Error('Story sharing could not be updated.');
}

// --- Issue Management ---

export interface IssueRow {
  id: string;
  created_by: string;
  title: string;
  description: string | null;
  created_at: string;
  updated_at: string;
}

export interface IssueStoryRow {
  issue_id: string;
  story_id: string;
  position: number;
}

/**
 * Create a new newspaper issue.
 */
export async function createIssue(payload: { title: string; description?: string; storyIds: string[]; userId: string; requestId?: string }) {
  const title = payload.title.trim();
  if (!title || title.length > 120) throw new Error('Issue name must contain between 1 and 120 characters.');
  if (!payload.storyIds.length || new Set(payload.storyIds).size !== payload.storyIds.length) throw new Error('Choose distinct stories before saving an issue.');
  const data = await supaRest<IssueRow | IssueRow[]>('POST', '/rest/v1/rpc/create_issue_with_stories', {
    body: JSON.stringify({ p_title: title, p_description: payload.description ?? null, p_story_ids: payload.storyIds, p_request_id: payload.requestId ?? crypto.randomUUID() }),
  });
  const issue = Array.isArray(data) ? data[0] : data;
  if (!issue?.id || issue.created_by !== payload.userId) throw new Error('Your sign-in changed. Reopen this edition before saving.');
  return issue;
}

/**
 * Fetch all issues for the current user.
 */
export async function fetchIssues(userId: string) {
  return supaRest<IssueRow[]>('GET',
    `/rest/v1/issues?created_by=eq.${userId}&select=*&order=created_at.desc`);
}

/**
 * Fetch a single issue with its stories.
 */
export async function fetchIssueById(id: string) {
  // Fetch issue details
  const [issue] = await supaRest<IssueRow[]>('GET',
    `/rest/v1/issues?id=eq.${id}&select=*`);
  
  if (!issue) return null;

  // Fetch linked stories (ordered by position)
  // Note: This requires a join or separate fetch. For simplicity/performance, we'll do a separate fetch 
  // or use Supabase's deep select syntax if relations are set up. 
  // Assuming relations are set up: select=*,issue_stories(story_id,position,story_archives(*))
  // But for raw REST without assuming foreign key embedding works perfectly yet, let's do it manually or use the deep select if confident.
  // Let's try the deep select first, but since we are using raw REST, the syntax is specific.
  // Safer approach for now: Fetch junction + stories.
  
  const junction = await supaRest<{ story_id: string; position: number; story_archives: StoryArchiveRow }[]>('GET',
    `/rest/v1/issue_stories?issue_id=eq.${id}&select=story_id,position,story_archives(*)&order=position.asc`);
    
  // Flatten the structure
  const stories = junction.map(j => ({
    ...j.story_archives,
    position: j.position
  }));

  return { ...issue, stories };
}

/**
 * Delete an issue.
 */
export async function deleteIssue(id: string) {
  return supaRest<void>('DELETE', `/rest/v1/issues?id=eq.${id}`);
}

/** Load full articles for an edition using the same REST transport and owner filter. */
export async function fetchStoriesByIds(ids: string[], userId: string) {
  if (!ids.length) return [];
  return supaRest<StoryArchiveRow[]>('GET', `/rest/v1/story_archives?created_by=eq.${encodeURIComponent(userId)}&id=in.(${ids.map(encodeURIComponent).join(',')})&select=*`);
}
