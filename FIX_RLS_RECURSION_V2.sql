-- ============================================================================
-- FIX FOR INFINITE RECURSION IN RLS POLICIES (V2)
-- ============================================================================
-- The previous fix might not have been enough if the recursion starts from
-- group_members. This script breaks the loop at BOTH ends.
-- ============================================================================

-- 1. Helper to get my groups (Bypasses RLS on group_members)
CREATE OR REPLACE FUNCTION get_my_group_ids()
RETURNS SETOF uuid
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT group_id FROM group_members WHERE user_id = auth.uid();
$$;

-- 2. Helper to check group admin (Bypasses RLS on friend_groups)
CREATE OR REPLACE FUNCTION is_group_admin(lookup_group_id uuid, lookup_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM friend_groups
    WHERE id = lookup_group_id
    AND lookup_user_id = COALESCE(
      (row_to_json(friend_groups)->>'owner_id')::uuid,
      (row_to_json(friend_groups)->>'created_by')::uuid
    )
  );
END;
$$;

-- 3. Fix friend_groups policy (Use get_my_group_ids)
DROP POLICY IF EXISTS "Users can view groups they are members of" ON friend_groups;

CREATE POLICY "Users can view groups they are members of"
ON friend_groups
FOR SELECT
USING (
  id IN (SELECT get_my_group_ids())
);

-- 4. Fix group_members policy (Use is_group_admin)
DROP POLICY IF EXISTS "Group owners can view group members" ON group_members;

CREATE POLICY "Group owners can view group members"
ON group_members
FOR SELECT
USING (
  is_group_admin(group_id, auth.uid())
);

-- 5. Grant permissions (just in case)
GRANT EXECUTE ON FUNCTION get_my_group_ids TO authenticated, anon, service_role;
GRANT EXECUTE ON FUNCTION is_group_admin TO authenticated, anon, service_role;
