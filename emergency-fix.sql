-- EMERGENCY FIX: Remove the problematic policy causing infinite recursion
-- Run this FIRST in your Supabase SQL Editor

-- 1. Drop the problematic policy
DROP POLICY IF EXISTS "Users can view group members of their groups" ON group_members;

-- 2. Temporarily disable RLS on group_members to test
ALTER TABLE group_members DISABLE ROW LEVEL SECURITY;

-- 3. Check what policies exist (run this to see current state)
-- SELECT schemaname, tablename, policyname, cmd, roles, qual, with_check
-- FROM pg_policies
-- WHERE tablename IN ('group_members', 'friend_groups', 'groups');

-- 4. Once you confirm it works, re-enable RLS with the correct policy:
-- ALTER TABLE group_members ENABLE ROW LEVEL SECURITY;

-- 5. Add the corrected policy (no recursion)
-- CREATE POLICY "Users can view their own group memberships" ON group_members
--   FOR SELECT USING (user_id = auth.uid());