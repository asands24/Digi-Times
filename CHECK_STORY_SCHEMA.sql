-- ============================================================================
-- CHECK STORY ARCHIVES SCHEMA AND POLICIES
-- ============================================================================

-- 1. Get columns for story_archives
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'story_archives';

-- 2. Get active policies for story_archives
SELECT
  policyname,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'story_archives';
