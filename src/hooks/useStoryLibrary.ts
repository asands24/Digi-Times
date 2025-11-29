import { useCallback, useEffect, useState } from 'react';
import { supabaseClient } from '../lib/supabaseClient';
import { persistStory } from '../lib/persistStory';
import { fetchStoriesForUser, updateStory, deleteStory as apiDeleteStory } from '../lib/storiesApi';
import type { 
  ArchiveItem, 
  StoryArchiveRow,
  SaveDraftToArchiveOptions,
  SaveDraftToArchiveResult,
  LoadStoriesResult
} from '../types/story';
import toast from 'react-hot-toast';

const STORIES_LIMIT = 50;

const toArchiveItems = (rows: StoryArchiveRow[]): ArchiveItem[] =>
  rows.map((row) => {
    const item: ArchiveItem = { ...row, imageUrl: null };
    if (row.image_path) {
      const { data: pub } = supabaseClient.storage.from('photos').getPublicUrl(row.image_path);
      item.imageUrl = pub?.publicUrl ?? null;
    }
    return item;
  });

export async function fetchStoryRows(
  userId: string,
  page = 1,
  pageSize = STORIES_LIMIT,
): Promise<{ rows: StoryArchiveRow[]; error: Error | null }> {
  console.log('[StoryLibrary] 🔍 Running Supabase select for stories', {
    userId,
    page,
    pageSize,
  });

  try {
    const data = await fetchStoriesForUser(userId, page, pageSize);

    console.log('[StoryLibrary] Supabase fetch response', { count: data.length });
    return { rows: data, error: null };

  } catch (err) {
    console.error('[StoryLibrary] ❌ Exception while fetching stories', err);
    return { rows: [], error: err instanceof Error ? err : new Error('Unknown error fetching stories') };
  }
}

export async function loadStories(userId?: string | null): Promise<LoadStoriesResult> {
  if (!userId) {
    console.log('[StoryLibrary] ⚠️ loadStories called without userId, returning empty array');
    return { stories: [], error: null };
  }

  const { rows, error } = await fetchStoryRows(userId);
  if (error) {
    const normalizedError = new Error(error.message ?? 'Unexpected Supabase error loading stories.');
    return { stories: [], error: normalizedError };
  }

  return { stories: toArchiveItems(rows), error: null };
}

export async function loadStoryDetails(storyId: string, userId: string): Promise<ArchiveItem | null> {
  console.log('[StoryLibrary] 📖 Loading full story details', {
    storyId,
    userId,
    timestamp: new Date().toISOString(),
  });

  const { data, error } = await supabaseClient
    .from('story_archives')
    .select('id,created_by,title,template_id,image_path,photo_id,created_at,updated_at,article,prompt,is_public')
    .eq('id', storyId)
    .eq('created_by', userId)
    .single();

  if (error) {
    console.error('[StoryLibrary] ❌ Failed to load story details', {
      error,
      errorMessage: error.message,
      errorCode: error.code,
      storyId,
    });
    return null;
  }

  if (!data) {
    console.warn('[StoryLibrary] ⚠️ Story not found', { storyId });
    return null;
  }

  const item: ArchiveItem = { ...data };
  if (data.image_path) {
    const { data: pub } = supabaseClient.storage.from('photos').getPublicUrl(data.image_path);
    item.imageUrl = pub?.publicUrl ?? null;
  }

  return item;
}

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

  const { data, error } = await supabaseClient
    .from('story_archives')
    .select('id,created_by,title,template_id,image_path,photo_id,created_at,updated_at,article,prompt,is_public')
    .eq('created_by', userId)
    .in('id', storyIds);

  if (error) {
    console.error('[StoryLibrary] ❌ Failed to load stories with details', {
      error,
      errorMessage: error.message,
      errorCode: error.code,
    });
    throw error;
  }

  const rows = (data ?? []) as StoryArchiveRow[];
  return rows.map((row) => {
    const item: ArchiveItem = { ...row };
    if (row.image_path) {
      const { data: pub } = supabaseClient.storage.from('photos').getPublicUrl(row.image_path);
      item.imageUrl = pub?.publicUrl ?? null;
    }
    return item;
  });
}

export async function updateStoryVisibility(id: string, nextValue: boolean): Promise<void> {
  await updateStory(id, { is_public: nextValue });
}

