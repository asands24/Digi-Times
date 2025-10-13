-- =============================================
-- Storage Bucket and Policies for Photos
-- =============================================

-- Create storage bucket for photos
INSERT INTO storage.buckets (id, name, public)
VALUES ('photos', 'photos', true)
ON CONFLICT (id) DO NOTHING;

-- =============================================
-- STORAGE POLICIES
-- =============================================

-- Allow authenticated users to upload photos
DROP POLICY IF EXISTS "Authenticated users can upload photos" ON storage.objects;
CREATE POLICY "Authenticated users can upload photos"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'photos'
    AND auth.role() = 'authenticated'
  );

-- Allow users to view photos in groups they belong to
DROP POLICY IF EXISTS "Users can view photos in their groups" ON storage.objects;
CREATE POLICY "Users can view photos in their groups"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'photos'
    AND (
      -- Public bucket, or user is authenticated
      auth.role() = 'authenticated'
    )
  );

-- Allow users to update their own uploaded photos
DROP POLICY IF EXISTS "Users can update their own photos" ON storage.objects;
CREATE POLICY "Users can update their own photos"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'photos'
    AND auth.uid()::text = owner
  );

-- Allow users to delete their own uploaded photos
DROP POLICY IF EXISTS "Users can delete their own photos" ON storage.objects;
CREATE POLICY "Users can delete their own photos"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'photos'
    AND auth.uid()::text = owner
  );
