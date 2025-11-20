import { useCallback, useEffect, useState } from 'react';
import { getSupabase } from '../lib/supabaseClient';
import type { Database } from '../types/supabase';
import type { ArchiveItem } from '../types/story';
import { cacheStories, cacheStory, getCachedStories } from '../utils/storyCache';
import { buildStarterStory } from '../utils/storySeeds';

const DEBUG_STORY_LIBRARY = process.env.NODE_ENV !== 'production';

export type PersistMeta = {
  headline: string;
  bodyHtml: string;
  prompt?: string;
};

type StoryArchiveRow = Database['public']['Tables']['story_archives']['Row'];
type StoryArchiveInsert = Database['public']['Tables']['story_archives']['Insert'];

export async function persistStory(params: {
  file: File;
  meta: PersistMeta;
  templateId: string;
  userId: string;
}) {
  const supabase = getSupabase();
  const { file, meta, templateId, userId } = params;

  console.log('[StoryLibrary] 💾 Starting story persistence', {
    templateId,
    userId,
    fileName: file.name,
    fileSize: file.size,
    fileType: file.type,
    headlineLength: meta.headline.length,
    bodyHtmlLength: meta.bodyHtml.length,
    promptLength: (meta.prompt ?? '').length,
    timestamp: new Date().toISOString(),
  });

  if (!templateId) {
    console.error('[StoryLibrary] ❌ No template ID provided');
    throw new Error('Pick a template before saving');
  }

  const filePath = `stories/${userId}/${Date.now()}-${file.name}`;

  console.log('[StoryLibrary] 📤 Uploading image to storage...', {
    bucket: 'photos',
    filePath,
    fileSize: file.size,
  });

  const uploadStartTime = Date.now();
  const up = await supabase.storage.from('photos').upload(filePath, file, {
    cacheControl: '3600',
    upsert: false,
  });
  const uploadDuration = Date.now() - uploadStartTime;

  if (up.error) {
    console.error('[StoryLibrary] ❌ Image upload failed', {
      error: up.error,
      errorMessage: up.error.message,
      filePath,
      duration: uploadDuration,
    });
    throw up.error;
  }

  console.log('[StoryLibrary] ✅ Image uploaded successfully', {
    filePath,
    duration: uploadDuration,
    uploadedPath: up.data?.path,
  });

  const payload: StoryArchiveInsert = {
    title: meta.headline,
    article: meta.bodyHtml,
    prompt: meta.prompt ?? null,
    image_path: filePath,
    template_id: templateId,
    created_by: userId,
  };

  console.log('[StoryLibrary] 📝 Inserting story archive record...', {
    title: payload.title,
    templateId: payload.template_id,
    hasPrompt: !!payload.prompt,
    articleLength: payload.article?.length ?? 0,
  });

  const insertStartTime = Date.now();
  const {
    data: inserted,
    error: insErr,
  } = await supabase
    .from('story_archives')
    .insert(payload)
    .select(
      'id,created_by,title,template_id,image_path,photo_id,created_at,updated_at,article,prompt,is_public',
    )
    .single();
  const insertDuration = Date.now() - insertStartTime;

  if (insErr || !inserted) {
    console.error('[StoryLibrary] ❌ Database insert failed', {
      error: insErr,
      errorMessage: insErr?.message,
      errorCode: insErr?.code,
      duration: insertDuration,
    });
    throw insErr ?? new Error('Failed to save story.');
  }

  console.log('[StoryLibrary] ✅ Story archive record created', {
    id: inserted.id,
    templateId: inserted.template_id,
    isPublic: inserted.is_public,
    duration: insertDuration,
    createdAt: inserted.created_at,
  });

  const normalized: ArchiveItem = {
    ...inserted,
    created_by: inserted.created_by ?? userId,
    photo_id: inserted.photo_id ?? null,
    imageUrl: null,
  };

  if (inserted.image_path) {
    console.log('[StoryLibrary] 🔗 Getting public URL for image...', {
      imagePath: inserted.image_path,
    });
    const { data: pub } = supabase.storage.from('photos').getPublicUrl(inserted.image_path);
    normalized.imageUrl = pub?.publicUrl ?? null;
    console.log('[StoryLibrary] ✅ Public URL generated', {
      imageUrl: normalized.imageUrl,
    });
  }

  cacheStory(userId, normalized);
  console.log('[StoryLibrary] ✅ Story cached locally');

  console.log('[StoryLibrary] 🎉 Story persistence complete!', {
    storyId: inserted.id,
    totalDuration: uploadDuration + insertDuration,
  });

  return { filePath, story: normalized };
}

