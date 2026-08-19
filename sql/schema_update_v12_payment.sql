-- ==========================================
-- Campus Ninja V12 - Payment Options & Razorpay Integration
-- ==========================================

-- 1. Add payment_options to products table
-- Default to 'cod' to maintain backward compatibility
ALTER TABLE public.products
ADD COLUMN IF NOT EXISTS payment_options TEXT DEFAULT 'cod' CHECK (payment_options IN ('cod', 'online', 'both'));

-- 2. Add Razorpay order and payment IDs to orders table
-- These columns might already exist based on usage, but we add them IF NOT EXISTS to be safe
ALTER TABLE public.orders
ADD COLUMN IF NOT EXISTS razorpay_order_id TEXT,
ADD COLUMN IF NOT EXISTS razorpay_payment_id TEXT;
