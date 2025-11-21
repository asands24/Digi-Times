import { useCallback, useEffect, useState } from 'react';
import { getSupabase } from '../lib/supabaseClient';
import type { Database } from '../types/supabase';
import type { ArchiveItem, DraftEntry, StoryTemplate } from '../types/story';
import { cacheStory } from '../utils/storyCache';

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
  templateId: string | null;
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
    template_id: templateId ?? null,
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

export type SaveDraftToArchiveOptions = {
  entry: DraftEntry;
  template: StoryTemplate | null;
  userId: string;
  headline: string;
  bodyHtml: string;
  prompt: string | null;
};

export async function saveDraftToArchive({
  entry,
  template,
  userId,
  headline,
  bodyHtml,
  prompt,
}: SaveDraftToArchiveOptions): Promise<ArchiveItem | null> {
  console.log('[StoryLibrary] 💾 saveDraftToArchive called', {
    entryId: entry.id,
    hasArticle: Boolean(entry.article),
    templateId: template?.id ?? null,
    userId,
  });

  if (!entry.article) {
    console.warn('[StoryLibrary] ⚠️ No article on entry, skipping save');
    return null;
  }

  try {
    const result = await persistStory({
      file: entry.file,
      meta: {
        headline,
        bodyHtml,
        prompt: prompt || null,
      },
      templateId: template?.id ?? null,
      userId,
    });

    console.log('[StoryLibrary] 💾 insert response', result);
    return result.story;
  } catch (error) {
    console.error('[StoryLibrary] ❌ Error saving story', error);
    return null;
  }
}

export type { ArchiveItem } from '../types/story';

export type StoryLibraryStatus = 'idle' | 'loading' | 'loaded' | 'error';

export type LoadStoriesResult = {
  stories: ArchiveItem[];
  error: Error | null;
};

const STORIES_LIMIT = 50;

/**
 * Load stories list without large text fields (article, prompt) for performance.
 * Use loadStoryDetails() to fetch full story content when needed.
 */
export async function loadStories(
  userId?: string | null,
): Promise<LoadStoriesResult> {
  if (!userId) {
    console.log('[StoryLibrary] ⚠️ loadStories called without userId, returning empty array');
    return { stories: [], error: null };
  }

  const supabase = getSupabase();
  console.log('[StoryLibrary] 🌐 Fetching stories list from Supabase...', {
    userId,
    limit: STORIES_LIMIT,
  });

  try {
    const { data, error } = await supabase
      .from('story_archives')
      .select(
        'id,created_by,title,article,prompt,image_path,photo_id,template_id,created_at,is_public',
      )
      .eq('created_by', userId)
      .order('created_at', { ascending: false })
      .limit(STORIES_LIMIT);

    if (error) {
      console.error('[StoryLibrary] ❌ Supabase error loading stories', error);
      return { stories: [], error };
    }

    const rows = (data ?? []) as StoryArchiveRow[];
    const mapped: ArchiveItem[] = rows.map((row) => {
      const item: ArchiveItem = { ...row, imageUrl: null };
      if (row.image_path) {
        const { data: pub } = supabase.storage.from('photos').getPublicUrl(row.image_path);
        item.imageUrl = pub?.publicUrl ?? null;
      }
      return item;
    });

    console.log('[StoryLibrary] ✅ Loaded stories', {
      count: mapped.length,
    });

    return { stories: mapped, error: null };
  } catch (err) {
    console.error('[StoryLibrary] 💥 Unexpected exception loading stories', err);
    const normalizedError = err instanceof Error ? err : new Error('Unexpected error loading stories.');
    return { stories: [], error: normalizedError };
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

    setStories([]);
    setStatus('loading');
    setErrorMessage(null);
    console.log('[StoryLibrary] 🔄 Refreshing stories list', {
      userId,
      timestamp: new Date().toISOString(),
    });

    try {
      const result = await loadStories(userId);

      if (result.error) {
        setStories([]);
        setStatus('error');
        setErrorMessage(result.error.message);
        return;
      }

      setStories(result.stories);
      setStatus('loaded');
    } catch (refreshError) {
      console.error('[StoryLibrary] ❌ Unexpected error while refreshing stories', refreshError);
      setStories([]);
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
