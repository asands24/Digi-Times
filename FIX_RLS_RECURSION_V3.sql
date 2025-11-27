-- ============================================================================
-- FIX FOR INFINITE RECURSION IN RLS POLICIES (V3)
-- ============================================================================
-- Diagnosis:
-- 1. There is a LEGACY policy "Users can view groups they're members of" 
--    (note the apostrophe) that is still active and recursive.
-- 2. The policy "Users can view memberships in their groups" on group_members
--    is self-recursive (it queries group_members).
--
-- This script cleans up the legacy policy and fixes the self-recursion.
-- ============================================================================

-- 1. Drop the LEGACY recursive policy on friend_groups
-- This was likely missed because of the slight name difference.
DROP POLICY IF EXISTS "Users can view groups they're members of" ON friend_groups;

-- 2. Fix self-recursion on group_members
-- The policy "Users can view memberships in their groups" queries group_members directly.
-- We replace it to use the safe get_my_group_ids() function.
DROP POLICY IF EXISTS "Users can view memberships in their groups" ON group_members;

CREATE POLICY "Users can view memberships in their groups"
ON group_members
FOR SELECT
USING (
  group_id IN (SELECT get_my_group_ids())
);

-- 3. Ensure the V2 fix is still applied (idempotent)
DROP POLICY IF EXISTS "Users can view groups they are members of" ON friend_groups;
CREATE POLICY "Users can view groups they are members of"
ON friend_groups
FOR SELECT
USING (
  id IN (SELECT get_my_group_ids())
);
