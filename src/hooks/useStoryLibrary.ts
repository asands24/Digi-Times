import { useCallback, useEffect, useMemo, useState } from 'react';
import type { StoryRecord, StoryArchive } from '../types/story';
import type { GeneratedArticle } from '../utils/storyGenerator';

const STORAGE_KEY = 'digitimes::story-archive';
const STORAGE_VERSION = 1;

const createArchive = (stories: StoryRecord[]): StoryArchive => ({
  version: STORAGE_VERSION,
  stories,
});

const generateStoryId = () => {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  return `story-${Date.now().toString(36)}-${Math.random()
    .toString(36)
    .slice(2, 10)}`;
};

const loadArchive = (): StoryRecord[] => {
  if (typeof window === 'undefined') {
    return [];
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return [];
    }

    const parsed = JSON.parse(raw) as StoryArchive;
    if (!parsed || typeof parsed !== 'object') {
      return [];
    }

    if (parsed.version !== STORAGE_VERSION || !Array.isArray(parsed.stories)) {
      return [];
    }

    return parsed.stories.filter(
      (story): story is StoryRecord =>
        Boolean(
          story &&
            typeof story.id === 'string' &&
            story.image &&
            typeof story.image.dataUrl === 'string',
        ),
    );
  } catch (error) {
    console.warn('Failed to read story archive from storage:', error);
    return [];
  }
};

const persistArchive = (stories: StoryRecord[]) => {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    const archive = createArchive(stories);
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(archive));
  } catch (error) {
    console.warn('Failed to persist story archive:', error);
  }
};

export interface SaveStoryPayload {
  id?: string;
  prompt: string;
  article: GeneratedArticle;
  image: StoryRecord['image'];
  createdAt?: string;
}

export const useStoryLibrary = () => {
  const [stories, setStories] = useState<StoryRecord[]>(() => loadArchive());

  useEffect(() => {
    persistArchive(stories);
  }, [stories]);

  const saveStory = useCallback((payload: SaveStoryPayload) => {
    const now = new Date().toISOString();
    const story: StoryRecord = {
      id: payload.id ?? generateStoryId(),
      prompt: payload.prompt,
      article: payload.article,
      image: payload.image,
      createdAt: payload.createdAt ?? now,
      updatedAt: now,
    };
    setStories((prev) => {
      const existingIndex = prev.findIndex((item) => item.id === story.id);
      if (existingIndex >= 0) {
        const next = [...prev];
        next[existingIndex] = story;
        return next;
      }
      return [...prev, story];
    });
    return story;
  }, []);

  const removeStory = useCallback((id: string) => {
    setStories((prev) => prev.filter((story) => story.id !== id));
  }, []);

  const updateStory = useCallback(
    (id: string, updater: (story: StoryRecord) => StoryRecord) => {
      setStories((prev) => {
        const index = prev.findIndex((story) => story.id === id);
        if (index === -1) {
          return prev;
        }

        const updated = updater(prev[index]);
        const next = [...prev];
        next[index] = {
          ...updated,
          updatedAt: new Date().toISOString(),
        };
        return next;
      });
    },
    [],
  );

  const clearStories = useCallback(() => {
    setStories([]);
  }, []);

  const exportStories = useCallback(() => {
    const archive = createArchive(stories);
    const blob = new Blob([JSON.stringify(archive, null, 2)], {
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
