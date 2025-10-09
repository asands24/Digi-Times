-- RE-ENABLE RLS AND CREATE MINIMAL WORKING POLICIES
-- Run this in Supabase SQL Editor

-- Re-enable RLS
ALTER TABLE friend_groups ENABLE ROW LEVEL SECURITY;

-- Drop ALL existing policies on friend_groups to start fresh
DROP POLICY IF EXISTS "Users can create groups" ON friend_groups;
DROP POLICY IF EXISTS "friend_groups_select_member" ON friend_groups;
DROP POLICY IF EXISTS "group_creators_can_delete" ON friend_groups;
DROP POLICY IF EXISTS "group_creators_can_update" ON friend_groups;

-- Create one simple policy for SELECT that should work
CREATE POLICY "allow_group_members_to_view" ON friend_groups
    FOR SELECT USING (
        created_by = auth.uid()
        OR
        id IN (
            SELECT gm.group_id
            FROM group_members gm
            WHERE gm.user_id = auth.uid()
        )
    );

-- Create minimal policies for other operations
CREATE POLICY "allow_authenticated_to_create" ON friend_groups
    FOR INSERT WITH CHECK (auth.uid() = created_by);

CREATE POLICY "allow_creators_to_update" ON friend_groups
    FOR UPDATE USING (created_by = auth.uid());

CREATE POLICY "allow_creators_to_delete" ON friend_groups
    FOR DELETE USING (created_by = auth.uid());

-- Verify the policies
SELECT policyname, cmd FROM pg_policies WHERE tablename = 'friend_groups';