export type { ArchiveItem } from '../types/story';

export type StoryLibraryStatus = 'idle' | 'loading' | 'loaded' | 'error';

export type LoadStoriesResult = {
  stories: ArchiveItem[];
  error?: Error | null;
};

const STORIES_LIMIT = 50;
const DEFAULT_QUERY_TIMEOUT_MS = 10000;
const ENV_TIMEOUT_MS = Number(process.env.REACT_APP_STORY_QUERY_TIMEOUT_MS);
const QUERY_TIMEOUT_MS =
  Number.isFinite(ENV_TIMEOUT_MS) && ENV_TIMEOUT_MS > 0 ? ENV_TIMEOUT_MS : DEFAULT_QUERY_TIMEOUT_MS;
const MAX_QUERY_ATTEMPTS = 2;

function normalizeLoadError(error: unknown): Error {
  if (error instanceof Error && error.name === 'AbortError') {
    const timeoutError = new Error('Stories are taking too long to load. Please try again.');
    timeoutError.name = 'AbortError';
    return timeoutError;
  }
  if (error instanceof Error) {
    return error;
  }
  return new Error("We couldn't load your archive. Please refresh and try again.");
}

/**
 * Load stories list without large text fields (article, prompt) for performance.
 * Use loadStoryDetails() to fetch full story content when needed.
 */
export async function loadStories(
  userId?: string | null,
  limit: number = STORIES_LIMIT,
): Promise<LoadStoriesResult> {
  if (!userId) {
    console.log('[StoryLibrary] ⚠️ loadStories called without userId, returning empty array');
    return { stories: [] };
  }

  console.log('[StoryLibrary] 📚 Loading stories list for user', {
    userId,
    limit,
    timestamp: new Date().toISOString(),
  });

  const supabase = getSupabase();

  try {
    const rows = await fetchStoriesWithRetries({ supabase, userId, limit });
    console.log('[StoryLibrary] 🔗 Generating public URLs for images...', {
      rowsWithImages: rows.filter((r) => r.image_path).length,
    });

    const mapped: ArchiveItem[] = rows.map((r) => {
      const item: ArchiveItem = {
        ...r,
        article: null,
        prompt: null,
      };
      if (r.image_path) {
        const { data: pub } = supabase.storage.from('photos').getPublicUrl(r.image_path);
        item.imageUrl = pub?.publicUrl ?? null;
      }
      return item;
    });

    if (mapped.length === 0) {
      console.log('[StoryLibrary] ℹ️ No stories found, creating starter story');
      const starter = buildStarterStory(userId);
      cacheStories(userId, [starter]);
      console.log('[StoryLibrary] ✅ Starter story created and cached');
      return { stories: [starter] };
    }

    cacheStories(userId, mapped);
    console.log('[StoryLibrary] ✅ Stories loaded and cached', {
      count: mapped.length,
      stories: mapped.map((s) => ({ id: s.id, title: s.title, templateId: s.template_id })),
    });
    return { stories: mapped };
  } catch (error) {
    console.error('[StoryLibrary] ❌ Failed to load stories', {
      error,
      errorType: error instanceof Error ? error.constructor.name : typeof error,
      errorMessage: error instanceof Error ? error.message : String(error),
      isAbortError: error instanceof Error && error.name === 'AbortError',
    });

    const normalizedError = normalizeLoadError(error);
    const cached = getCachedStories(userId);
    if (cached.length > 0) {
      console.warn('[StoryLibrary] ⚠️ Falling back to cached stories', {
        cachedCount: cached.length,
      });
      return { stories: cached, error: normalizedError };
    }

    console.log('[StoryLibrary] ⚠️ No cached stories, creating starter story');
    const starter = buildStarterStory(userId);
    cacheStories(userId, [starter]);
    console.log('[StoryLibrary] ✅ Starter story created after error');

    return { stories: [starter], error: normalizedError };
  }
}

