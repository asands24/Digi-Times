import type { ArchiveItem } from '../types/story';

const CACHE_KEY = 'digitimes.story-archive';

type CachedArchiveItem = ArchiveItem & { user_id?: string | null };
type CacheStore = Record<string, CachedArchiveItem[]>;

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

const normalizeStory = (story: CachedArchiveItem, userId: string): ArchiveItem => {
  if (story.created_by) {
    return story;
  }
  const legacyOwner = story.user_id ?? userId;
  return { ...story, created_by: legacyOwner };
};

export const getCachedStories = (userId?: string | null): ArchiveItem[] => {
  if (!userId) {
    return [];
  }
  const cache = readCache();
  return (cache[userId] ?? []).map((story) => normalizeStory(story, userId));
};

export const cacheStories = (userId: string, stories: ArchiveItem[]): void => {
  if (!userId) {
    return;
  }
  const cache = readCache();
  cache[userId] = stories.map((story) => normalizeStory(story, userId));
  writeCache(cache);
};

export const cacheStory = (userId: string, story: ArchiveItem): void => {
  if (!userId) {
    return;
  }
  const cache = readCache();
  const storyWithOwner = normalizeStory(story, userId);
  const existing = (cache[userId] ?? []).map((item) => normalizeStory(item, userId));
  const next = [
    storyWithOwner,
    ...existing.filter((item) => item.id !== story.id && !item.isSample),
  ];
  cache[userId] = next;
  writeCache(cache);
};
