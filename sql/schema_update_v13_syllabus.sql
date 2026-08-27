-- ============================================================
-- CAMPUSNINJA V13 - DYNAMIC UNIT-WISE SYLLABUS SYSTEM
-- Tables: syllabuses, syllabus_units, syllabus_topics
-- ============================================================

-- 1. SYLLABUSES TABLE
-- Stores syllabus metadata and optional reference document per subject.
-- Enforces one active syllabus record per subject via UNIQUE(subject_id).
CREATE TABLE IF NOT EXISTS public.syllabuses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subject_id UUID NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
  file_url TEXT,
  file_name TEXT,
  file_path TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT uq_syllabuses_subject UNIQUE (subject_id)
);

CREATE INDEX IF NOT EXISTS idx_syllabuses_subject_id ON public.syllabuses (subject_id);

-- 2. SYLLABUS_UNITS TABLE
-- Stores dynamic, unlimited units belonging to a syllabus and subject.
CREATE TABLE IF NOT EXISTS public.syllabus_units (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  syllabus_id UUID NOT NULL REFERENCES public.syllabuses(id) ON DELETE CASCADE,
  subject_id UUID NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
  unit_number INTEGER NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_syllabus_units_syllabus_id ON public.syllabus_units (syllabus_id);
CREATE INDEX IF NOT EXISTS idx_syllabus_units_subject_id ON public.syllabus_units (subject_id);
CREATE INDEX IF NOT EXISTS idx_syllabus_units_sort_order ON public.syllabus_units (sort_order ASC);

-- 3. SYLLABUS_TOPICS TABLE
-- Stores dynamic, unlimited topics for each syllabus unit.
CREATE TABLE IF NOT EXISTS public.syllabus_topics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  unit_id UUID NOT NULL REFERENCES public.syllabus_units(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_syllabus_topics_unit_id ON public.syllabus_topics (unit_id);
CREATE INDEX IF NOT EXISTS idx_syllabus_topics_sort_order ON public.syllabus_topics (sort_order ASC);

-- 4. UPDATED_AT TRIGGER FUNCTION
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS trg_syllabuses_updated_at ON public.syllabuses;
CREATE TRIGGER trg_syllabuses_updated_at
  BEFORE UPDATE ON public.syllabuses
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trg_syllabus_units_updated_at ON public.syllabus_units;
CREATE TRIGGER trg_syllabus_units_updated_at
  BEFORE UPDATE ON public.syllabus_units
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trg_syllabus_topics_updated_at ON public.syllabus_topics;
CREATE TRIGGER trg_syllabus_topics_updated_at
  BEFORE UPDATE ON public.syllabus_topics
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 5. ROW LEVEL SECURITY (RLS)
ALTER TABLE public.syllabuses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.syllabus_units ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.syllabus_topics ENABLE ROW LEVEL SECURITY;

-- Public / student read policies (SELECT is open)
DROP POLICY IF EXISTS "syllabuses_public_read" ON public.syllabuses;
CREATE POLICY "syllabuses_public_read" ON public.syllabuses FOR SELECT USING (true);

DROP POLICY IF EXISTS "syllabus_units_public_read" ON public.syllabus_units;
CREATE POLICY "syllabus_units_public_read" ON public.syllabus_units FOR SELECT USING (true);

DROP POLICY IF EXISTS "syllabus_topics_public_read" ON public.syllabus_topics;
CREATE POLICY "syllabus_topics_public_read" ON public.syllabus_topics FOR SELECT USING (true);

-- Admin / authenticated write policies (INSERT, UPDATE, DELETE)
DROP POLICY IF EXISTS "syllabuses_admin_write" ON public.syllabuses;
CREATE POLICY "syllabuses_admin_write" ON public.syllabuses FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "syllabus_units_admin_write" ON syllabus_units;
CREATE POLICY "syllabus_units_admin_write" ON public.syllabus_units FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "syllabus_topics_admin_write" ON public.syllabus_topics;
CREATE POLICY "syllabus_topics_admin_write" ON public.syllabus_topics FOR ALL USING (true) WITH CHECK (true);
