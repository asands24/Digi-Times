import { getSupabase } from './supabaseClient';

const DEBUG_PHOTOS = process.env.NODE_ENV !== 'production';

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

  if (DEBUG_PHOTOS) {
    console.log('[Photos] Uploading file to Supabase storage', {
      fileName: file.name,
      size: file.size,
      key,
    });
  }

  const { error: uploadError } = await supabase.storage
    .from('photos')
    .upload(key, file, {
      cacheControl: '3600',
      upsert: false,
    });

  if (uploadError) {
    if (DEBUG_PHOTOS) {
      console.error('[Photos] Upload failed', { key, error: uploadError.message });
    }
    throw uploadError;
  }

  const { data } = supabase.storage.from('photos').getPublicUrl(key);
  if (DEBUG_PHOTOS) {
    console.log('[Photos] Upload succeeded', { key, publicUrl: data.publicUrl });
  }
  return { file_path: key, publicUrl: data.publicUrl };
}
