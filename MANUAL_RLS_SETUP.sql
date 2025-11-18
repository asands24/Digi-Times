-- ============================================================================
-- MANUAL RLS SETUP FOR DIGITIMES
-- ============================================================================
-- If you don't have a migration system, run this SQL directly in the
-- Supabase SQL Editor to set up Row Level Security for story_archives.
--
-- Instructions:
-- 1. Go to your Supabase Dashboard
-- 2. Click on "SQL Editor" in the left sidebar
-- 3. Click "New query"
-- 4. Copy and paste this entire file
-- 5. Click "Run" (or press Cmd/Ctrl + Enter)
-- ============================================================================

-- Enable Row Level Security on story_archives table
ALTER TABLE public.story_archives ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (to make this script idempotent)
DROP POLICY IF EXISTS "Public stories readable by anyone" ON public.story_archives;
DROP POLICY IF EXISTS "Users can read their own stories" ON public.story_archives;
DROP POLICY IF EXISTS "Users can create their own stories" ON public.story_archives;
DROP POLICY IF EXISTS "Users can update their own stories" ON public.story_archives;
DROP POLICY IF EXISTS "Users can delete their own stories" ON public.story_archives;

-- Policy: Public stories are readable by anyone (including anonymous users)
-- This allows the /read/:id page to work for public stories without login
CREATE POLICY "Public stories readable by anyone"
ON public.story_archives
FOR SELECT
USING (is_public = true);

-- Policy: Users can read their own stories (regardless of is_public status)
-- This allows users to view their own private stories
CREATE POLICY "Users can read their own stories"
ON public.story_archives
FOR SELECT
USING (auth.uid() = user_id);

-- Policy: Users can insert their own stories
CREATE POLICY "Users can create their own stories"
ON public.story_archives
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own stories
CREATE POLICY "Users can update their own stories"
ON public.story_archives
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Policy: Users can delete their own stories
CREATE POLICY "Users can delete their own stories"
ON public.story_archives
FOR DELETE
USING (auth.uid() = user_id);

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================
-- After running the above, you can verify the policies were created:

-- List all policies on story_archives table
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
WHERE tablename = 'story_archives';

-- ============================================================================
-- TESTING
-- ============================================================================
-- To test:
-- 1. Create a story and set is_public = true
-- 2. Log out (or open incognito window)
-- 3. Visit /read/:story_id - should work
-- 4. Try accessing a private story while logged out - should fail with permission error
-- ============================================================================
