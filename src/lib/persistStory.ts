import { validatePhoto, type StoredPhoto } from './storyPhotos';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { StorageError } from '@supabase/storage-js';
import { supabaseClient } from './supabaseClient';
import { SUPABASE_ANON, SUPABASE_URL } from './config';
import { supaRest, getAccessToken } from './supaRest';
import type { ArchiveItem, StoryArchiveRow } from '../types/story';

export type PersistStoryMode = 'insert' | 'update';

type StoryInsertPayload = {
  created_by: string;
  article: string;
  title: string;
  prompt: string | null;
  image_path: string;
  images?: StoredPhoto[];
  template_id?: string | null;
  is_public?: boolean;
};

export type PersistStoryParams = {
  file: File;
  files?: File[];
  sourcePaths?: (string | undefined)[];
  meta: {
    headline: string;
    bodyHtml: string;
    prompt?: string | null;
  };
  templateId?: string | null;
  userId: string;
  storyId?: string | null;
  onProgress?: (percent: number) => void;
};

export type PersistStoryResult = {
  id: string;
  mode: PersistStoryMode;
  filePath: string;
  story: ArchiveItem;
};

const STORY_TABLE = 'story_archives';
const DIAGNOSTIC_REQUIRED_COLUMNS = [
  'created_by',
  'title',
  'article',
  'prompt',
  'image_path',
  'template_id',
  'is_public',
];
const DIAGNOSTIC_OPTIONAL_COLUMNS = ['user_id'];

const sanitizeFileName = (value: string) =>
  value
    .trim()
    .replace(/[^a-zA-Z0-9._-]/g, '-')
    .replace(/-+/g, '-');

const buildImagePath = (userId: string, file: File) =>
  `stories/${userId}/${crypto.randomUUID()}-${sanitizeFileName(file.name)}`;

type PersistStoryArgs = {
  supabase: SupabaseClient;
  mode: PersistStoryMode;
  storyId?: string | null;
  payload: StoryInsertPayload;
};

const uploadedFiles = new WeakMap<File, Map<string, string>>();

export async function persistStory(
  params: PersistStoryParams,
): Promise<PersistStoryResult> {
  const { file, meta, templateId = null, userId, storyId, onProgress } = params;
  if (!userId) {
    throw new Error('[persistStory] Missing user ID (sign in required to save stories).');
  }

  const mode: PersistStoryMode = storyId ? 'update' : 'insert';
  const files = params.files || [file];
  if (!files.length || files.length > 20) throw new Error('Choose between 1 and 20 photos per story.');
  files.forEach(validatePhoto);
  if (params.sourcePaths && (params.sourcePaths.length !== files.length || params.sourcePaths.some(path => path !== undefined && (!path.startsWith(`stories/${userId}/`) || path.includes('..'))))) throw new Error('Saved photos must belong to the current account.');
  const paths: string[] = [];
  let filePath = '';
  const payload: StoryInsertPayload = {
    created_by: userId,
    article: meta.bodyHtml,
    title: meta.headline,
    prompt: meta.prompt ?? null,
    image_path: filePath,
  };

  if (templateId) {
    payload.template_id = templateId;
  }

  if (mode === 'insert') {
    payload.is_public = false;
  }

  const supabase = supabaseClient;
  if (!supabase) {
    throw new Error('[persistStory] Supabase client is unavailable');
  }

  // Upload via XHR to avoid fetch/Supabase client hanging issues.
  // Token is sourced from localStorage first, then falls back to getSession with timeout.
  for (let index = 0; index < files.length; index++) {
  const file = files[index];
  const cached = params.sourcePaths?.[index] || uploadedFiles.get(file)?.get(userId);
  filePath = cached || buildImagePath(userId, file);
  if (cached) { paths.push(cached); onProgress?.(Math.round((index + 1) / files.length * 100)); continue; }
  let uploadError: StorageError | null = null;

  try {
    const getToken = async () => {
      // Strategy 1: localStorage (fastest, avoids potential hanging)
      const localToken = getAccessToken();
      if (localToken) return localToken;

      // Strategy 2: getSession with timeout
      try {
        const sessionPromise = supabase.auth.getSession();
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Timeout')), 2000)
        );
        const { data: { session } } = await Promise.race([sessionPromise, timeoutPromise]) as any;
        if (session?.access_token) return session.access_token;
      } catch {
        // Fall through — no token available
      }
      return null;
    };

    const token = await getToken();
    if (!token) {
      throw new Error('No auth token available');
    }

    await new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open('POST', `${SUPABASE_URL}/storage/v1/object/photos/${filePath}`);
      xhr.setRequestHeader('Authorization', `Bearer ${token}`);
      xhr.setRequestHeader('apikey', SUPABASE_ANON);
      xhr.setRequestHeader('Content-Type', file.type || 'application/octet-stream');

      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable && onProgress) {
          onProgress(Math.round((index + e.loaded / e.total) / files.length * 100));
        }
      };

      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          resolve(xhr.responseText);
        } else {
          reject(new Error(`Photo ${index + 1} upload failed (${xhr.status}). Your photos are kept; retry Save Story.`));
        }
      };

      xhr.onerror = () => reject(new Error('Network error during upload'));
      xhr.timeout = 30000;
      xhr.ontimeout = () => reject(new Error('Upload timed out'));
      xhr.send(file);
    });
  } catch (err) {
    uploadError = { name: 'StorageError', message: String(err) } as StorageError;
  }

  if (uploadError) throw new Error(`Image upload failed: ${uploadError.message}`);
  const cache = uploadedFiles.get(file) || new Map<string, string>(); cache.set(userId, filePath); uploadedFiles.set(file, cache);
  paths.push(filePath);
  }
  payload.image_path = paths[0];
  if (params.files) payload.images = paths.map(path => ({ path }));

  let savedRow: StoryArchiveRow;
  try {
    savedRow = await persistStoryRecord({ supabase, mode, storyId, payload });
  } catch (error) {
    throw error;
  }

  const normalized: ArchiveItem = {
    ...savedRow,
    imageUrl: null,
  };

  if (savedRow.image_path) {
    const { data: publicUrl } = supabase.storage.from('photos').getPublicUrl(savedRow.image_path);
    normalized.imageUrl = publicUrl?.publicUrl ?? null;
  }

  return {
    id: normalized.id,
    mode,
    filePath,
    story: normalized,
  };
}

