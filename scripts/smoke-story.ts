import { getSupabase, signInSmoke } from './_supabaseClient.ts';

async function main() {
  console.log('🚀 Starting Story Smoke Test...');
  const supabase = getSupabase();
  const user = await signInSmoke(supabase);
  console.log('✅ Signed in as:', user.email);

  // 1. Upload Image (Simulate persistStory upload)
  const timestamp = Date.now();
  const path = `stories/${user.id}/${timestamp}-smoke.png`;
  const bytes = new Uint8Array([1, 2, 3, 4]);
  const file = new Blob([bytes], { type: 'image/png' });

  console.log('📤 Uploading image to:', path);
  const { error: uploadError } = await supabase.storage
    .from('photos')
    .upload(path, file, { upsert: true });

  if (uploadError) {
    console.error('❌ Upload failed:', uploadError);
    throw uploadError;
  }
  console.log('✅ Image uploaded');

  // 2. Insert Story (Simulate persistStory insert)
  const payload = {
    created_by: user.id,
    title: `Smoke Test Story ${timestamp}`,
    article: '<p>This is a smoke test article.</p>',
    prompt: 'A smoke test prompt',
    image_path: path,
    is_public: false
  };

  console.log('💾 Inserting story record...');
  const { data: story, error: insertError } = await supabase
    .from('story_archives')
    .insert(payload)
    .select()
    .single();

  if (insertError) {
    console.error('❌ Story insert failed:', insertError);
    throw insertError;
  }
  console.log('✅ Story inserted:', story.id);

  // 3. Verify Read
  console.log('📖 Verifying read...');
  const { data: readStory, error: readError } = await supabase
    .from('story_archives')
    .select('*')
    .eq('id', story.id)
    .single();

  if (readError) {
    console.error('❌ Story read failed:', readError);
    throw readError;
  }
  
  if (!readStory) {
    throw new Error('Story not found after insert');
  }

  console.log('✅ Story verified!');
  console.log('🎉 SMOKE TEST PASSED');
}

main().catch((error) => {
  console.error('❌ SMOKE TEST FAILED', error);
  process.exit(1);
});
