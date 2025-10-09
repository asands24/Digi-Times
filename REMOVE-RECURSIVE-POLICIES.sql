-- TARGET THE EXACT RECURSIVE POLICIES THAT ARE STILL THERE
-- Run this in Supabase SQL Editor

-- Remove the two policies that still have recursion
DROP POLICY "Users can view group members of their groups" ON group_members;
DROP POLICY "Users can view groups they belong to" ON friend_groups;

-- Verify they are gone
SELECT tablename, policyname, cmd
FROM pg_policies
WHERE tablename IN ('group_members', 'friend_groups')
AND policyname IN (
    'Users can view group members of their groups',
    'Users can view groups they belong to'
);