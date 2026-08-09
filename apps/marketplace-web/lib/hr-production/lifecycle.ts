import { createClient } from '@/lib/supabase/server'
import { HR_CANONICAL_TABLES, normalizeHRName, type HRCanonicalRow } from './source-of-truth'
import { logHRActivity } from './repository'

const now = () => new Date().toISOString()

function text(value: unknown): string | null {
  const normalized = String(value ?? '').trim()
  return normalized || null
}

function row(value: unknown): HRCanonicalRow | null {
  return value && typeof value === 'object' ? value as HRCanonicalRow : null
}

type LifecycleCounts = {
  onboarding: number
  onboarding_tasks: number
  onboarding_documents: number
  documents: number
  training: number
  contracts: number
  tasks: number
}

type LifecycleSuccess = { ok: true; staff: HRCanonicalRow; created: LifecycleCounts }
type LifecycleFailure = { ok: false; error: string }
export type StaffLifecycleBundleResult = LifecycleSuccess | LifecycleFailure

async function compensateStaffBundle(staffId: string): Promise<string[]> {
  const supabase = await createClient()
  const cleanupErrors: string[] = []
  for (const table of [HR_CANONICAL_TABLES.documents, HR_CANONICAL_TABLES.training, HR_CANONICAL_TABLES.contracts, HR_CANONICAL_TABLES.tasks]) {
    const { error } = await supabase.from(table).delete().eq('staff_id', staffId)
    if (error) cleanupErrors.push(`${table}: ${error.message}`)
  }
  const { error: staffError } = await supabase.from(HR_CANONICAL_TABLES.staff).delete().eq('id', staffId)
  if (staffError) cleanupErrors.push(`${HR_CANONICAL_TABLES.staff}: ${staffError.message}`)
  return cleanupErrors
}

export async function createStaffLifecycleBundle(input: Record<string, unknown>): Promise<StaffLifecycleBundleResult> {
  const supabase = await createClient()
  const staffPayload = {
    full_name: text(input.full_name ?? input.name) || 'New HR staff member',
    email: text(input.email),
    phone: text(input.phone),
    department_id: text(input.department_id),
    position_id: text(input.position_id),
    status: text(input.status) || 'active',
    hire_date: text(input.hire_date) || new Date().toISOString().slice(0, 10),
    metadata: {
      source: text(input.source) || 'hr-lifecycle',
      candidate_id: text(input.candidate_id),
      ...(row(input.metadata) ?? {}),
    },
    created_at: now(),
    updated_at: now(),
  }

  const { data: rawStaff, error } = await supabase
    .from(HR_CANONICAL_TABLES.staff)
    .insert(staffPayload)
    .select('*')
    .maybeSingle()
  const staff = row(rawStaff)
  if (error || !staff) return { ok: false, error: error?.message || 'Staff creation failed' }

  const staffId = text(staff.id)
  if (!staffId) return { ok: false, error: 'Created staff record has no identifier' }
  const candidateId = text(input.candidate_id)
  const name = normalizeHRName(staff)

  const documents = ['CIN / ID', 'CV', 'Diploma or certificate', 'Bank details', 'Emergency contact'].map((title) => ({
    staff_id: staffId,
    candidate_id: candidateId,
    title,
    document_type: title.toLowerCase().replaceAll(' ', '_'),
    status: 'missing',
    created_at: now(),
    updated_at: now(),
  }))
  const trainings = ['AngelCare values and service standards', 'Child safety and safeguarding basics', 'Operational attendance and roster usage'].map((title) => ({
    staff_id: staffId,
    title,
    status: 'planned',
    provider: 'AngelCare Academy',
    due_at: new Date(Date.now() + 7 * 86400000).toISOString(),
    created_at: now(),
    updated_at: now(),
  }))

  const ancillaryWrites = [
    {
      table: HR_CANONICAL_TABLES.documents,
      run: () =>
        supabase
          .from(HR_CANONICAL_TABLES.documents)
          .insert(documents),
    },
    {
      table: HR_CANONICAL_TABLES.training,
      run: () =>
        supabase
          .from(HR_CANONICAL_TABLES.training)
          .insert(trainings),
    },
    {
      table: HR_CANONICAL_TABLES.contracts,
      run: () =>
        supabase
          .from(HR_CANONICAL_TABLES.contracts)
          .insert({
            staff_id: staffId,
            candidate_id: candidateId,
            title: `${name} contract`,
            status: 'draft',
            contract_type:
              text(input.contract_type) || 'standard',
            starts_at: staffPayload.hire_date,
            created_at: now(),
            updated_at: now(),
          }),
    },
    {
      table: HR_CANONICAL_TABLES.tasks,
      run: () =>
        supabase
          .from(HR_CANONICAL_TABLES.tasks)
          .insert({
            staff_id: staffId,
            title: `Complete HR activation for ${name}`,
            status: 'todo',
            priority: 'high',
            owner_role: 'hr_admin',
            due_at: new Date(
              Date.now() + 48 * 3600000,
            ).toISOString(),
            created_at: now(),
            updated_at: now(),
          }),
    },
  ] as const

  for (const write of ancillaryWrites) {
    const { error: writeError } = await write.run()

    if (writeError) {
      const cleanupErrors =
        await compensateStaffBundle(staffId)

      return {
        ok: false,
        error: `${write.table}: ${writeError.message}${
          cleanupErrors.length
            ? ` · compensation: ${cleanupErrors.join(' | ')}`
            : ''
        }`,
      }
    }
  }

  const onboardingActor = {
    userId: text(input.actor_user_id ?? input.updated_by ?? input.created_by) || staffId,
    fullName: text(input.actor_name) || 'HR Lifecycle',
    role: 'hr',
    sovereign: false,
    tenantKey: text(input.tenant_id),
    organizationKey: text(input.organization_id),
  }
  const { data: rawOnboardingResult, error: onboardingError } = await supabase.rpc('hr_onboarding_ensure_journey', {
    p_candidate_key: candidateId,
    p_staff_key: staffId,
    p_payload: {
      title: name,
      position: text(input.position ?? input.job_title),
      department: text(input.department),
      startDate: staffPayload.hire_date,
      email: staffPayload.email,
      phone: staffPayload.phone,
      employmentType: text(input.contract_type) || 'standard',
      owner: text(input.owner),
      manager: text(input.manager),
      idempotencyKey: `staff-lifecycle:${staffId}`,
      notes: 'Canonical onboarding journey created by the staff lifecycle bundle.',
    },
    p_actor: onboardingActor,
  })
  const onboardingResult = row(rawOnboardingResult)
  if (onboardingError || !onboardingResult) {
    const cleanupErrors = await compensateStaffBundle(staffId)
    return {
      ok: false,
      error: `${onboardingError?.message || 'Canonical onboarding journey creation failed'}${cleanupErrors.length ? ` · compensation: ${cleanupErrors.join(' | ')}` : ''}`,
    }
  }

  const { error: syncError } = await supabase.from(HR_CANONICAL_TABLES.syncEvents).insert({
    event_type: 'staff_lifecycle_bundle_created',
    status: 'completed',
    source: 'hr-lifecycle',
    payload: { staff_id: staffId, candidate_id: candidateId, journey_key: text(onboardingResult.journeyKey) },
    created_at: now(),
    updated_at: now(),
  })
  if (syncError) {
    return { ok: false, error: `Lifecycle created but sync evidence failed: ${syncError.message}` }
  }

  await logHRActivity({
    action: 'staff_lifecycle_bundle_created',
    entity_type: 'staff',
    entity_id: staffId,
    severity: 'info',
    payload: { candidate_id: candidateId, journey_key: text(onboardingResult.journeyKey) },
  })

  return {
    ok: true,
    staff,
    created: {
      onboarding: 1,
      onboarding_tasks: Number(onboardingResult.taskCount ?? 0),
      onboarding_documents: Number(onboardingResult.documentCount ?? 0),
      documents: documents.length,
      training: trainings.length,
      contracts: 1,
      tasks: 1,
    },
  }
}

