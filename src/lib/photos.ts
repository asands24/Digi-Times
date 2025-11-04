import { getSupabase } from './supabaseClient';

export interface UploadedPhotoInfo {
  file_path: string;
  publicUrl: string;
}

export async function uploadPhotoToStorage(
  file: File,
  userId: string,
): Promise<UploadedPhotoInfo> {
  if (!file) {
    throw new Error('No file');
  }

  if (file.size > 4 * 1024 * 1024) {
    throw new Error('File is too large (max 4MB)');
  }

  const extension = (file.name.split('.').pop() || 'jpg').toLowerCase();
  const key = `users/${userId}/${Date.now()}.${extension}`;
  const supabase = getSupabase();

  const { error: uploadError } = await supabase.storage
    .from('photos')
    .upload(key, file, {
      cacheControl: '3600',
      upsert: false,
    });

  if (uploadError) {
    throw uploadError;
  }

  const { data } = supabase.storage.from('photos').getPublicUrl(key);
  return { file_path: key, publicUrl: data.publicUrl };
}
