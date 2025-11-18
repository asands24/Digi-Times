import { getSupabase } from './supabaseClient';

const DEBUG_GROUPS = process.env.NODE_ENV !== 'production';

export type CreateGroupInput = { name: string; description?: string };

export async function createGroupViaSupabase({ name, description }: CreateGroupInput) {
  const supabase = getSupabase();
  if (DEBUG_GROUPS) {
    console.log('[Groups] Attempting to create group', {
      name,
      hasDescription: Boolean(description),
    });
  }

  const { data: sessionData, error: sessionErr } = await supabase.auth.getSession();
  if (sessionErr) throw sessionErr;
  const userId = sessionData?.session?.user?.id;
  if (!userId) throw new Error('Not authenticated');

  const { data: group, error: gErr } = await supabase
    .from('friend_groups')
    .insert({ name, description: description ?? '', created_by: userId })
    .select()
    .single();
  if (gErr) throw gErr;

  const { error: mErr } = await supabase
    .from('group_members')
    .insert({ group_id: group.id, user_id: userId, role: 'admin' });
  if (mErr) throw mErr;

  if (DEBUG_GROUPS) {
    console.log('[Groups] Created group and admin membership', { groupId: group.id });
  }

  return group;
}
