-- ============================================================================
-- FIX FOR INFINITE RECURSION IN RLS POLICIES
-- ============================================================================
-- The error "infinite recursion detected in policy for relation group_members"
-- happens because:
-- 1. querying `group_members` triggers a check on `friend_groups`
-- 2. querying `friend_groups` triggers a check on `group_members`
-- 3. Loop!
--
-- The fix is to use a SECURITY DEFINER function to break the chain.
-- ============================================================================

-- 1. Create a helper function to get a user's groups without triggering RLS
-- SECURITY DEFINER means this runs with the permissions of the creator (admin),
-- bypassing the RLS on group_members that causes the loop.
CREATE OR REPLACE FUNCTION get_my_group_ids()
RETURNS SETOF uuid
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT group_id FROM group_members WHERE user_id = auth.uid();
$$;

-- 2. Replace the problematic policy on friend_groups
DROP POLICY IF EXISTS "Users can view groups they are members of" ON friend_groups;

CREATE POLICY "Users can view groups they are members of"
ON friend_groups
FOR SELECT
USING (
  id IN (SELECT get_my_group_ids())
);

-- 3. (Optional) If you have a similar policy on group_members that checks friend_groups,
-- it should now be safe because querying friend_groups will use the safe policy above.
