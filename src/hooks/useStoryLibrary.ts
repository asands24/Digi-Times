import { getSupabase } from '../lib/supabaseClient';

export type PersistMeta = {
  headline: string;
  bodyHtml: string;
  prompt?: string;
};

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

  const { error: insErr } = await supabase.from('story_archives').insert({
    title: meta.headline,
    article: meta.bodyHtml,
    prompt: meta.prompt ?? null,
    image_path: filePath,
    template_id: templateId,
    user_id: userId,
  });
  if (insErr) throw insErr;

  return { filePath };
}

export type ArchiveItem = {
  id: string;
  title: string | null;
  template_id: string | null;
  image_path: string | null;
  created_at: string;
  article?: string | null;
  prompt?: string | null;
  imageUrl?: string | null;
  is_public?: boolean | null;
};

export async function loadStories(userId?: string | null): Promise<ArchiveItem[]> {
  if (!userId) {
    return [];
  }

  const supabase = getSupabase();
  const { data, error } = await supabase
    .from('story_archives')
    .select('id,title,template_id,image_path,created_at,article,prompt,is_public')
    .order('created_at', { ascending: false });

  if (error) throw error;

  const rows = (data ?? []) as ArchiveItem[];

  return rows.map((r) => {
    if (!r.image_path) return r;
    const { data: pub } = supabase.storage.from('photos').getPublicUrl(r.image_path);
    return { ...r, imageUrl: pub?.publicUrl ?? null };
  });
}

export async function updateStoryVisibility(id: string, nextValue: boolean): Promise<void> {
  const supabase = getSupabase();
  const { error } = await supabase
    .from('story_archives')
    .update({ is_public: nextValue })
    .eq('id', id);
  if (error) throw error;
}
