import { supabase } from './supabaseClient';

export type CreateGroupInput = { name: string; description?: string };

export async function createGroupViaSupabase({ name, description }: CreateGroupInput) {
  const { data: sessionData, error: sessionErr } = await supabase.auth.getSession();
  if (sessionErr) throw sessionErr;
  const userId = sessionData?.session?.user?.id;
  if (!userId) throw new Error('Not authenticated');

  const { data: groups, error: gErr } = await supabase
    .from('friend_groups')
    .insert({ name, description: description ?? '', created_by: userId })
    .select()
    .limit(1);
  if (gErr) throw gErr;
  const group = groups?.[0];
  if (!group) throw new Error('Create group failed (no row)');

  const { error: mErr } = await supabase
    .from('group_members')
    .insert({ group_id: group.id, user_id: userId, role: 'admin' });
  if (mErr) throw mErr;

  return group;
}

