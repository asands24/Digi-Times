import { SUPABASE_URL } from './config';

export interface StoredPhoto { path: string; width?: number; height?: number; }
export interface StoryPhoto { url: string; width?: number; height?: number; }
export interface PhotoStory { image_path?: string | null; imageUrl?: string | null; images?: StoredPhoto[]; imageUrls?: StoryPhoto[]; }
export function storyPhotos(story: PhotoStory): StoryPhoto[] {
  if (story.imageUrls) return story.imageUrls.filter(photo => typeof photo?.url === 'string' && photo.url.length > 0);
  const stored = Array.isArray(story.images) ? story.images.filter(photo => photo && typeof photo.path === 'string' && photo.path.length) : [];
  const paths = stored.length ? stored : story.image_path ? [{ path: story.image_path }] : [];
  if (paths.length) return paths.map(photo => ({ url: `${SUPABASE_URL}/storage/v1/object/public/photos/${photo.path}`, width: photo.width, height: photo.height }));
  return story.imageUrl ? [{ url: story.imageUrl }] : [];
}
export function validatePhoto(file: File): void {
  if (!['image/jpeg', 'image/png', 'image/webp', 'image/gif'].includes(file.type)) throw new Error('Use a JPEG, PNG, WebP or GIF photo.');
  if (!file.size || file.size > 10 * 1024 * 1024) throw new Error('Each photo must be between 1 byte and 10 MB.');
}

// Only this temporary, reduced copy is sent to vision. Original files are retained for saving.
export async function visionPhoto(file: File): Promise<string> {
  validatePhoto(file);
  const url = URL.createObjectURL(file);
  try {
    const image = await new Promise<HTMLImageElement>((resolve, reject) => {
      const image = new Image();
      const timer = setTimeout(() => reject(new Error('Photo could not be decoded. Try a JPEG or PNG.')), 15000);
      image.onload = () => { clearTimeout(timer); resolve(image); };
      image.onerror = () => { clearTimeout(timer); reject(new Error('Photo could not be decoded.')); };
      image.src = url;
    });
    let edge = 1280;
    for (;;) {
      const ratio = Math.min(1, edge / Math.max(image.naturalWidth, image.naturalHeight));
      const canvas = document.createElement('canvas'); canvas.width = Math.max(1, Math.round(image.naturalWidth * ratio)); canvas.height = Math.max(1, Math.round(image.naturalHeight * ratio));
      const context = canvas.getContext('2d'); if (!context) throw new Error('Photo analysis is unavailable in this browser.');
      context.fillStyle = '#fff'; context.fillRect(0, 0, canvas.width, canvas.height); context.drawImage(image, 0, 0, canvas.width, canvas.height);
      const data = canvas.toDataURL('image/jpeg', .8);
      if (data.length <= 250000) return data;
      edge = Math.floor(edge * .75);
      if (edge < 160) throw new Error('Photo is too complex to analyze. Try a smaller photo.');
    }
  } finally { URL.revokeObjectURL(url); }
}
