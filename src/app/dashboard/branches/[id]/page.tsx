import { createAdminClient } from '@/utils/supabase/server'
import { notFound } from 'next/navigation'
import BranchAcademicHub from './BranchAcademicHub'

export default async function BranchDetailPage({ 
  params 
}: { 
  params: Promise<{ id: string }> 
}) {
  const resolvedParams = await params
  const supabase = await createAdminClient()
  
  // 1. Fetch branch details
  const { data: branch } = await supabase
    .from('branches')
    .select('*')
    .eq('id', resolvedParams.id)
    .single()

  if (!branch) {
    notFound()
  }

  // 2. Fetch semesters for this branch
  const { data: semesters } = await supabase
    .from('semesters')
    .select('*')
    .eq('branch_id', branch.id)
    .order('number', { ascending: true })

  // 3. Fetch branch_subjects assigned for this branch
  let assignedSubjects: any[] = []
  try {
    const { data: bsData, error: bsError } = await supabase
      .from('branch_subjects')
      .select('id, branch_id, semester_id, subject_id, sort_order, is_active, subjects(id, name, short_name, category, theme_color, is_active)')
      .eq('branch_id', branch.id)
      .order('sort_order', { ascending: true })

    if (!bsError && bsData && bsData.length > 0) {
      assignedSubjects = bsData
    } else {
      // Fallback query from legacy subjects table before migration is applied
      const { data: legacySubs } = await supabase
        .from('subjects')
        .select('id, branch_id, semester_id, name, short_name, category, theme_color, is_active, sort_order')
        .eq('branch_id', branch.id)
        .order('sort_order', { ascending: true })

      if (legacySubs) {
        assignedSubjects = legacySubs.map(s => ({
          id: s.id,
          branch_id: s.branch_id,
          semester_id: s.semester_id,
          subject_id: s.id,
          sort_order: s.sort_order,
          is_active: s.is_active,
          subjects: s
        }))
      }
    }
  } catch (err) {
    console.warn('branch_subjects error on branch detail:', err)
  }

  // 4. Fetch all master subjects for assignment modal
  const { data: allMasterSubjects } = await supabase
    .from('subjects')
    .select('id, name, short_name, category, theme_color, is_active')
    .order('name', { ascending: true })

  return (
    <BranchAcademicHub 
      branch={branch}
      semesters={semesters || []}
      assignedSubjects={assignedSubjects}
      allMasterSubjects={allMasterSubjects || []}
    />
  )
}
