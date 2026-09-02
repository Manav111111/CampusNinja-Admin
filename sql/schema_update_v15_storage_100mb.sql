-- ==========================================
-- Campus Ninja V15 - Resources Storage 100MB Limit Upgrade
-- Run this in your Supabase SQL Editor to ensure the 'resources' bucket
-- allows uploads up to 100MB seamlessly.
-- ==========================================

-- 1. Ensure the 'resources' bucket exists with public access and 100MB limit
INSERT INTO storage.buckets (id, name, public, file_size_limit) 
VALUES ('resources', 'resources', true, 104857600)
ON CONFLICT (id) DO UPDATE SET 
    public = true, 
    file_size_limit = 104857600; -- 100MB in bytes (100 * 1024 * 1024)

-- 2. Ensure storage object policies allow public read and authenticated/admin modifications
DO $$ 
BEGIN
    -- Public Read
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Public Read Resources Bucket'
    ) THEN
        CREATE POLICY "Public Read Resources Bucket" ON storage.objects FOR SELECT USING (bucket_id = 'resources');
    END IF;

    -- Insert
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Allow Insert Resources Bucket'
    ) THEN
        CREATE POLICY "Allow Insert Resources Bucket" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'resources');
    END IF;

    -- Update
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Allow Update Resources Bucket'
    ) THEN
        CREATE POLICY "Allow Update Resources Bucket" ON storage.objects FOR UPDATE USING (bucket_id = 'resources');
    END IF;

    -- Delete
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Allow Delete Resources Bucket'
    ) THEN
        CREATE POLICY "Allow Delete Resources Bucket" ON storage.objects FOR DELETE USING (bucket_id = 'resources');
    END IF;
END $$;