export function useStoryLibrary(userId?: string | null) {
  const [stories, setStories] = useState<ArchiveItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const refreshStories = useCallback(async () => {
    if (!userId) {
      setStories([]);
      setErrorMessage(null);
      return;
    }

    setIsLoading(true);
    console.log('[StoryLibrary] 🌐 Fetching stories list from Supabase...', {
      userId,
      limit: STORIES_LIMIT,
    });

    try {
      const { rows, error } = await fetchStoryRows(userId);
      console.log('[StoryLibrary] Supabase fetch response', {
        data: rows,
        error,
      });

      if (error) {
        console.error('[StoryLibrary] ❌ Failed to fetch stories', error);
        setErrorMessage(error.message);
        setStories([]);
        return;
      }

      setStories(toArchiveItems(rows));
      setErrorMessage(null);
      setPage(1);
      setHasMore(rows.length === STORIES_LIMIT);
      console.log('[StoryLibrary] ✅ Stories loaded', { count: rows.length });
    } catch (err) {
      console.error('[StoryLibrary] ❌ Exception while fetching stories', err);
      setStories([]);
      setErrorMessage(err instanceof Error ? err.message : 'Unexpected error loading stories.');
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  const loadMore = useCallback(async () => {
    if (!userId || !hasMore || isLoading) return;
    
    setIsLoading(true);
    const nextPage = page + 1;
    console.log('[StoryLibrary] 📥 Loading page', nextPage);

    try {
      const { rows, error } = await fetchStoryRows(userId, nextPage, STORIES_LIMIT);
      
      if (error) {
        console.error('[StoryLibrary] ❌ Failed to load more stories', error);
        return;
      }

      if (rows.length > 0) {
        setStories(prev => [...prev, ...toArchiveItems(rows)]);
        setPage(nextPage);
      }
      setHasMore(rows.length === STORIES_LIMIT);
    } catch (err) {
      console.error('[StoryLibrary] ❌ Exception while loading more stories', err);
    } finally {
      setIsLoading(false);
    }
  }, [userId, page, hasMore, isLoading]);

  useEffect(() => {
    console.log('[StoryLibrary] 🔄 Refreshing stories list', {
      userId,
      timestamp: new Date().toISOString(),
    });
    if (userId) {
      void refreshStories();
    } else {
      setStories([]);
      setErrorMessage(null);
    }
  }, [userId, refreshStories]);

  const saveDraftToArchive = useCallback(
    async (
      options: SaveDraftToArchiveOptions & { onProgress?: (percent: number) => void }
    ): Promise<SaveDraftToArchiveResult> => {
      const { entry, template, userId, headline, bodyHtml, prompt, onProgress } = options;

      console.log('[Archive] saveDraftToArchive called', {
        entryId: entry.id,
        hasArticle: Boolean(entry.article),
        hasFile: Boolean(entry.file),
        userId: userId,
      });

      if (!userId) {
        return { story: null, error: new Error('User not authenticated') };
      }

      if (!entry.article) {
        console.warn('[Archive] ⚠️ No article on entry, skipping save');
        return { story: null, error: new Error('No article to save') };
      }

      if (!entry.file) {
        const missingFileError = new Error('No image file to save');
        console.warn('[Archive] ⚠️ No file attached to entry, cannot save image', {
          entryId: options.entry.id,
          userId: options.userId,
        });
        return { story: null, error: missingFileError };
      }

      const draftPayload = {
        file: entry.file,
        meta: {
          headline,
          bodyHtml,
          prompt,
        },
        templateId: template?.id,
        userId,
        onProgress,
      };

      console.log('[Archive] Draft payload before persist', {
        headline,
        prompt,
      });

      try {
        const result = await persistStory(draftPayload);
        console.log('[Archive] persistStory result', {
          mode: result.mode,
          storyId: result.id,
        });

        await refreshStories();
        return { story: result.story, error: null };
      } catch (err) {
        const normalizedError = err instanceof Error ? err : new Error('Unknown error saving story');
        console.error('[Archive] ❌ Failed to persist story', normalizedError);
        return { story: null, error: normalizedError };
      }
    },
    [refreshStories],
  );

  const deleteStory = useCallback(
    async (id: string) => {
      if (!userId) return;

      // Optimistic update
      const previousStories = [...stories];
      setStories((prev) => prev.filter((s) => s.id !== id));

      try {
        await apiDeleteStory(id);
        toast.success('Story deleted');
      } catch (err) {
        console.error('Failed to delete story', err);
        toast.error('Could not delete story');
        // Rollback
        setStories(previousStories);
      }
    },
    [userId, stories]
  );

  return {
    stories,
    isLoading,
    errorMessage,
    refreshStories,
    saveDraftToArchive,
    deleteStory,
    loadMore,
    hasMore,
  };
}

export type { ArchiveItem } from '../types/story';
export { persistStory, validateStoryPersistenceSetup } from '../lib/persistStory';
