import { createClient } from '@/lib/supabase/server'
import { HR_CANONICAL_TABLES, normalizeHRName } from './source-of-truth'
import { logHRActivity } from './repository'

const now = () => new Date().toISOString()

export async function createStaffLifecycleBundle(input: Record<string, any>) {
  const supabase = await createClient()
  const staffPayload = {
    full_name: input.full_name || input.name || 'New HR staff member',
    email: input.email || null,
    phone: input.phone || null,
    department_id: input.department_id || null,
    position_id: input.position_id || null,
    status: input.status || 'active',
    hire_date: input.hire_date || new Date().toISOString().slice(0, 10),
    metadata: { source: input.source || 'hr-lifecycle', candidate_id: input.candidate_id || null, ...(input.metadata || {}) },
    created_at: now(),
    updated_at: now(),
  }

  const { data: staff, error } = await supabase.from(HR_CANONICAL_TABLES.staff).insert(staffPayload).select('*').maybeSingle()
  if (error || !staff) return { ok: false, error: error?.message || 'Staff creation failed' }

  const staffId = staff.id
  const candidateId = input.candidate_id || null
  const name = normalizeHRName(staff)

  const onboarding = [
    'Validate identity and contact details',
    'Prepare contract and payroll profile',
    'Collect mandatory documents',
    'Assign first training plan',
    'Assign first roster / mission readiness',
  ].map((title, index) => ({ staff_id: staffId, candidate_id: candidateId, title, status: 'todo', owner_role: index < 2 ? 'hr' : 'operations', due_at: new Date(Date.now() + (index + 1) * 86400000).toISOString(), created_at: now(), updated_at: now() }))

  const documents = ['CIN / ID', 'CV', 'Diploma or certificate', 'Bank details', 'Emergency contact'].map((title) => ({ staff_id: staffId, candidate_id: candidateId, title, document_type: title.toLowerCase().replaceAll(' ', '_'), status: 'missing', created_at: now(), updated_at: now() }))

  const trainings = ['AngelCare values and service standards', 'Child safety and safeguarding basics', 'Operational attendance and roster usage'].map((title) => ({ staff_id: staffId, title, status: 'planned', provider: 'AngelCare Academy', due_at: new Date(Date.now() + 7 * 86400000).toISOString(), created_at: now(), updated_at: now() }))

  await supabase.from(HR_CANONICAL_TABLES.onboarding).insert(onboarding)
  await supabase.from(HR_CANONICAL_TABLES.documents).insert(documents)
  await supabase.from(HR_CANONICAL_TABLES.training).insert(trainings)
  await supabase.from(HR_CANONICAL_TABLES.contracts).insert({ staff_id: staffId, candidate_id: candidateId, title: `${name} contract`, status: 'draft', contract_type: input.contract_type || 'standard', starts_at: staffPayload.hire_date, created_at: now(), updated_at: now() })
  await supabase.from(HR_CANONICAL_TABLES.tasks).insert({ staff_id: staffId, title: `Complete HR activation for ${name}`, status: 'todo', priority: 'high', owner_role: 'hr_admin', due_at: new Date(Date.now() + 48 * 3600000).toISOString(), created_at: now(), updated_at: now() })
  await supabase.from(HR_CANONICAL_TABLES.syncEvents).insert({ event_type: 'staff_lifecycle_bundle_created', status: 'completed', source: 'hr-lifecycle', payload: { staff_id: staffId, candidate_id: candidateId }, created_at: now(), updated_at: now() })
  await logHRActivity({ action: 'staff_lifecycle_bundle_created', entity_type: 'staff', entity_id: staffId, severity: 'info', payload: { candidate_id: candidateId } })

  return { ok: true, staff, created: { onboarding: onboarding.length, documents: documents.length, training: trainings.length, contracts: 1, tasks: 1 } }
}

export async function convertCandidateToStaff(candidateId: string) {
  const supabase = await createClient()
  const { data: candidate, error } = await supabase.from(HR_CANONICAL_TABLES.candidates).select('*').eq('id', candidateId).maybeSingle()
  if (error || !candidate) return { ok: false, error: error?.message || 'Candidate not found' }
  if (candidate.converted_staff_id) return { ok: true, alreadyConverted: true, staff_id: candidate.converted_staff_id }

  const bundle = await createStaffLifecycleBundle({ ...candidate, candidate_id: candidateId, source: 'candidate_conversion' })
  if (!bundle.ok) return bundle

  await supabase.from(HR_CANONICAL_TABLES.candidates).update({ status: 'converted', stage: 'hired', converted_staff_id: bundle.staff.id, updated_at: now() }).eq('id', candidateId)
  await supabase.from(HR_CANONICAL_TABLES.syncEvents).insert({ event_type: 'candidate_converted_to_staff', status: 'completed', source: 'hr-lifecycle', payload: { candidate_id: candidateId, staff_id: bundle.staff.id }, created_at: now(), updated_at: now() })
  await logHRActivity({ action: 'candidate_converted_to_staff', entity_type: 'candidate', entity_id: candidateId, severity: 'info', payload: { staff_id: bundle.staff.id } })

  return { ok: true, staff: bundle.staff, created: bundle.created }
}
