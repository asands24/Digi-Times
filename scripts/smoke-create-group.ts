import { getSupabase, signInSmoke } from './_supabaseClient.ts';

async function main() {
  const supabase = getSupabase();
  const user = await signInSmoke(supabase);

  const { data: group, error: groupError } = await supabase
    .from('friend_groups')
    .insert({
      name: `Smoke Group ${Date.now()}`,
      description: 'E2E smoke test',
      created_by: user.id,
    })
    .select()
    .single();
  if (groupError) throw groupError;

  const { data: members, error: memberError } = await supabase
    .from('group_members')
    .select('*')
    .eq('group_id', group.id)
    .eq('user_id', user.id)
    .limit(1);
  if (memberError) throw memberError;

  console.log('✅ smoke-create-group OK', { groupId: group.id, membership: members?.length ?? 0 });
}

main().catch((error) => {
  console.error('❌ smoke-create-group FAILED', error);
  process.exit(1);
});
