-- ==========================================
-- Campus Ninja V1 - Phase 7 Schema Update
-- Banner Image Upload Storage Bucket
-- ==========================================

-- 1. Create banners storage bucket for image uploads
INSERT INTO storage.buckets (id, name, public)
VALUES ('banners', 'banners', true)
ON CONFLICT (id) DO NOTHING;

-- 2. RLS: Public read access to banner images (so the mobile app can load them)
CREATE POLICY "banners_public_read"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'banners');

-- 3. RLS: Service role can upload/update/delete banner images (admin panel uses service_role key)
-- The admin panel uses the service_role key which bypasses RLS, but we add policies for safety.
CREATE POLICY "banners_service_upload"
    ON storage.objects FOR INSERT
    WITH CHECK (bucket_id = 'banners');

CREATE POLICY "banners_service_update"
    ON storage.objects FOR UPDATE
    USING (bucket_id = 'banners');

CREATE POLICY "banners_service_delete"
    ON storage.objects FOR DELETE
    USING (bucket_id = 'banners');
