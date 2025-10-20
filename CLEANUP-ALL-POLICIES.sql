-- COMPREHENSIVE CLEANUP: Remove ALL problematic policies
-- Run this in Supabase SQL Editor

-- Remove ALL existing policies that have recursion issues
DROP POLICY IF EXISTS "Users can view group members of their groups" ON group_members;
DROP POLICY IF EXISTS "Group admins can manage members" ON group_members;
DROP POLICY IF EXISTS "Users can view their own memberships" ON group_members;
DROP POLICY IF EXISTS "Group owners can view group members" ON group_members;
DROP POLICY IF EXISTS "Users can join groups" ON group_members;
DROP POLICY IF EXISTS "Users can leave groups or owners can remove members" ON group_members;
DROP POLICY IF EXISTS "Users can view groups they belong to" ON friend_groups;
DROP POLICY IF EXISTS "Group admins can update groups" ON friend_groups;

-- Keep only the working policies and add missing ones

-- GROUP_MEMBERS: Only keep the simple, working policies
-- (group_members_select_own and Users can view their own memberships are both OK)
-- (Users can join groups with invite is OK)

-- Add a simple policy for group members management without recursion
CREATE POLICY "members_can_leave_groups" ON group_members
    FOR DELETE USING (user_id = auth.uid());

CREATE POLICY "group_creators_manage_members" ON group_members
    FOR ALL USING (
        group_id IN (
            SELECT id FROM friend_groups
            WHERE created_by = auth.uid()
        )
    );

-- FRIEND_GROUPS: Keep the working policy and fix the broken ones
-- (friend_groups_select_member is OK)
-- (Users can create groups is OK)

CREATE POLICY "group_creators_can_update" ON friend_groups
    FOR UPDATE USING (created_by = auth.uid());

CREATE POLICY "group_creators_can_delete" ON friend_groups
    FOR DELETE USING (created_by = auth.uid());

-- Verify no more recursion issues
SELECT
    tablename,
    policyname,
    cmd,
    CASE
        WHEN qual LIKE '%group_members%group_members%' THEN 'RECURSION DETECTED!'
        ELSE 'OK'
    END AS status
FROM pg_policies
WHERE tablename IN ('group_members', 'friend_groups')
ORDER BY tablename, policyname;
