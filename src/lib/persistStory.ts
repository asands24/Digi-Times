import type { PostgrestError, SupabaseClient } from '@supabase/supabase-js';
import { getSupabase, supabaseClient } from './supabaseClient';
import { SUPABASE_ANON, SUPABASE_URL } from './config';
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

  const supabase = supabaseClient ?? getSupabase();
  console.log('[persistStory] Supabase client exists?', !!supabase);
  if (!supabase) {
    console.error('[persistStory] ❌ No Supabase client – aborting');
    throw new Error('[persistStory] Supabase client is unavailable');
  }

  console.log('[persistStory] starting', { mode, storyId, payload });

  const uploadStart = Date.now();
  const { error: uploadError } = await supabase.storage
    .from('photos')
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: false,
    });
  console.log('[persistStory] upload duration ms', Date.now() - uploadStart);

  if (uploadError) {
    console.error('[persistStory] image upload failed', {
      error: uploadError,
      path: filePath,
    });
    throw new Error(`Image upload failed: ${uploadError.message}`);
  }

  const mutationStart = Date.now();
  const savedRow = await persistStoryRecord({
    supabase,
    mode,
    storyId,
    payload,
  });
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

const logSupabaseError = (
  error: PostgrestError,
  context: { mode: PersistStoryMode; storyId?: string | null; payload: StoryInsertPayload },
) => {
  console.error('[persistStory] Supabase mutation failed', {
    ...context,
    message: error.message,
    code: error.code,
    hint: error.hint,
    details: error.details,
  });
  if (['42501', 'PGRST301', '403'].includes(error.code ?? '')) {
    console.warn('[persistStory] RLS or permission issue likely blocking insert/update', error);
  }
  if (error.message?.toLowerCase().includes('column') || error.message?.toLowerCase().includes('not-null')) {
    console.warn('[persistStory] Schema mismatch detected', error.message);
  }
};

const persistStoryRecord = async ({
  supabase,
  mode,
  storyId,
  payload,
}: PersistStoryArgs): Promise<StoryArchiveRow> => {
  console.log('[persistStory] Supabase mutation payload', {
    mode,
    storyId,
    payload,
  });

  if (mode === 'update' && storyId) {
    const { data, error } = await supabase
      .from(STORY_TABLE)
      .update(payload)
      .eq('id', storyId)
      .select('*')
      .single();

    console.log('[persistStory] Supabase update response', { data, error });

    if (error) {
      logSupabaseError(error, { mode, storyId, payload });
      throw error;
    }

    if (!data) {
      throw new Error('Supabase update returned no story data.');
    }

    return data as StoryArchiveRow;
  }

  const { data, error } = await supabase.from(STORY_TABLE).insert(payload).select('*').single();
  console.log('[persistStory] Supabase insert response', { data, error });

  if (error) {
    logSupabaseError(error, { mode, storyId, payload });
    throw error;
  }

  if (!data) {
    throw new Error('Supabase insert returned no story data.');
  }

  return data as StoryArchiveRow;
};

let diagnosticsRan = false;

export async function validateStoryPersistenceSetup(): Promise<void> {
  if (diagnosticsRan) {
    return;
  }
  diagnosticsRan = true;

  const missingEnv: string[] = [];
  if (!SUPABASE_URL) {
    missingEnv.push('REACT_APP_SUPABASE_URL');
  }
  if (!SUPABASE_ANON) {
    missingEnv.push('REACT_APP_SUPABASE_ANON_KEY');
  }
  if (missingEnv.length > 0) {
    console.warn('[persistStory diagnostics] Missing Supabase env vars', missingEnv);
  }

  const supabase = getSupabase();

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
