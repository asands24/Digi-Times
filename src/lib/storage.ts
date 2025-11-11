import { SUPABASE_URL } from './config';

export function publicPhotoUrl(path: string) {
  return `${SUPABASE_URL}/storage/v1/object/public/photos/${encodeURIComponent(path)}`;
}
