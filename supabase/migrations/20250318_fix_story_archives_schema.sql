-- Fix story_archives table schema to match application expectations
-- This migration aligns the database schema with the code in useStoryLibrary.ts

-- Add missing columns
ALTER TABLE story_archives
  ADD COLUMN IF NOT EXISTS title TEXT,
  ADD COLUMN IF NOT EXISTS image_path TEXT,
  ADD COLUMN IF NOT EXISTS template_id TEXT,
  ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT FALSE;

-- Change article from JSONB to TEXT (bodyHtml)
-- First, we need to handle existing JSONB data if any
DO $$
BEGIN
  -- If article column is JSONB, convert it to TEXT
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'story_archives'
    AND column_name = 'article'
    AND data_type = 'jsonb'
  ) THEN
    -- Convert JSONB to TEXT (assuming JSONB might have content we want to preserve)
    ALTER TABLE story_archives
      ALTER COLUMN article TYPE TEXT USING article::TEXT;
  END IF;
END $$;

-- Make prompt nullable instead of required
ALTER TABLE story_archives
  ALTER COLUMN prompt DROP NOT NULL;

-- Add indexes for new columns
CREATE INDEX IF NOT EXISTS idx_story_archives_template_id ON story_archives(template_id);
CREATE INDEX IF NOT EXISTS idx_story_archives_is_public ON story_archives(is_public);
CREATE INDEX IF NOT EXISTS idx_story_archives_image_path ON story_archives(image_path);
