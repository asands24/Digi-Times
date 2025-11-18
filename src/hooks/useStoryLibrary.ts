import { getSupabase } from '../lib/supabaseClient';
import type { Database } from '../types/supabase';
import type { ArchiveItem } from '../types/story';
import { cacheStories, cacheStory, getCachedStories } from '../utils/storyCache';
import { buildStarterStory } from '../utils/storySeeds';

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
  if (!templateId) throw new Error('Pick a template before saving');

  const filePath = `stories/${userId}/${Date.now()}-${file.name}`;
  const up = await supabase.storage.from('photos').upload(filePath, file, {
    cacheControl: '3600',
    upsert: false,
  });
  if (up.error) throw up.error;

  const payload: StoryArchiveInsert = {
    title: meta.headline,
    article: meta.bodyHtml,
    prompt: meta.prompt ?? null,
    image_path: filePath,
    template_id: templateId,
    user_id: userId,
  };

  const {
    data: inserted,
    error: insErr,
  } = await supabase
    .from('story_archives')
    .insert(payload)
    .select(
      'id,user_id,title,template_id,image_path,created_at,updated_at,article,prompt,is_public',
    )
    .single();
  if (insErr || !inserted) {
    throw insErr ?? new Error('Failed to save story.');
  }

  const normalized: ArchiveItem = {
    ...inserted,
    user_id: inserted.user_id ?? userId,
    imageUrl: null,
  };

  if (inserted.image_path) {
    const { data: pub } = supabase.storage.from('photos').getPublicUrl(inserted.image_path);
    normalized.imageUrl = pub?.publicUrl ?? null;
  }

  cacheStory(userId, normalized);

  return { filePath, story: normalized };
}

export type { ArchiveItem } from '../types/story';

export async function loadStories(userId?: string | null): Promise<ArchiveItem[]> {
  if (!userId) {
    return [];
  }

  const supabase = getSupabase();
  const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
  let timeout: ReturnType<typeof setTimeout> | null = null;

  let query = supabase
    .from('story_archives')
    .select(
      'id,user_id,title,template_id,image_path,created_at,updated_at,article,prompt,is_public',
    )
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (controller) {
    query = query.abortSignal(controller.signal);
    timeout = setTimeout(() => controller.abort(), 10000);
  }

  try {
    const { data, error } = await query;
    if (error) throw error;

    const rows = (data ?? []) as StoryArchiveRow[];
    const mapped: ArchiveItem[] = rows.map((r) => {
      if (!r.image_path) {
        return { ...r };
      }
      const { data: pub } = supabase.storage.from('photos').getPublicUrl(r.image_path);
      return { ...r, imageUrl: pub?.publicUrl ?? null };
    });

    if (mapped.length === 0) {
      const starter = buildStarterStory(userId);
      cacheStories(userId, [starter]);
      return [starter];
    }

    cacheStories(userId, mapped);
    return mapped;
  } catch (error) {
    const cached = getCachedStories(userId);
    if (cached.length > 0) {
      if (process.env.NODE_ENV !== 'production') {
        console.warn('Falling back to cached stories after load failure.', error);
      }
      return cached;
    }

    const starter = buildStarterStory(userId);
    cacheStories(userId, [starter]);

    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('Loading saved stories timed out. Please try again.');
    }
    throw new Error("We couldn't load your archive. Please refresh and try again.");
  } finally {
    if (timeout) {
      clearTimeout(timeout);
    }
  }
}

export async function updateStoryVisibility(id: string, nextValue: boolean): Promise<void> {
  const supabase = getSupabase();
  const { error } = await supabase
    .from('story_archives')
    .update({ is_public: nextValue })
    .eq('id', id);
  if (error) throw error;
}
