-- ==========================================
-- Campus Ninja V1 - Phase 4 Schema Update
-- Google Login & Dynamic Banners
-- ==========================================

-- 1. Add screen_name to banners table
ALTER TABLE public.banners 
    ADD COLUMN IF NOT EXISTS screen_name TEXT DEFAULT 'home';

CREATE INDEX IF NOT EXISTS idx_banners_screen_name ON public.banners(screen_name);

-- 2. Add user_id to orders table to link to Auth
ALTER TABLE public.orders 
    ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_orders_user_id ON public.orders(user_id);

-- 3. If you want users to be able to see their own orders:
-- Update RLS policy for orders
DROP POLICY IF EXISTS "orders_public_insert" ON public.orders;

-- Allow authenticated users to insert orders linked to themselves
CREATE POLICY "orders_auth_insert" ON public.orders
  FOR INSERT WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

-- Allow authenticated users to view their own orders
CREATE POLICY "orders_auth_select" ON public.orders
  FOR SELECT USING (auth.uid() = user_id);