export async function convertCandidateToStaff(candidateId: string): Promise<StaffLifecycleBundleResult & { alreadyConverted?: boolean; staff_id?: string }> {
  const supabase = await createClient()
  const { data: rawCandidate, error } = await supabase
    .from(HR_CANONICAL_TABLES.candidates)
    .select('*')
    .eq('id', candidateId)
    .maybeSingle()
  const candidate = row(rawCandidate)
  if (error || !candidate) return { ok: false, error: error?.message || 'Candidate not found' }

  const convertedStaffId = text(candidate.converted_staff_id)
  if (convertedStaffId) {
    return {
      ok: true,
      alreadyConverted: true,
      staff_id: convertedStaffId,
      staff: { id: convertedStaffId },
      created: { onboarding: 0, onboarding_tasks: 0, onboarding_documents: 0, documents: 0, training: 0, contracts: 0, tasks: 0 },
    }
  }

  const bundle = await createStaffLifecycleBundle({ ...candidate, candidate_id: candidateId, source: 'candidate_conversion' })
  if (!bundle.ok) return bundle

  const staffId = text(bundle.staff.id)
  if (!staffId) return { ok: false, error: 'Converted staff record has no identifier' }

  const { error: candidateUpdateError } = await supabase
    .from(HR_CANONICAL_TABLES.candidates)
    .update({ status: 'converted', stage: 'hired', converted_staff_id: staffId, updated_at: now() })
    .eq('id', candidateId)
  if (candidateUpdateError) return { ok: false, error: candidateUpdateError.message }

  const { error: syncError } = await supabase.from(HR_CANONICAL_TABLES.syncEvents).insert({
    event_type: 'candidate_converted_to_staff',
    status: 'completed',
    source: 'hr-lifecycle',
    payload: { candidate_id: candidateId, staff_id: staffId },
    created_at: now(),
    updated_at: now(),
  })
  if (syncError) return { ok: false, error: syncError.message }

  await logHRActivity({
    action: 'candidate_converted_to_staff',
    entity_type: 'candidate',
    entity_id: candidateId,
    severity: 'info',
    payload: { staff_id: staffId },
  })

  return { ok: true, staff: bundle.staff, created: bundle.created }
}
