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
 */
export async function fetchPublicStory(slug: string) {
  // Try to find by slug OR id (for backward compatibility or fallback)
  return supaRest<StoryArchiveRow[]>('GET',
    `/rest/v1/story_archives?or=(public_slug.eq.${slug},id.eq.${slug})&select=*`)
    .then(rows => rows[0] || null);
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
export async function createIssue(payload: { title: string; description?: string; storyIds: string[]; userId: string }) {
  // 1. Create the issue
  const [issue] = await supaRest<IssueRow[]>('POST', '/rest/v1/issues', {
    headers: { 'Prefer': 'return=representation' },
    body: JSON.stringify({
      title: payload.title,
      description: payload.description,
      created_by: payload.userId,
    }),
  });

  if (!issue) throw new Error('Failed to create issue');

  // 2. Link stories to the issue
  const junctionPayload = payload.storyIds.map((storyId, index) => ({
    issue_id: issue.id,
    story_id: storyId,
    position: index,
  }));

  await supaRest('POST', '/rest/v1/issue_stories', {
    headers: {
      'Content-Type': 'application/json',
      'Prefer': 'return=minimal'
    },
    body: JSON.stringify(junctionPayload),
  });

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
