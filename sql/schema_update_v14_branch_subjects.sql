-- ==============================================================================
-- MIGRATION V14: Master Subjects & Branch-Semester Subject Assignments
-- Decouples subjects from specific branches/semesters and enables multi-offering
-- ==============================================================================

-- 1. MAKE branch_id AND semester_id NULLABLE IN subjects (Legacy columns)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'subjects' AND column_name = 'branch_id' AND is_nullable = 'NO'
  ) THEN
    ALTER TABLE public.subjects ALTER COLUMN branch_id DROP NOT NULL;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'subjects' AND column_name = 'semester_id' AND is_nullable = 'NO'
  ) THEN
    ALTER TABLE public.subjects ALTER COLUMN semester_id DROP NOT NULL;
  END IF;
END $$;

-- 2. CREATE branch_subjects JUNCTION TABLE
CREATE TABLE IF NOT EXISTS public.branch_subjects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  branch_id UUID NOT NULL REFERENCES public.branches(id) ON DELETE CASCADE,
  semester_id UUID NOT NULL REFERENCES public.semesters(id) ON DELETE CASCADE,
  subject_id UUID NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT uq_branch_semester_subject UNIQUE (branch_id, semester_id, subject_id)
);

-- 3. INDEXES FOR HIGH-PERFORMANCE QUERIES
CREATE INDEX IF NOT EXISTS idx_branch_subjects_lookup 
  ON public.branch_subjects (branch_id, semester_id, is_active);

CREATE INDEX IF NOT EXISTS idx_branch_subjects_subject_id 
  ON public.branch_subjects (subject_id);

CREATE INDEX IF NOT EXISTS idx_branch_subjects_sort_order 
  ON public.branch_subjects (sort_order ASC);

-- 4. UPDATED_AT TRIGGER
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_branch_subjects_updated_at ON public.branch_subjects;
CREATE TRIGGER trg_branch_subjects_updated_at
  BEFORE UPDATE ON public.branch_subjects
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- 5. ENABLE ROW LEVEL SECURITY
ALTER TABLE public.branch_subjects ENABLE ROW LEVEL SECURITY;

-- 6. PUBLIC READ POLICY (Allow students & public app to query assignments)
DROP POLICY IF EXISTS "branch_subjects_public_read" ON public.branch_subjects;
CREATE POLICY "branch_subjects_public_read" 
  ON public.branch_subjects 
  FOR SELECT 
  USING (true);

-- 7. ADMIN WRITE POLICY
DROP POLICY IF EXISTS "branch_subjects_admin_write" ON public.branch_subjects;
CREATE POLICY "branch_subjects_admin_write" 
  ON public.branch_subjects 
  FOR ALL 
  USING (true) 
  WITH CHECK (true);

-- 8. INITIAL DATA BACKFILL FROM EXISTING SUBJECTS
-- Populates branch_subjects with all legacy subject allocations
INSERT INTO public.branch_subjects (branch_id, semester_id, subject_id, sort_order, is_active)
SELECT 
  s.branch_id,
  s.semester_id,
  s.id AS subject_id,
  COALESCE(s.sort_order, 0) AS sort_order,
  COALESCE(s.is_active, true) AS is_active
FROM public.subjects s
WHERE s.branch_id IS NOT NULL 
  AND s.semester_id IS NOT NULL
ON CONFLICT (branch_id, semester_id, subject_id) DO NOTHING;
