-- ============================================================================
-- FIX FOR SCHEMA MISMATCH
-- ============================================================================
-- The smoke test failed with:
-- "Could not find the 'file_url' column of 'photos' in the schema cache"
--
-- This means the `photos` table is missing columns that the app expects.
-- ============================================================================

-- Add missing columns to photos table if they don't exist
ALTER TABLE public.photos
ADD COLUMN IF NOT EXISTS file_url text,
ADD COLUMN IF NOT EXISTS caption text;

-- (Optional) If you want to ensure RLS is enabled on photos (it should be)
ALTER TABLE public.photos ENABLE ROW LEVEL SECURITY;
