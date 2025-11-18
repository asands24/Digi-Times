import type { ArchiveItem } from '../types/story';

const CACHE_KEY = 'digitimes.story-archive';

type CacheStore = Record<string, ArchiveItem[]>;

const getStorage = () => {
  if (typeof window === 'undefined' || !window.localStorage) {
    return null;
  }
  return window.localStorage;
};

const readCache = (): CacheStore => {
  const storage = getStorage();
  if (!storage) {
    return {};
  }
  try {
    const raw = storage.getItem(CACHE_KEY);
    if (!raw) {
      return {};
    }
    const parsed = JSON.parse(raw) as CacheStore;
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
};

const writeCache = (data: CacheStore) => {
  const storage = getStorage();
  if (!storage) {
    return;
  }
  try {
    storage.setItem(CACHE_KEY, JSON.stringify(data));
  } catch {
    // ignore quota errors
  }
};

export const getCachedStories = (userId?: string | null): ArchiveItem[] => {
  if (!userId) {
    return [];
  }
  const cache = readCache();
  return cache[userId] ?? [];
};

export const cacheStories = (userId: string, stories: ArchiveItem[]): void => {
  if (!userId) {
    return;
  }
  const cache = readCache();
  cache[userId] = stories;
  writeCache(cache);
};

export const cacheStory = (userId: string, story: ArchiveItem): void => {
  if (!userId) {
    return;
  }
  const cache = readCache();
  const existing = cache[userId] ?? [];
  const next = [story, ...existing.filter((item) => item.id !== story.id && !item.isSample)];
  cache[userId] = next;
  writeCache(cache);
};
