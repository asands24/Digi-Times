-- FINAL FIX: Handle existing policies properly
-- Copy and paste this into Supabase SQL Editor

-- Step 1: Drop ALL existing problematic policies
DROP POLICY IF EXISTS "Users can view group members of their groups" ON group_members;
DROP POLICY IF EXISTS "Users can view their own memberships" ON group_members;
DROP POLICY IF EXISTS "Users can view groups they belong to" ON friend_groups;

-- Step 2: Create the correct group_members policy (no recursion)
CREATE POLICY "group_members_select_own" ON group_members
    FOR SELECT USING (user_id = auth.uid());

-- Step 3: Create the correct friend_groups policy (using alias to avoid confusion)
CREATE POLICY "friend_groups_select_member" ON friend_groups
    FOR SELECT USING (
        EXISTS (
            SELECT 1
            FROM group_members gm
            WHERE gm.group_id = friend_groups.id
            AND gm.user_id = auth.uid()
        )
    );

-- Step 4: Verify the fix worked
SELECT
    schemaname,
    tablename,
    policyname,
    cmd,
    CASE
        WHEN qual LIKE '%group_members%group_members%' THEN 'POTENTIAL RECURSION!'
        ELSE 'OK'
    END AS recursion_check
FROM pg_policies
WHERE tablename IN ('group_members', 'friend_groups')
ORDER BY tablename, policyname;