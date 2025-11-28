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
  template_id?: string | null;
  is_public?: boolean;
};

export type PersistStoryParams = {
  file: File;
  meta: {
    headline: string;
    bodyHtml: string;
    prompt?: string | null;
  };
  templateId?: string | null;
  userId: string;
  storyId?: string | null;
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
  `stories/${userId}/${Date.now()}-${sanitizeFileName(file.name)}`;

type PersistStoryArgs = {
  supabase: SupabaseClient;
  mode: PersistStoryMode;
  storyId?: string | null;
  payload: StoryInsertPayload;
};

export async function persistStory(
  params: PersistStoryParams,
): Promise<PersistStoryResult> {
  const { file, meta, templateId = null, userId, storyId } = params;
  if (!userId) {
    throw new Error('[persistStory] Missing user ID (sign in required to save stories).');
  }

  const mode: PersistStoryMode = storyId ? 'update' : 'insert';
  const filePath = buildImagePath(userId, file);
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
  console.log('[persistStory] Supabase client exists?', !!supabase);
  if (!supabase) {
    console.error('[persistStory] ❌ No Supabase client – aborting');
    throw new Error('[persistStory] Supabase client is unavailable');
  }

  console.log('[persistStory] starting', { mode, storyId, payload });
  console.log('[persistStory] about to upload image', {
    filePath,
    fileName: file.name,
  });
  
  // Storage is fixed, so we can upload now.
  const DEBUG_SKIP_UPLOAD = false;

  const uploadStart = Date.now();
  let uploadError: StorageError | null = null;
  if (!DEBUG_SKIP_UPLOAD) {
    console.log('[persistStory] 🚀 Starting upload await...');
    
    // WORKAROUND: Use XHR instead of fetch/Supabase client
    // because both fetch and Supabase client are hanging
    try {
      console.log('[persistStory] VERSION: XHR_WITH_TOKEN_FALLBACK_V2');
      
      // Helper to get token with timeout and localStorage fallback
      const getToken = async () => {
        console.log('[persistStory] getToken called');
        
        // STRATEGY 1: Try localStorage FIRST (fastest, avoids hanging client)
        const localToken = getAccessToken();
        if (localToken) {
          console.log('[persistStory] ✅ Found token in localStorage');
          return localToken;
        }

        console.log('[persistStory] ⚠️ No local token, trying getSession (risky)...');

        // STRATEGY 2: Try standard way with timeout
        try {
          const sessionPromise = supabase.auth.getSession();
          const timeoutPromise = new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Timeout')), 2000)
          );
          
          const { data: { session } } = await Promise.race([sessionPromise, timeoutPromise]) as any;
          if (session?.access_token) return session.access_token;
        } catch (e) {
          console.warn('[persistStory] getSession timed out or failed');
        }

        return null;
      };

      const token = await getToken();
      console.log('[persistStory] 🔑 Token retrieved:', Boolean(token));

      if (!token) {
        throw new Error('No auth token available');
      }
      
      console.log('[persistStory] 🚀 Starting XHR upload...');
      
      await new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open('POST', `${SUPABASE_URL}/storage/v1/object/photos/${filePath}`);
        xhr.setRequestHeader('Authorization', `Bearer ${token}`);
        xhr.setRequestHeader('apikey', SUPABASE_ANON);
        xhr.setRequestHeader('Content-Type', file.type || 'application/octet-stream');
        
        xhr.upload.onprogress = (e) => {
          if (e.lengthComputable) {
            const percent = Math.round((e.loaded / e.total) * 100);
            console.log(`[persistStory] 📤 Upload progress: ${percent}%`);
          }
        };

        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            console.log('[persistStory] ✅ XHR Upload success:', xhr.status);
            resolve(xhr.responseText);
          } else {
            console.error('[persistStory] ❌ XHR Upload failed:', xhr.status, xhr.responseText);
            reject(new Error(`Upload failed with status ${xhr.status}: ${xhr.responseText}`));
          }
        };
        
        xhr.onerror = () => {
          console.error('[persistStory] ❌ XHR Network error');
          reject(new Error('Network error during upload'));
        };
        
        xhr.timeout = 30000; // 30s timeout
        xhr.ontimeout = () => {
          console.error('[persistStory] ❌ XHR Timeout');
          reject(new Error('Upload timed out'));
        };
        
        xhr.send(file);
      });
      
      console.log('[persistStory] ✅ Upload await completed');
    } catch (err) {
      console.error('[persistStory] 💥 Upload exception:', err);
      uploadError = { name: 'StorageError', message: String(err) } as StorageError;
    }
  } else {
    console.warn('[persistStory] ⚠️ DEBUG: Skipping image upload, using filePath anyway', {
      filePath,
    });
  }
  console.log('[persistStory] upload finished', {
    durationMs: Date.now() - uploadStart,
    hasError: Boolean(uploadError),
  });

  if (uploadError) {
    console.error('[persistStory] image upload failed', {
      error: uploadError,
      path: filePath,
      userId,
    });
    throw new Error(`Image upload failed: ${uploadError.message}`);
  }

  const mutationStart = Date.now();
  let savedRow: StoryArchiveRow;
  try {
    savedRow = await persistStoryRecord({
      supabase,
      mode,
      storyId,
      payload,
    });
  } catch (error) {
    console.error('[persistStory] failed to persist story record', {
      error,
      mode,
      storyId,
      userId,
      payload,
    });
    throw error;
  }
  console.log('[persistStory] mutation duration ms', Date.now() - mutationStart, {
    mode,
    storyId,
    savedRowId: savedRow.id,
  });
  console.log('[persistStory] Supabase mutation response', {
    mode,
    storyId,
    dataId: savedRow.id,
  });

  const normalized: ArchiveItem = {
    ...savedRow,
    imageUrl: null,
  };

  if (savedRow.image_path) {
    const { data: publicUrl } = supabase.storage.from('photos').getPublicUrl(savedRow.image_path);
    normalized.imageUrl = publicUrl?.publicUrl ?? null;
  }

  console.log('[persistStory] saved story', { mode, id: normalized.id });
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
  console.log('[persistStory] Supabase mutation payload (RAW FETCH)', {
    mode,
    storyId,
    payload,
  });

  // WORKAROUND: Use raw fetch because Supabase client hangs
  const path = mode === 'update' && storyId
    ? `/rest/v1/${STORY_TABLE}?id=eq.${storyId}&select=*`
    : `/rest/v1/${STORY_TABLE}?select=*`;

  const method = mode === 'update' ? 'PATCH' : 'POST';

  try {
    const data = await supaRest<StoryArchiveRow[]>(method, path, {
      headers: {
        'Prefer': 'return=representation'
      },
      body: JSON.stringify(payload)
    });

    console.log('[persistStory] Raw fetch response', { data });

    if (!data || data.length === 0) {
      throw new Error('Database mutation returned no data');
    }

    return data[0];
  } catch (error) {
    console.error('[persistStory] Raw fetch failed', error);
    throw new Error(`Database mutation failed: ${error instanceof Error ? error.message : String(error)}`);
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
