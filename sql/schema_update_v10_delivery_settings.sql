-- ==========================================
-- Campus Ninja V10 - Delivery Settings Schema
-- ==========================================

-- 1. Create key-value settings table for dynamic delivery fees and thresholds
CREATE TABLE IF NOT EXISTS public.settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Enable RLS
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;

-- 3. Allow public read access to settings so the mobile app can calculate checkout fees
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'settings' AND policyname = 'Allow public read access to settings'
    ) THEN
        CREATE POLICY "Allow public read access to settings" ON public.settings FOR SELECT USING (true);
    END IF;
END $$;

-- 4. Insert default delivery settings if they do not exist
INSERT INTO public.settings (key, value)
VALUES 
    ('delivery_fee', '49'),
    ('free_delivery_threshold', '499')
ON CONFLICT (key) DO NOTHING;
