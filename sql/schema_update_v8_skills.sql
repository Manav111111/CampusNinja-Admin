-- ============================================================
-- Campus Ninja V1 - Skills & Skill Resources Migration
-- Run this in your Supabase SQL Editor if skills/skill_resources tables don't exist yet
-- ============================================================

-- 1. SKILLS TABLE
CREATE TABLE IF NOT EXISTS public.skills (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  icon_name TEXT DEFAULT 'code-slash-outline',
  theme_color TEXT DEFAULT '#3B82F6',
  accent_color TEXT DEFAULT '#DBEAFE',
  difficulty_level TEXT DEFAULT 'beginner' CHECK (difficulty_level IN ('beginner', 'intermediate', 'advanced')),
  total_resources INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_skills_active
  ON public.skills (is_active, sort_order) WHERE is_active = true;

ALTER TABLE public.skills ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "skills_public_read" ON public.skills FOR SELECT USING (true);
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;


-- 2. SKILL_RESOURCES TABLE
CREATE TABLE IF NOT EXISTS public.skill_resources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  skill_id UUID NOT NULL REFERENCES public.skills(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  type TEXT NOT NULL CHECK (type IN ('roadmap', 'notes', 'playlist', 'resource', 'project', 'article')),
  storage_type TEXT NOT NULL CHECK (storage_type IN ('supabase_file', 'google_drive', 'youtube', 'external_link')),
  file_url TEXT,
  drive_url TEXT,
  youtube_url TEXT,
  external_url TEXT,
  thumbnail_url TEXT,
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_skill_resources_skill_id
  ON public.skill_resources (skill_id);

CREATE INDEX IF NOT EXISTS idx_skill_resources_skill_type
  ON public.skill_resources (skill_id, type);

ALTER TABLE public.skill_resources ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "skill_resources_public_read" ON public.skill_resources FOR SELECT USING (true);
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;
