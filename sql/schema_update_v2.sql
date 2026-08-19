-- ==========================================
-- Campus Ninja V1 - Phase 3 Schema Update
-- Notifications, Products, Orders, Settings
-- ==========================================

-- 1. Create Notifications Table
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    target_branch_id UUID REFERENCES public.branches(id) ON DELETE SET NULL,
    target_semester_id UUID REFERENCES public.semesters(id) ON DELETE SET NULL,
    status TEXT DEFAULT 'sent',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Create Marketplace Products Table
CREATE TABLE IF NOT EXISTS public.products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    price NUMERIC NOT NULL DEFAULT 0,
    category TEXT NOT NULL,
    thumbnail_url TEXT,
    drive_link TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Modify Orders Table
-- We assume `orders` already exists and had a `service_id`. 
-- We will add the new `product_id` and `payment_status` columns.
ALTER TABLE public.orders 
    ADD COLUMN IF NOT EXISTS product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'pending';

-- Drop the old service_id if it exists (ignoring errors if it's already gone)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='orders' AND column_name='service_id') THEN
        ALTER TABLE public.orders DROP COLUMN service_id;
    END IF;
END $$;

-- 4. Create System Settings Table
CREATE TABLE IF NOT EXISTS public.system_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    whatsapp_link TEXT,
    instagram_link TEXT,
    youtube_link TEXT,
    telegram_link TEXT,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Ensure only one row exists for system_settings (by inserting a default row if empty)
INSERT INTO public.system_settings (id, whatsapp_link, instagram_link, youtube_link, telegram_link)
SELECT '00000000-0000-0000-0000-000000000000', '', '', '', ''
WHERE NOT EXISTS (SELECT 1 FROM public.system_settings);

-- 5. Create Indexes
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON public.notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_products_is_active ON public.products(is_active);
CREATE INDEX IF NOT EXISTS idx_orders_product_id ON public.orders(product_id);