const persistStoryRecord = async ({
  supabase,
  mode,
  storyId,
  payload,
}: PersistStoryArgs): Promise<StoryArchiveRow> => {
  // Uses supaRest (raw fetch) for reliability; Supabase JS client can hang in some environments.
  const path = mode === 'update' && storyId
    ? `/rest/v1/${STORY_TABLE}?id=eq.${storyId}&select=*`
    : `/rest/v1/${STORY_TABLE}?select=*`;

  const method = mode === 'update' ? 'PATCH' : 'POST';

  try {
    const data = await supaRest<StoryArchiveRow[]>(method, path, {
      headers: { Prefer: 'return=representation' },
      body: JSON.stringify(payload),
    });

    if (!data || data.length === 0) {
      throw new Error('Database mutation returned no data');
    }

    return data[0];
  } catch (error) {
    throw new Error('Story could not be saved. Your uploaded photos are preserved for retry. If multi-photo saving is not configured, apply the story photos migration.');
  }
};

let diagnosticsRan = false;

export async function validateStoryPersistenceSetup(): Promise<void> {
  if (diagnosticsRan) {
    return;
  }
  diagnosticsRan = true;

  const missingEnv: string[] = [];
  if (!SUPABASE_URL) {
    missingEnv.push('REACT_APP_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_URL');
  }
  if (!SUPABASE_ANON) {
    missingEnv.push('REACT_APP_SUPABASE_ANON_KEY / NEXT_PUBLIC_SUPABASE_ANON_KEY');
  }
  if (missingEnv.length > 0) {
    console.warn('[persistStory diagnostics] Missing Supabase env vars', missingEnv);
  }

  const supabase = supabaseClient;

  try {
    const { error: columnError } = await supabase
      .from(STORY_TABLE)
      .select(DIAGNOSTIC_REQUIRED_COLUMNS.join(','))
      .limit(0);
    if (columnError) {
      console.error('[persistStory diagnostics] Required columns are not present', columnError);
    } else {
      console.log('[persistStory diagnostics] Required columns exist');
    }
  } catch (err) {
    console.error('[persistStory diagnostics] Failed to query story table structure', err);
  }

  for (const column of DIAGNOSTIC_OPTIONAL_COLUMNS) {
    try {
      const { error: optionalError } = await supabase
        .from(STORY_TABLE)
        .select(column)
        .limit(0);
      if (optionalError) {
        console.info(`[persistStory diagnostics] Optional column ${column} is not present`);
      } else {
        console.log(`[persistStory diagnostics] Optional column ${column} is present`);
      }
    } catch {
      console.info(`[persistStory diagnostics] Unable to inspect optional column ${column}`);
    }
  }

  try {
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
    if (sessionError) {
      console.warn('[persistStory diagnostics] Unable to read session', sessionError);
    }
    const userId = sessionData?.session?.user?.id;
    if (!userId) {
      console.warn('[persistStory diagnostics] No authenticated user is available for RLS validation');
      return;
    }
    const { error: rlsError } = await supabase
      .from(STORY_TABLE)
      .select('id')
      .eq('created_by', userId)
      .limit(1);
    if (rlsError) {
      console.error('[persistStory diagnostics] RLS read check failed', rlsError);
    } else {
      console.log('[persistStory diagnostics] RLS read check succeeded');
    }
  } catch (err) {
    console.error('[persistStory diagnostics] RLS validation threw', err);
  }
}
