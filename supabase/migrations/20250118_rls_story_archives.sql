-- Enable Row Level Security on story_archives table
-- This migration adds RLS policies to allow:
-- 1. Anonymous users to read public stories
-- 2. Authenticated users to read their own stories (public or private)

-- Enable RLS on the table
ALTER TABLE public.story_archives ENABLE ROW LEVEL SECURITY;

-- Policy: Public stories are readable by anyone (including anonymous users)
CREATE POLICY "Public stories readable by anyone"
ON public.story_archives
FOR SELECT
USING (is_public = true);

-- Policy: Users can read their own stories (regardless of is_public status)
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
