import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { uploadPhotoToStorage } from '../lib/photos';
import { supabase } from '../lib/supabaseClient';
import type { StoryRecord } from '../types/story';
import type { GeneratedArticle } from '../utils/storyGenerator';

interface PhotoRow {
  id: string;
  file_path: string;
  file_name: string;
  caption: string | null;
  uploaded_by: string;
}

interface StoryArchiveRow {
  id: string;
  user_id: string;
  prompt: string;
  article: unknown;
  created_at: string;
  updated_at: string;
  photo?: PhotoRow | null;
}

const isGeneratedArticle = (value: unknown): value is GeneratedArticle => {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const record = value as Partial<GeneratedArticle>;
  return (
    typeof record.headline === 'string' &&
    typeof record.subheadline === 'string' &&
    typeof record.byline === 'string' &&
    typeof record.dateline === 'string' &&
    Array.isArray(record.body) &&
    record.body.every((entry) => typeof entry === 'string') &&
    typeof record.quote === 'string' &&
    Array.isArray(record.tags)
  );
};

const mapRowToStory = (row: StoryArchiveRow): StoryRecord => {
  const article = isGeneratedArticle(row.article)
    ? row.article
    : {
        headline: 'Untitled Story',
        subheadline: '',
        byline: '',
        dateline: '',
        body: [],
        quote: '',
        tags: [],
      };

  const photo = row.photo ?? null;
  const publicUrl =
    photo?.file_path
      ? supabase.storage.from('photos').getPublicUrl(photo.file_path).data.publicUrl
      : '';

  return {
    id: row.id,
    prompt: row.prompt,
    article,
    image: photo
      ? {
          id: photo.id,
          fileName: photo.file_name,
          filePath: photo.file_path,
          publicUrl,
          caption: photo.caption ?? null,
          uploadedBy: photo.uploaded_by,
        }
      : null,
    createdAt: row.created_at ?? new Date().toISOString(),
    updatedAt: row.updated_at ?? row.created_at ?? new Date().toISOString(),
  };
};

export interface SaveStoryPayload {
  prompt: string;
  article: GeneratedArticle;
  file: File;
  caption?: string | null;
  createdAt?: string;
}

