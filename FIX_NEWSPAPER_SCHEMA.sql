-- ============================================================================
-- FIX FOR NEWSPAPER SCHEMA
-- ============================================================================
-- The newspaper smoke test failed with:
-- "column story_archives.photo_id does not exist"
--
-- The frontend explicitly requests this column, so we must add it.
-- ============================================================================

ALTER TABLE public.story_archives
ADD COLUMN IF NOT EXISTS photo_id uuid;

-- (Optional) If it references the photos table, we can add a foreign key,
-- but for now we just want to stop the crash.
-- ALTER TABLE public.story_archives
-- ADD CONSTRAINT fk_photo
-- FOREIGN KEY (photo_id)
-- REFERENCES public.photos (id);
