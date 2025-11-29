-- Create issues table
CREATE TABLE IF NOT EXISTS public.issues (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_by UUID REFERENCES auth.users(id) NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create issue-story junction table
CREATE TABLE IF NOT EXISTS public.issue_stories (
  issue_id UUID REFERENCES public.issues(id) ON DELETE CASCADE,
  story_id UUID REFERENCES public.story_archives(id) ON DELETE CASCADE,
  position INTEGER NOT NULL,
  PRIMARY KEY (issue_id, story_id)
);

-- Enable RLS
ALTER TABLE public.issues ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.issue_stories ENABLE ROW LEVEL SECURITY;

-- Policies for issues
CREATE POLICY "Users can manage their own issues"
ON public.issues FOR ALL
USING (created_by = auth.uid())
WITH CHECK (created_by = auth.uid());

-- Policies for issue_stories
CREATE POLICY "Users can manage their own issue stories"
ON public.issue_stories FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.issues
    WHERE public.issues.id = public.issue_stories.issue_id
    AND public.issues.created_by = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.issues
    WHERE public.issues.id = public.issue_stories.issue_id
    AND public.issues.created_by = auth.uid()
  )
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_issues_created_by 
ON public.issues (created_by, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_issue_stories_issue_id 
ON public.issue_stories (issue_id, position);
