-- ====================================================================
-- SCHEMA UPDATE V11: SOCIAL LINKS MANAGEMENT
-- Run this script in Supabase SQL Editor to enable dynamic social links
-- ====================================================================

CREATE TABLE IF NOT EXISTS public.social_links (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    platform TEXT NOT NULL CHECK (platform IN ('whatsapp', 'youtube', 'instagram')),
    url TEXT NOT NULL,
    description TEXT,
    subscriber_count TEXT,
    icon_url TEXT,
    sort_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.social_links ENABLE ROW LEVEL SECURITY;

-- Allow public read access
CREATE POLICY "Allow public read on social_links" 
    ON public.social_links FOR SELECT 
    USING (true);

-- Allow authenticated/service role full write access
CREATE POLICY "Allow write on social_links" 
    ON public.social_links FOR ALL 
    USING (true)
    WITH CHECK (true);

-- Seed initial default data
INSERT INTO public.social_links (name, platform, url, description, subscriber_count, sort_order, is_active)
VALUES
('Campus Ninja Official', 'youtube', 'https://youtube.com', 'Official College Updates & Podcasts', '15.2K Subs', 1, true),
('Campus Ninja Coding', 'youtube', 'https://youtube.com', 'Data Structures, Algorithms & Web Dev Tutorials', '28.4K Subs', 2, true),
('Campus Ninja Placements', 'youtube', 'https://youtube.com', 'Interview Prep, Resume Tips & Company Roadmaps', '9.1K Subs', 3, true),
('Campus Ninja Shorts', 'youtube', 'https://youtube.com', 'Quick 60-second Tech Hacks & Campus News', '45.0K Subs', 4, true),

('B.Tech 1st Year Community', 'whatsapp', 'https://chat.whatsapp.com', 'Official group for all 1st Year engineering students', '850+ Members', 1, true),
('B.Tech 2nd Year Community', 'whatsapp', 'https://chat.whatsapp.com', 'Core subjects, lab notes & project groups', '720+ Members', 2, true),
('Placements & Internship Cell', 'whatsapp', 'https://chat.whatsapp.com', 'Daily off-campus job alerts and internship openings', '1020+ Members', 3, true),
('Competitive Coding Hub', 'whatsapp', 'https://chat.whatsapp.com', 'Leetcoding, hackathons & doubt discussions', '540+ Members', 4, true),

('Campus Ninja Main', 'instagram', 'https://instagram.com', 'Life at college, memes & event highlights', '18.5K Followers', 1, true),
('Campus Ninja Coding', 'instagram', 'https://instagram.com', 'Daily code snippets, cheat sheets & roadmaps', '32.1K Followers', 2, true),
('Campus Ninja Marketplace', 'instagram', 'https://instagram.com', 'Featured student deals, EG sheets & lab kits', '8.9K Followers', 3, true),
('Campus Ninja AI Labs', 'instagram', 'https://instagram.com', 'Exploring ChatGPT, AI agents & emerging tech', '12.0K Followers', 4, true);
