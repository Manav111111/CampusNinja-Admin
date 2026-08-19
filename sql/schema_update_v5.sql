-- ==========================================
-- Campus Ninja V1 - Phase 6 Schema Update
-- Marketplace Order Flow Redesign
-- ==========================================

-- 1. Add new columns to orders table
ALTER TABLE public.orders
    ADD COLUMN IF NOT EXISTS college_name TEXT,
    ADD COLUMN IF NOT EXISTS address TEXT,
    ADD COLUMN IF NOT EXISTS payment_method TEXT DEFAULT 'cod',
    ADD COLUMN IF NOT EXISTS file_url TEXT,
    ADD COLUMN IF NOT EXISTS instructions TEXT;

-- 2. Create order-files storage bucket for PDF uploads
INSERT INTO storage.buckets (id, name, public)
VALUES ('order-files', 'order-files', true)
ON CONFLICT (id) DO NOTHING;

-- 3. RLS: Public read access to order files
CREATE POLICY "order_files_public_read"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'order-files');

-- 4. RLS: Authenticated users can upload order files
CREATE POLICY "order_files_auth_upload"
    ON storage.objects FOR INSERT
    WITH CHECK (bucket_id = 'order-files' AND auth.role() = 'authenticated');

-- 5. Update orders RLS to let authenticated users read their own orders
DROP POLICY IF EXISTS "orders_auth_select" ON public.orders;
CREATE POLICY "orders_auth_select" ON public.orders
    FOR SELECT USING (auth.uid() = user_id);

-- 6. Update orders RLS to let authenticated users insert their own orders
-- Drop old public insert policy if it exists, replace with auth-only
DROP POLICY IF EXISTS "orders_public_insert" ON public.orders;
DROP POLICY IF EXISTS "orders_auth_insert" ON public.orders;
CREATE POLICY "orders_auth_insert" ON public.orders
    FOR INSERT WITH CHECK (auth.uid() = user_id);
