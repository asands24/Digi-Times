import { getSupabase, signInSmoke } from './_supabaseClient.ts';

async function main() {
  console.log('🚀 Starting Newspaper Smoke Test...');
  const supabase = getSupabase();
  const user = await signInSmoke(supabase);
  console.log('✅ Signed in as:', user.email);

  // 1. Create 3 stories
  const storyIds: string[] = [];
  for (let i = 1; i <= 3; i++) {
    const timestamp = Date.now();
    const path = `stories/${user.id}/${timestamp}-news-${i}.png`;
    
    // Upload dummy image
    await supabase.storage.from('photos').upload(path, new Blob(['fake'], { type: 'image/png' }));

    // Insert story
    const { data, error } = await supabase
      .from('story_archives')
      .insert({
        created_by: user.id,
        title: `News Story ${i}`,
        article: `<p>Extra! Extra! Read all about it! (Story ${i})</p>`,
        prompt: `Prompt ${i}`,
        image_path: path,
        is_public: true
      })
      .select()
      .single();

    if (error) throw error;
    storyIds.push(data.id);
    console.log(`✅ Created story ${i}:`, data.id);
  }

  // 2. Simulate NewspaperPage fetch
  console.log('📰 Fetching stories for newspaper...', storyIds);
  
  const { data: stories, error: fetchError } = await supabase
    .from('story_archives')
    .select('id,title,article,prompt,image_path,photo_id,template_id,created_at,updated_at,is_public,created_by')
    .in('id', storyIds);

  if (fetchError) {
    console.error('❌ Newspaper fetch failed:', fetchError);
    throw fetchError;
  }

  // 3. Verify results
  if (stories.length !== 3) {
    throw new Error(`Expected 3 stories, got ${stories.length}`);
  }

  // Check access logic (mimic NewspaperPage)
  const available = stories.filter((story) => {
    if (story.is_public) return true;
    return story.created_by === user.id;
  });

  if (available.length !== 3) {
    throw new Error(`Expected 3 available stories, got ${available.length}`);
  }

  console.log('✅ Fetched and verified all stories');
  console.log('🎉 NEWSPAPER SMOKE TEST PASSED');
}

main().catch((error) => {
  console.error('❌ NEWSPAPER SMOKE TEST FAILED', error);
  process.exit(1);
});
