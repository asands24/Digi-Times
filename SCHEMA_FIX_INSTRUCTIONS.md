# URGENT: Fix Story Archives Schema

## Problem
Your `story_archives` table is missing columns that the app expects, causing queries to timeout.

## Solution
Run this SQL in your Supabase SQL Editor immediately:

```sql
-- Fix story_archives table schema to match application expectations
-- This migration aligns the database schema with the code in useStoryLibrary.ts

-- Add missing columns
ALTER TABLE story_archives
  ADD COLUMN IF NOT EXISTS title TEXT,
  ADD COLUMN IF NOT EXISTS image_path TEXT,
  ADD COLUMN IF NOT EXISTS template_id TEXT,
  ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT FALSE;

-- Change article from JSONB to TEXT (if it's currently JSONB)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'story_archives'
    AND column_name = 'article'
    AND data_type = 'jsonb'
  ) THEN
    ALTER TABLE story_archives
      ALTER COLUMN article TYPE TEXT USING article::TEXT;
  END IF;
END $$;

-- Make prompt nullable instead of required
ALTER TABLE story_archives
  ALTER COLUMN prompt DROP NOT NULL;

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_story_archives_template_id ON story_archives(template_id);
CREATE INDEX IF NOT EXISTS idx_story_archives_is_public ON story_archives(is_public);
CREATE INDEX IF NOT EXISTS idx_story_archives_image_path ON story_archives(image_path);
```

## How to Run

1. Go to your Supabase Dashboard: https://supabase.com/dashboard
2. Select your project
3. Go to **SQL Editor** in the left sidebar
4. Click **New Query**
5. Paste the SQL above
6. Click **Run** or press Ctrl+Enter

## Verification

After running, verify the schema:

```sql
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'story_archives'
ORDER BY ordinal_position;
```

You should see all these columns:
- id (uuid)
- user_id (uuid)
- title (text, YES)
- article (text, YES)
- prompt (text, YES)
- image_path (text, YES)
- template_id (text, YES)
- photo_id (uuid, YES)
- is_public (boolean, YES)
- created_at (timestamp with time zone)
- updated_at (timestamp with time zone)
