import { useState } from 'react';
import type { JSX } from 'react';
import { supabase } from '../lib/supabaseClient';

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

export default function UploadPhoto(): JSX.Element {
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<string>('');
  const [uploading, setUploading] = useState(false);

  async function handleUpload() {
    if (!file || uploading) return;
    setUploading(true);
    setStatus('Uploading...');
    try {
      if (!ALLOWED_MIME_TYPES.includes(file.type)) {
        throw new Error('Only JPG, PNG, GIF, or WEBP images are allowed.');
      }
      if (file.size > 10 * 1024 * 1024) {
        throw new Error('Max 10MB.');
      }
      const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg';
      const key = `anonymous/${Date.now()}-${crypto.randomUUID()}.${ext}`;

      const { error } = await supabase.storage
        .from('photos')
        .upload(key, file, { contentType: file.type, upsert: false });
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