async function fetchStoriesWithRetries({
  supabase,
  userId,
  limit,
}: {
  supabase: ReturnType<typeof getSupabase>;
  userId: string;
  limit: number;
}): Promise<StoryArchiveRow[]> {
  let lastError: unknown = null;
  for (let attempt = 1; attempt <= MAX_QUERY_ATTEMPTS; attempt += 1) {
    try {
      return await fetchStoriesAttempt({ supabase, userId, limit, attempt });
    } catch (error) {
      lastError = error;
      const isAbortError = error instanceof Error && error.name === 'AbortError';
      console.warn('[StoryLibrary] ⚠️ Stories query attempt failed', {
        attempt,
        maxAttempts: MAX_QUERY_ATTEMPTS,
        isAbortError,
      });
      if (isAbortError && attempt < MAX_QUERY_ATTEMPTS) {
        console.log('[StoryLibrary] 🔁 Retrying stories query...', {
          nextAttempt: attempt + 1,
          timeoutMs: QUERY_TIMEOUT_MS,
        });
        continue;
      }
      throw error;
    }
  }
  throw lastError ?? new Error('Failed to load stories due to unknown error');
}

async function fetchStoriesAttempt({
  supabase,
  userId,
  limit,
  attempt,
}: {
  supabase: ReturnType<typeof getSupabase>;
  userId: string;
  limit: number;
  attempt: number;
}): Promise<StoryArchiveRow[]> {
  const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
  let timeout: ReturnType<typeof setTimeout> | null = null;

  let query = supabase
    .from('story_archives')
    .select(
      'id,created_by,title,template_id,image_path,photo_id,created_at,updated_at,is_public',
    )
    .eq('created_by', userId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (controller) {
    query = query.abortSignal(controller.signal);
    timeout = setTimeout(() => {
      console.warn('[StoryLibrary] ⏱️ Query timeout reached, aborting...', {
        attempt,
        timeoutMs: QUERY_TIMEOUT_MS,
      });
      controller.abort();
    }, QUERY_TIMEOUT_MS);
    console.log('[StoryLibrary] ⏱️ Query timeout set', {
      timeoutMs: QUERY_TIMEOUT_MS,
      attempt,
      maxAttempts: MAX_QUERY_ATTEMPTS,
    });
  }

  try {
    console.log('[StoryLibrary] 🌐 Fetching stories list from Supabase...', {
      attempt,
      limit,
    });
    const queryStartTime = Date.now();
    const { data, error } = await query;
    const queryDuration = Date.now() - queryStartTime;

    if (error) {
      console.error('[StoryLibrary] ❌ Query error', {
        attempt,
        error,
        errorMessage: error.message,
        errorCode: error.code,
        duration: queryDuration,
      });
      throw error;
    }

    console.log('[StoryLibrary] ✅ Query successful', {
      attempt,
      rowCount: data?.length ?? 0,
      duration: queryDuration,
    });

    return (data ?? []) as StoryArchiveRow[];
  } finally {
    if (timeout) {
      clearTimeout(timeout);
    }
  }
}

/**
 * Load full story details including article and prompt.
 * Use this when you need the complete story content.
 */
export async function loadStoryDetails(storyId: string, userId: string): Promise<ArchiveItem | null> {
  console.log('[StoryLibrary] 📖 Loading full story details', {
    storyId,
    userId,
    timestamp: new Date().toISOString(),
  });

  const supabase = getSupabase();
  const queryStartTime = Date.now();

  const { data, error } = await supabase
    .from('story_archives')
    .select(
      'id,created_by,title,template_id,image_path,photo_id,created_at,updated_at,article,prompt,is_public',
    )
    .eq('id', storyId)
    .eq('created_by', userId)
    .single();

  const queryDuration = Date.now() - queryStartTime;

  if (error) {
    console.error('[StoryLibrary] ❌ Failed to load story details', {
      error,
      errorMessage: error.message,
      errorCode: error.code,
      storyId,
      duration: queryDuration,
    });
    return null;
  }

  if (!data) {
    console.warn('[StoryLibrary] ⚠️ Story not found', { storyId });
    return null;
  }

  console.log('[StoryLibrary] ✅ Story details loaded', {
    storyId,
    title: data.title,
    duration: queryDuration,
    hasArticle: !!data.article,
    hasPrompt: !!data.prompt,
  });

  const item: ArchiveItem = { ...data };
  if (data.image_path) {
    const { data: pub } = supabase.storage.from('photos').getPublicUrl(data.image_path);
    item.imageUrl = pub?.publicUrl ?? null;
  }

  return item;
}

/**
 * Load multiple stories with full details.
 * Use this when you need article/prompt content for multiple stories (e.g., export).
 */
export async function loadStoriesWithDetails(
  storyIds: string[],
  userId: string,
): Promise<ArchiveItem[]> {
  if (storyIds.length === 0) {
    return [];
  }

  console.log('[StoryLibrary] 📚 Loading multiple stories with details', {
    count: storyIds.length,
    userId,
    timestamp: new Date().toISOString(),
  });

  const supabase = getSupabase();
  const queryStartTime = Date.now();

  const { data, error } = await supabase
    .from('story_archives')
    .select(
      'id,created_by,title,template_id,image_path,photo_id,created_at,updated_at,article,prompt,is_public',
    )
    .eq('created_by', userId)
    .in('id', storyIds);

  const queryDuration = Date.now() - queryStartTime;

  if (error) {
    console.error('[StoryLibrary] ❌ Failed to load stories with details', {
      error,
      errorMessage: error.message,
      errorCode: error.code,
      duration: queryDuration,
    });
    throw error;
  }

  console.log('[StoryLibrary] ✅ Stories with details loaded', {
    requestedCount: storyIds.length,
    loadedCount: data?.length ?? 0,
    duration: queryDuration,
  });

  const rows = (data ?? []) as StoryArchiveRow[];
  const mapped: ArchiveItem[] = rows.map((r) => {
    const item: ArchiveItem = { ...r };
    if (r.image_path) {
      const { data: pub } = supabase.storage.from('photos').getPublicUrl(r.image_path);
      item.imageUrl = pub?.publicUrl ?? null;
    }
    return item;
  });

  return mapped;
}

export async function updateStoryVisibility(id: string, nextValue: boolean): Promise<void> {
  const supabase = getSupabase();
  if (DEBUG_STORY_LIBRARY) {
    console.log('[StoryLibrary] Updating visibility', { id, nextValue });
  }
  const { error } = await supabase
    .from('story_archives')
    .update({ is_public: nextValue })
    .eq('id', id);
  if (error) throw error;
  if (DEBUG_STORY_LIBRARY) {
    console.log('[StoryLibrary] Updated visibility successfully', { id });
  }
}

export function useStoryLibraryArchive(userId?: string | null) {
  const [stories, setStories] = useState<ArchiveItem[]>([]);
  const [status, setStatus] = useState<StoryLibraryStatus>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!userId) {
      setStories([]);
      setStatus('idle');
      setErrorMessage(null);
      return;
    }

    const cached = getCachedStories(userId);
    if (cached.length > 0) {
      setStories(cached);
    }

    setStatus('loading');
    setErrorMessage(null);
    console.log('[StoryLibrary] 🔄 Refreshing stories list', {
      userId,
      timestamp: new Date().toISOString(),
    });

    try {
      const result = await loadStories(userId);
      setStories(result.stories);

      if (result.error) {
        if (result.error.name === 'AbortError') {
          console.warn('[StoryLibrary] ⏱️ Fetch aborted due to timeout', {
            userId,
            timeoutMs: QUERY_TIMEOUT_MS,
          });
        } else {
          console.error('[StoryLibrary] ❌ Supabase error loading stories', {
            error: result.error,
            userId,
          });
        }
        setStatus('error');
        setErrorMessage(result.error.message);
        return;
      }

      setStatus('loaded');
      console.log('[StoryLibrary] ✅ Loaded stories', {
        count: result.stories.length,
        userId,
      });
    } catch (refreshError) {
      console.error('[StoryLibrary] ❌ Unexpected error while refreshing stories', refreshError);
      setStatus('error');
      setErrorMessage(
        refreshError instanceof Error
          ? refreshError.message
          : "We couldn't load your stories right now. Please try again.",
      );
    }
  }, [userId]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const updateStories = useCallback(
    (updater: (items: ArchiveItem[]) => ArchiveItem[]) => {
      setStories((current) => updater(current));
    },
    [],
  );

  return { stories, status, errorMessage, refresh, updateStories };
}
