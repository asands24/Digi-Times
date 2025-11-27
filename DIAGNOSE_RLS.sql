-- ============================================================================
-- DIAGNOSE RLS POLICIES
-- ============================================================================
-- Run this to see exactly what policies are active on your tables.
-- This helps us verify if the old recursive policies are still present.
-- ============================================================================

SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename IN ('friend_groups', 'group_members', 'objects')
ORDER BY tablename, policyname;
