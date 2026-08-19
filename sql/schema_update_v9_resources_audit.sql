-- ==========================================
-- Campus Ninja V9 - Resources Module Audit & Storage Fixes
-- ==========================================

-- 1. Ensure resources table exists with all required columns
CREATE TABLE IF NOT EXISTS public.resources (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    subject_id UUID NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    type TEXT NOT NULL,
    storage_type TEXT NOT NULL,
    file_url TEXT,
    drive_url TEXT,
    youtube_url TEXT,
    external_url TEXT,
    thumbnail_url TEXT,
    file_size TEXT,
    file_format TEXT,
    is_popular BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Create index on subject_id and active status for fast mobile app queries
CREATE INDEX IF NOT EXISTS idx_resources_subject_active 
    ON public.resources (subject_id, is_active, sort_order);

-- 3. Enable RLS on resources table
ALTER TABLE public.resources ENABLE ROW LEVEL SECURITY;

-- 4. Allow public read access to resources
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'resources' AND policyname = 'Allow public read access to resources'
    ) THEN
        CREATE POLICY "Allow public read access to resources" ON public.resources FOR SELECT USING (true);
    END IF;
END $$;

-- 5. Ensure storage bucket 'resources' exists and is set to PUBLIC
INSERT INTO storage.buckets (id, name, public) 
VALUES ('resources', 'resources', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- 6. Storage object policies for 'resources' bucket
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Public Read Resources Bucket'
    ) THEN
        CREATE POLICY "Public Read Resources Bucket" ON storage.objects FOR SELECT USING (bucket_id = 'resources');
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Allow Insert Resources Bucket'
    ) THEN
        CREATE POLICY "Allow Insert Resources Bucket" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'resources');
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Allow Update Resources Bucket'
    ) THEN
        CREATE POLICY "Allow Update Resources Bucket" ON storage.objects FOR UPDATE USING (bucket_id = 'resources');
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Allow Delete Resources Bucket'
    ) THEN
        CREATE POLICY "Allow Delete Resources Bucket" ON storage.objects FOR DELETE USING (bucket_id = 'resources');
    END IF;
END $$;
