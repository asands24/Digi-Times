import { getSupabase } from '../lib/supabaseClient';
import type { ArchiveItem } from '../types/story';

export type PersistStoryParams = {
  file: File;
  meta: {
    headline: string;
    bodyHtml: string;
    prompt?: string | null;
  };
  templateId: string | null;
  userId: string;
};

export type PersistStoryResult = {
  filePath: string;
  story: ArchiveItem;
};

export async function persistStory(params: PersistStoryParams): Promise<PersistStoryResult> {
  const supabase = getSupabase();
  const { file, meta, templateId, userId } = params;

  const payload = {
    title: meta.headline,
    article: meta.bodyHtml,
    prompt: meta.prompt ?? null,
    image_path: `stories/${userId}/${Date.now()}-${file.name}`,
    template_id: templateId ?? null,
    created_by: userId,
  };

  console.log('[persistStory] input', { isEditing: false, storyId: null, payload });
  console.log('[persistStory] inserting row', payload);

  const uploadStartTime = Date.now();
  const up = await supabase.storage.from('photos').upload(payload.image_path, file, {
    cacheControl: '3600',
    upsert: false,
  });
  const uploadDuration = Date.now() - uploadStartTime;

  if (up.error) {
    console.error('[persistStory] ❌ Image upload failed', {
      error: up.error,
      duration: uploadDuration,
    });
    throw up.error;
  }

  const insertStartTime = Date.now();
  const { data: inserted, error: insErr } = await supabase
    .from('story_archives')
    .insert(payload)
    .select(
      'id,created_by,title,template_id,image_path,photo_id,created_at,updated_at,article,prompt,is_public',
    )
    .single();

  console.log('[persistStory] Supabase response', {
    data: inserted,
    error: insErr,
    duration: Date.now() - insertStartTime,
  });

  if (insErr) {
    if (['42501', 'PGRST301', '403'].includes(insErr.code ?? '')) {
      console.warn('[persistStory] RLS likely blocking insert', insErr);
    }
    const criticalKeywords = ['column does not exist', 'violates not-null constraint', 'invalid input'];
    if (
      criticalKeywords.some((keyword) => insErr.message?.toLowerCase().includes(keyword))
    ) {
      console.error('[persistStory] 🔥 Critical schema mismatch:', insErr);
    }
    throw insErr;
  }

  const normalized: ArchiveItem = {
    ...inserted,
    imageUrl: null,
  };

  if (inserted?.image_path) {
    const { data: pub } = supabase.storage.from('photos').getPublicUrl(inserted.image_path);
    normalized.imageUrl = pub?.publicUrl ?? null;
  }

  console.log('[persistStory] final payload after cleanup', payload);
  return { filePath: payload.image_path, story: normalized };
}
