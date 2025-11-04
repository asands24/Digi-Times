import { getSupabase, signInSmoke } from './_supabaseClient.ts';

async function main() {
  const supabase = getSupabase();
  const user = await signInSmoke(supabase);

  const bytes = new Uint8Array([1, 2, 3, 4]);
  const file = new Blob([bytes], { type: 'image/png' });
  const path = `smoke/${user.id}/${Date.now()}.png`;

  const upload = await supabase.storage.from('photos').upload(path, file, {
    contentType: 'image/png',
    upsert: true,
  });
  if (upload.error) throw upload.error;

  const { data: publicUrl } = supabase.storage.from('photos').getPublicUrl(path);
  const fileUrl = publicUrl?.publicUrl ?? `photos/${path}`;

  const { data: record, error: insertError } = await supabase
    .from('photos')
    .insert({
      file_name: path.split('/').pop() ?? 'smoke.png',
      file_url: fileUrl,
      uploaded_by: user.id,
      caption: 'Smoke upload',
    })
    .select()
    .single();
  if (insertError) throw insertError;

  const { data: recent, error: listError } = await supabase
    .from('photos')
    .select('*')
    .eq('uploaded_by', user.id)
    .order('created_at', { ascending: false })
    .limit(5);
  if (listError) throw listError;

  console.log('✅ smoke-archive OK', {
    uploaded: path,
    created: record?.id,
    recent: recent?.length ?? 0,
  });
}

main().catch((error) => {
  console.error('❌ smoke-archive FAILED', error);
  process.exit(1);
});
