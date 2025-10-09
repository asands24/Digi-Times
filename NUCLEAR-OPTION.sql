-- NUCLEAR OPTION: Complete RLS reset if the cleanup doesn't work
-- Only use this if the cleanup script doesn't resolve the issue

-- 1. Disable RLS temporarily
ALTER TABLE group_members DISABLE ROW LEVEL SECURITY;
ALTER TABLE friend_groups DISABLE ROW LEVEL SECURITY;

-- 2. Drop ALL policies
DROP POLICY IF EXISTS "Users can view group members of their groups" ON group_members;
DROP POLICY IF EXISTS "Group admins can manage members" ON group_members;
DROP POLICY IF EXISTS "Users can view their own memberships" ON group_members;
DROP POLICY IF EXISTS "group_members_select_own" ON group_members;
DROP POLICY IF EXISTS "Users can join groups with invite" ON group_members;
DROP POLICY IF EXISTS "members_can_leave_groups" ON group_members;
DROP POLICY IF EXISTS "group_creators_manage_members" ON group_members;

DROP POLICY IF EXISTS "Users can view groups they belong to" ON friend_groups;
DROP POLICY IF EXISTS "friend_groups_select_member" ON friend_groups;
DROP POLICY IF EXISTS "Users can create groups" ON friend_groups;
DROP POLICY IF EXISTS "Group admins can update groups" ON friend_groups;
DROP POLICY IF EXISTS "group_creators_can_update" ON friend_groups;
DROP POLICY IF EXISTS "group_creators_can_delete" ON friend_groups;

-- 3. Re-enable RLS
ALTER TABLE group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE friend_groups ENABLE ROW LEVEL SECURITY;

-- 4. Add only the essential, non-recursive policies
CREATE POLICY "select_own_memberships" ON group_members
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "insert_own_membership" ON group_members
    FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "delete_own_membership" ON group_members
    FOR DELETE USING (user_id = auth.uid());

CREATE POLICY "select_member_groups" ON friend_groups
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM group_members
            WHERE group_members.group_id = friend_groups.id
            AND group_members.user_id = auth.uid()
        )
    );

CREATE POLICY "insert_own_groups" ON friend_groups
    FOR INSERT WITH CHECK (created_by = auth.uid());

CREATE POLICY "update_own_groups" ON friend_groups
    FOR UPDATE USING (created_by = auth.uid());

-- 5. Final verification
SELECT tablename, policyname, cmd FROM pg_policies
WHERE tablename IN ('group_members', 'friend_groups')
ORDER BY tablename, policyname;