-- ==========================================
-- Campus Ninja V1 - Phase 8 Schema Update
-- Product Image Upload & Upload Categorization
-- ==========================================

-- 1. Create products storage bucket for product thumbnail uploads
INSERT INTO storage.buckets (id, name, public)
VALUES ('products', 'products', true)
ON CONFLICT (id) DO NOTHING;

-- 2. RLS for products storage
CREATE POLICY "products_public_read"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'products');

CREATE POLICY "products_service_upload"
    ON storage.objects FOR INSERT
    WITH CHECK (bucket_id = 'products');

CREATE POLICY "products_service_update"
    ON storage.objects FOR UPDATE
    USING (bucket_id = 'products');

CREATE POLICY "products_service_delete"
    ON storage.objects FOR DELETE
    USING (bucket_id = 'products');

-- 3. Add columns to products table for upload categorization
ALTER TABLE public.products
    ADD COLUMN IF NOT EXISTS requires_file_upload BOOLEAN DEFAULT false,
    ADD COLUMN IF NOT EXISTS upload_instructions TEXT;
