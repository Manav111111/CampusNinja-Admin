-- ==========================================
-- Campus Ninja V1 - Academic Hierarchy Update
-- ==========================================

-- 1. Create Branches Table
CREATE TABLE public.branches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    short_code TEXT NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Create Semesters Table
CREATE TABLE public.semesters (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    branch_id UUID NOT NULL REFERENCES public.branches(id) ON DELETE CASCADE,
    number INTEGER NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Create Banners Table
CREATE TABLE public.banners (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    subtitle TEXT,
    image_url TEXT NOT NULL,
    button_text TEXT,
    button_url TEXT,
    priority INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. Update Subjects Table
-- Note: Assuming you are comfortable dropping the existing string columns.
-- If you have existing data, you may want to migrate it before dropping.
ALTER TABLE public.subjects
    DROP COLUMN IF EXISTS course,
    DROP COLUMN IF EXISTS branch,
    DROP COLUMN IF EXISTS semester,
    ADD COLUMN branch_id UUID REFERENCES public.branches(id) ON DELETE CASCADE,
    ADD COLUMN semester_id UUID REFERENCES public.semesters(id) ON DELETE CASCADE;

-- 5. Create Indexes for performance
CREATE INDEX idx_semesters_branch_id ON public.semesters(branch_id);
CREATE INDEX idx_subjects_branch_id ON public.subjects(branch_id);
CREATE INDEX idx_subjects_semester_id ON public.subjects(semester_id);
CREATE INDEX idx_banners_priority ON public.banners(priority DESC) WHERE is_active = true;

-- 6. Add updated_at trigger function if it doesn't exist (Optional, standard practice)
-- CREATE OR REPLACE FUNCTION update_updated_at_column()
-- RETURNS TRIGGER AS $$
-- BEGIN
--     NEW.updated_at = timezone('utc'::text, now());
--     RETURN NEW;
-- END;
-- $$ language 'plpgsql';

-- Create triggers for updated_at
-- CREATE TRIGGER update_branches_updated_at BEFORE UPDATE ON public.branches FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
-- CREATE TRIGGER update_semesters_updated_at BEFORE UPDATE ON public.semesters FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
-- CREATE TRIGGER update_banners_updated_at BEFORE UPDATE ON public.banners FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