export const useStoryLibrary = () => {
  const [stories, setStories] = useState<StoryRecord[]>([]);
  const storiesRef = useRef<StoryRecord[]>([]);

  useEffect(() => {
    storiesRef.current = stories;
  }, [stories]);

  const loadStories = useCallback(
    async (userId: string, { silent } = { silent: false }) => {
      const { data, error } = await supabase
        .from('story_archives')
        .select(
          `
            id,
            user_id,
            prompt,
            article,
            created_at,
            updated_at,
            photo:photos (
              id,
              file_path,
              file_name,
              caption,
              uploaded_by
            )
          `,
        )
        .eq('user_id', userId)
        .order('updated_at', { ascending: false });

      if (error) {
        if (!silent) {
          toast.error('Failed to load stories.');
        }
        throw error;
      }

      const mapped = (data ?? []).map(mapRowToStory);
      setStories(mapped);
      return mapped;
    },
    [],
  );

  useEffect(() => {
    let cancelled = false;

    const bootstrap = async () => {
      const { data, error } = await supabase.auth.getUser();
      if (error) {
        toast.error('Failed to load stories.');
        return;
      }

      const user = data.user;
      if (!user) {
        setStories([]);
        return;
      }

      if (cancelled) {
        return;
      }

      try {
        await loadStories(user.id, { silent: true });
      } catch {
        // toast already handled
      }
    };

    void bootstrap();

    return () => {
      cancelled = true;
    },
  );

  const saveStory = useCallback(
    async (payload: SaveStoryPayload) => {
      const { data: authData, error: authError } = await supabase.auth.getUser();
      if (authError) {
        toast.error('Failed to save story.');
        throw authError;
      }

      const user = authData.user;
      if (!user) {
        const error = new Error('You must be signed in to save stories.');
        toast.error(error.message);
        throw error;
      }

      let uploaded:
        | {
            file_path: string;
            publicUrl: string;
          }
        | null = null;

      try {
        uploaded = await uploadPhotoToStorage(payload.file, user.id);
      } catch (error) {
        const message =
          error instanceof Error ? error.message : 'Failed to upload photo';
        if (message.includes('max 4MB')) {
          toast.error('Photo is too large. Max 4MB.');
        } else {
          toast.error(message);
        }
        throw error;
      }

      if (!uploaded) {
        const error = new Error('Failed to upload photo');
        toast.error(error.message);
        throw error;
      }

      let photoRecord: PhotoRow | null = null;

      try {
        const { data, error: insertError } = await supabase
          .from('photos')
          .insert({
            file_path: uploaded.file_path,
            file_name: payload.file.name,
            caption: payload.caption ?? null,
            uploaded_by: user.id,
          })
          .select('id, file_path, file_name, caption, uploaded_by')
          .single();

        if (insertError || !data) {
          throw insertError ?? new Error('Failed to store photo metadata');
        }

        photoRecord = data as PhotoRow;
      } catch (error) {
        await supabase.storage.from('photos').remove([uploaded.file_path]);
        const message =
          error instanceof Error ? error.message : 'Failed to store photo metadata';
        toast.error(message);
        throw error;
      }

      try {
        const timestamp = new Date().toISOString();
        const { data, error: storyError } = await supabase
          .from('story_archives')
          .insert({
            user_id: user.id,
            prompt: payload.prompt,
            article: payload.article,
            photo_id: photoRecord?.id ?? null,
            created_at: payload.createdAt ?? timestamp,
            updated_at: timestamp,
          })
          .select(
            `
              id,
              user_id,
              prompt,
              article,
              created_at,
              updated_at,
              photo:photos (
                id,
                file_path,
                file_name,
                caption,
                uploaded_by
              )
            `,
          )
          .single();

        if (storyError || !data) {
          throw storyError ?? new Error('Failed to save story');
        }

        const story = mapRowToStory(data as StoryArchiveRow);
        setStories((prev) => [story, ...prev.filter((item) => item.id !== story.id)]);
        return story;
      } catch (error) {
        if (photoRecord?.id) {
          await supabase.from('photos').delete().eq('id', photoRecord.id);
        }
        await supabase.storage.from('photos').remove([uploaded.file_path]);
        const message =
          error instanceof Error ? error.message : 'Failed to save story';
        toast.error(message);
        throw error;
      }
    },
    [],
  );

  const removeStory = useCallback(async (id: string) => {
    const target = storiesRef.current.find((story) => story.id === id);
    if (!target) {
      toast.error('Story not found.');
      return;
    }

    try {
      const { error } = await supabase.from('story_archives').delete().eq('id', id);
      if (error) {
        throw error;
      }

      if (target.image) {
        await supabase.from('photos').delete().eq('id', target.image.id);
        await supabase.storage.from('photos').remove([target.image.filePath]);
      }

      setStories((prev) => prev.filter((story) => story.id !== id));
      toast.success('Story removed from archive.');
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Failed to remove story';
      toast.error(message);
      throw error;
    }
  }, []);

  const updateStory = useCallback(
    async (id: string, updater: (story: StoryRecord) => StoryRecord) => {
      const current = storiesRef.current.find((story) => story.id === id);
      if (!current) {
        toast.error('Story not found.');
        return;
      }

      const updated = updater(current);
      const nextUpdatedAt = new Date().toISOString();

      try {
        const { error } = await supabase
          .from('story_archives')
          .update({
            prompt: updated.prompt,
            article: updated.article,
            updated_at: nextUpdatedAt,
          })
          .eq('id', id);

        if (error) {
          throw error;
        }

        setStories((prev) =>
          prev.map((story) =>
            story.id === id
              ? {
                  ...updated,
                  image: updated.image ?? current.image,
                  updatedAt: nextUpdatedAt,
                }
              : story,
          ),
        );
        toast.success('Story updated.');
      } catch (error) {
        const message =
          error instanceof Error ? error.message : 'Failed to update story';
        toast.error(message);
        throw error;
      }
    },
    [],
  );

  const clearStories = useCallback(async () => {
    const currentStories = storiesRef.current;
    if (currentStories.length === 0) {
      return;
    }

    const { data, error } = await supabase.auth.getUser();
    if (error) {
      toast.error('Failed to clear archive.');
      throw error;
    }

    const user = data.user;
    if (!user) {
      const authError = new Error('You must be signed in to clear the archive.');
      toast.error(authError.message);
      throw authError;
    }

    try {
      const { error: deleteError } = await supabase
        .from('story_archives')
        .delete()
        .eq('user_id', user.id);

      if (deleteError) {
        throw deleteError;
      }

      const photoIds = currentStories
        .map((story) => story.image?.id)
        .filter((value): value is string => Boolean(value));
      if (photoIds.length > 0) {
        await supabase.from('photos').delete().in('id', photoIds);

        const paths = currentStories
          .map((story) => story.image?.filePath)
          .filter((value): value is string => Boolean(value));
        if (paths.length > 0) {
          await supabase.storage.from('photos').remove(paths);
        }
      }

      setStories([]);
      toast.success('Archive cleared.');
    } catch (clearError) {
      const message =
        clearError instanceof Error ? clearError.message : 'Failed to clear archive';
      toast.error(message);
      throw clearError;
    }
  }, []);

  const exportStories = useCallback(() => {
    const payload = {
      version: 2,
      stories,
    };

    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'digitimes-story-archive.json';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, [stories]);

  const stats = useMemo(() => {
    if (stories.length === 0) {
      return { lastUpdated: null as string | null };
    }
    const sorted = [...stories].sort(
      (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
    );
    return { lastUpdated: sorted[0]?.updatedAt ?? null };
  }, [stories]);

  return {
    stories,
    saveStory,
    removeStory,
    updateStory,
    clearStories,
    exportStories,
    stats,
  };
};
