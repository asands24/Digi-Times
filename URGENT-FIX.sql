-- COPY AND PASTE THIS DIRECTLY INTO SUPABASE SQL EDITOR AND RUN IT NOW
-- This will immediately fix the infinite recursion error

-- Step 1: Remove the broken policy
DROP POLICY IF EXISTS "Users can view group members of their groups" ON group_members;

-- Step 2: Add the correct policy without recursion
CREATE POLICY "Users can view their own memberships" ON group_members
    FOR SELECT USING (user_id = auth.uid());

-- Step 3: Also fix the groups policy if it has issues
DROP POLICY IF EXISTS "Users can view groups they belong to" ON friend_groups;

CREATE POLICY "Users can view groups they belong to" ON friend_groups
    FOR SELECT USING (
        id IN (
            SELECT gm.group_id
            FROM group_members gm
            WHERE gm.user_id = auth.uid()
        )
    );

-- Step 4: Verify the policies were created
SELECT tablename, policyname, cmd
FROM pg_policies
WHERE tablename IN ('group_members', 'friend_groups')
ORDER BY tablename, policyname;