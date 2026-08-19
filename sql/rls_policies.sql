-- ==========================================
-- Campus Ninja V1 - RLS Security Audit & Fix
-- Enable Row Level Security and configure safe read access.
-- ==========================================

-- 1. Enable RLS on all tables
ALTER TABLE public.branches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.semesters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.banners ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;

-- 2. Drop existing SELECT policies if any (to avoid conflicts when running this script)
DO $$
DECLARE
    t text;
    pol text;
BEGIN
    FOR t IN 
        SELECT tablename FROM pg_tables WHERE schemaname = 'public' 
        AND tablename IN ('branches', 'semesters', 'subjects', 'resources', 'banners', 'products', 'notifications', 'system_settings')
    LOOP
        FOR pol IN 
            SELECT policyname FROM pg_policies WHERE schemaname = 'public' AND tablename = t
        LOOP
            EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', pol, t);
        END LOOP;
    END LOOP;
END $$;

-- 3. Create SELECT policies allowing public read access
-- This allows the Expo mobile app to fetch data using the public anon key.
CREATE POLICY "Allow public read access to branches" ON public.branches FOR SELECT USING (true);
CREATE POLICY "Allow public read access to semesters" ON public.semesters FOR SELECT USING (true);
CREATE POLICY "Allow public read access to subjects" ON public.subjects FOR SELECT USING (true);
CREATE POLICY "Allow public read access to resources" ON public.resources FOR SELECT USING (true);
CREATE POLICY "Allow public read access to banners" ON public.banners FOR SELECT USING (true);
CREATE POLICY "Allow public read access to products" ON public.products FOR SELECT USING (true);
CREATE POLICY "Allow public read access to notifications" ON public.notifications FOR SELECT USING (true);
CREATE POLICY "Allow public read access to system_settings" ON public.system_settings FOR SELECT USING (true);

-- NOTE: 
-- We do NOT create any INSERT, UPDATE, or DELETE policies.
-- By default, when RLS is enabled and no explicit policy grants access, 
-- those operations are blocked for 'anon' and 'authenticated' roles.
-- The Next.js Admin Panel bypasses these restrictions natively because its Server Actions 
-- are configured to use the 'service_role' key, which is immune to RLS.
