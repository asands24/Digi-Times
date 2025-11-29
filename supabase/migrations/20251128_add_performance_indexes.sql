-- Add indexes for common query patterns

-- Index for fetching a user's stories (sorted by date)
CREATE INDEX IF NOT EXISTS idx_story_archives_created_by_date 
ON public.story_archives (created_by, created_at DESC);

-- Index for fetching public stories
CREATE INDEX IF NOT EXISTS idx_story_archives_is_public 
ON public.story_archives (is_public) 
WHERE is_public = true;

-- Index for template lookups
CREATE INDEX IF NOT EXISTS idx_story_archives_template_id 
ON public.story_archives (template_id);

-- Analyze tables to update statistics
ANALYZE public.story_archives;
