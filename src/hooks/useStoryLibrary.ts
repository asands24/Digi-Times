import { useCallback, useEffect, useState } from 'react';
import type { PostgrestError } from '@supabase/supabase-js';
import { getSupabase, supabaseClient } from '../lib/supabaseClient';
import { persistStory } from '../lib/persistStory';
import type { ArchiveItem, DraftEntry, StoryTemplate, StoryArchiveRow } from '../types/story';

const STORIES_LIMIT = 50;

export type SaveDraftToArchiveOptions = {
  entry: DraftEntry;
  template: StoryTemplate | null;
  userId: string;
  headline: string;
  bodyHtml: string;
  prompt: string | null;
};

export type SaveDraftToArchiveResult = {
  story: ArchiveItem | null;
  error: Error | null;
};

export type LoadStoriesResult = {
  stories: ArchiveItem[];
  error: Error | null;
};

const STORY_COLUMNS =
  'id,created_by,title,template_id,image_path,photo_id,created_at,updated_at,article,prompt,is_public';

const toArchiveItems = (rows: StoryArchiveRow[]): ArchiveItem[] =>
  rows.map((row) => {
    const item: ArchiveItem = { ...row, imageUrl: null };
    if (row.image_path) {
      const { data: pub } = supabaseClient.storage.from('photos').getPublicUrl(row.image_path);
      item.imageUrl = pub?.publicUrl ?? null;
    }
    return item;
  });

const fetchStoryRows = async (
  userId: string,
): Promise<{ rows: StoryArchiveRow[]; error: PostgrestError | null }> => {
  const supabase = supabaseClient ?? getSupabase();
  if (!supabase) {
    throw new Error('[StoryLibrary] No Supabase client available for fetching stories');
  }

  const runSelect = async (): Promise<{ rows: StoryArchiveRow[]; error: PostgrestError | null }> => {
    const { data, error } = await supabase
      .from('story_archives')
      .select(STORY_COLUMNS)
      .eq('created_by', userId)
      .order('created_at', { ascending: false })
      .limit(STORIES_LIMIT);
    console.log('[StoryLibrary] Supabase raw select response', { data, error });
    return {
      rows: (data ?? []) as StoryArchiveRow[],
      error,
    };
  };

  const timeoutMs = 10000;
  const timeoutPromise = new Promise<never>((_, reject) => {
    setTimeout(() => {
      console.error('[StoryLibrary] ❌ Supabase fetch timed out', { userId });
      reject(new Error('Supabase fetch timed out'));
    }, timeoutMs);
  });

  return Promise.race([runSelect(), timeoutPromise]) as Promise<{
    rows: StoryArchiveRow[];
    error: PostgrestError | null;
  }>;
};

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
  const { error } = await supabaseClient
    .from('story_archives')
    .update({ is_public: nextValue })
    .eq('id', id);
  if (error) throw error;
}

export function useStoryLibrary(userId?: string | null) {
  const [stories, setStories] = useState<ArchiveItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

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
      console.log('[StoryLibrary] ✅ Stories loaded', { count: rows.length });
    } catch (err) {
      console.error('[StoryLibrary] ❌ Exception while fetching stories', err);
      setStories([]);
      setErrorMessage(err instanceof Error ? err.message : 'Unexpected error loading stories.');
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

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
    async (options: SaveDraftToArchiveOptions): Promise<SaveDraftToArchiveResult> => {
      console.log('[Archive] saveDraftToArchive called', {
        entryId: options.entry.id,
        hasArticle: Boolean(options.entry.article),
        hasFile: Boolean(options.entry.file),
        userId: options.userId,
      });

      if (!options.entry.article) {
        console.warn('[Archive] ⚠️ No article on entry, skipping save');
        return { story: null, error: new Error('No article to save') };
      }

      if (!options.entry.file) {
        const missingFileError = new Error('No image file to save');
        console.warn('[Archive] ⚠️ No file attached to entry, cannot save image', {
          entryId: options.entry.id,
          userId: options.userId,
        });
        return { story: null, error: missingFileError };
      }

      const draftPayload = {
        file: options.entry.file,
        meta: {
          headline: options.headline,
          bodyHtml: options.bodyHtml,
          prompt: options.prompt ?? null,
        },
        userId: options.userId,
      };

      console.log('[Archive] Draft payload before persist', {
        headline: options.headline,
        prompt: draftPayload.meta.prompt,
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

  return {
    stories,
    isLoading,
    errorMessage,
    refreshStories,
    saveDraftToArchive,
  };
}

export type { ArchiveItem } from '../types/story';
export { persistStory, validateStoryPersistenceSetup } from '../lib/persistStory';
