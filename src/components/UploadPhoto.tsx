import React, { useState } from 'react';
import { getSupabase } from '../lib/supabaseClient';

function generateKey(): string {
  const cryptoApi = typeof globalThis !== 'undefined'
    ? (globalThis.crypto as Crypto | undefined)
    : undefined;
  if (cryptoApi?.randomUUID) {
    return cryptoApi.randomUUID();
  }
  try {
    const objectUrl = URL.createObjectURL(new Blob());
    const key = objectUrl.split('/').pop() || `${Date.now()}`;
    URL.revokeObjectURL(objectUrl);
    return key;
  } catch {
    return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  }
}

export default function UploadPhoto(): JSX.Element {
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<string>('');
  const [uploading, setUploading] = useState(false);

  async function handleUpload() {
    if (!file || uploading) return;
    setUploading(true);
    setStatus('Uploading...');
    try {
      const supabase = getSupabase();
      if (!file.type.startsWith('image/')) {
        throw new Error('Only images are allowed.');
      }
      if (file.size > 10 * 1024 * 1024) {
        throw new Error('Max 10MB.');
      }
      const extensionFromType =
        typeof file.type === 'string' && file.type.includes('/')
          ? file.type.split('/').pop()
          : undefined;
      const extensionFromName =
        typeof file.name === 'string' && file.name.includes('.')
          ? file.name.split('.').pop()
          : undefined;
      const extension = (extensionFromType || extensionFromName || 'jpg').toLowerCase();
      const key = `public/${generateKey()}.${extension}`;

      const { error } = await supabase.storage.from('photos').upload(key, file, {
        upsert: false,
        cacheControl: '3600',
      });
      if (error) throw error;

      const { data } = supabase.storage.from('photos').getPublicUrl(key);
      setStatus(`Uploaded! ${data.publicUrl}`);
      setFile(null);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Upload failed.';
      console.error('Upload failed', error);
      setStatus(message);
    } finally {
      setUploading(false);
    }
  }

  return (
    <div style={{ display: 'grid', gap: 8, maxWidth: 440, margin: '0 auto' }}>
      <input
        type="file"
        accept="image/*"
        onChange={(event) => setFile(event.target.files?.[0] ?? null)}
      />
      <button onClick={handleUpload} disabled={!file || uploading}>
        {uploading ? 'Uploading...' : 'Upload'}
      </button>
      {status ? <small>{status}</small> : null}
    </div>
  );
}
