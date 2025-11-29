-- Enable Row Level Security
ALTER TABLE public.story_archives ENABLE ROW LEVEL SECURITY;

-- Add public sharing columns
ALTER TABLE public.story_archives 
ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS public_slug TEXT UNIQUE;

-- Create index for public slug lookups
CREATE INDEX IF NOT EXISTS idx_story_archives_public_slug 
ON public.story_archives (public_slug) 
WHERE public_slug IS NOT NULL;

-- Policy: Users can manage their own stories
CREATE POLICY "Users can manage their own stories"
ON public.story_archives
FOR ALL
USING (created_by = auth.uid())
WITH CHECK (created_by = auth.uid());

-- Policy: Public can read shared stories
CREATE POLICY "Public can read public stories"
ON public.story_archives
FOR SELECT
USING (is_public = true);

-- Function to generate random slug (optional, can be done in frontend)
CREATE OR REPLACE FUNCTION generate_slug() RETURNS TEXT AS $$
BEGIN
  RETURN substr(md5(random()::text), 1, 8);
END;
$$ LANGUAGE plpgsql;
