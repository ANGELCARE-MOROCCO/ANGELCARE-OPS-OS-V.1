'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/getUser'

function s(fd: FormData, k: string, f='') { return String(fd.get(k) || f) }
function n(fd: FormData, k: string, f=0) { const v = Number(fd.get(k)); return Number.isFinite(v) ? v : f }
function nullable(fd: FormData, k: string) { const v = String(fd.get(k) || '').trim(); return v || null }

async function audit(action: string, entity_type: string, entity_id?: string | null, metadata: Record<string, any> = {}) {
  const supabase = await createClient()
  const user = await getCurrentUser()
  await supabase.from('hr_audit_logs').insert([{ actor_id: user?.id || null, action, entity_type, entity_id: entity_id || null, metadata }])
}

export async function createStaffPhase3(fd: FormData) {
  const supabase = await createClient()
  const payload = {
    full_name:s(fd,'full_name'), name:s(fd,'full_name'), phone:s(fd,'phone'), email:s(fd,'email'),
    department:s(fd,'department'), position:s(fd,'position'), job_title:s(fd,'position'), city:s(fd,'city'),
    employment_type:s(fd,'employment_type','full_time'), start_date:nullable(fd,'start_date'),
    status:s(fd,'status','active'), stage:s(fd,'stage','active'), notes:s(fd,'notes')
  }
  const { data, error } = await supabase.from('hr_staff').insert([payload]).select('id').single()
  if (error) throw new Error(error.message)
  await audit('create_staff_phase3','hr_staff',data?.id,payload)
  revalidatePath('/hr/staff')
  redirect(`/hr/staff/${data.id}`)
}

export async function verifyDocumentPhase3(fd: FormData) {
  const supabase = await createClient()
  const user = await getCurrentUser()
  const id = s(fd,'id')
  const verification_status = s(fd,'verification_status','verified')
  const { error } = await supabase.from('hr_staff_documents').update({
    verification_status,
    status: verification_status === 'verified' ? 'active' : verification_status,
    verified_by: user?.id || null,
    verified_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }).eq('id', id)
  if (error) throw new Error(error.message)
  await audit('verify_document_phase3','hr_staff_documents',id,{verification_status})
  revalidatePath('/hr/documents')
}

export async function createRosterConflictPhase3(fd: FormData) {
  const supabase = await createClient()
  const payload = {
    roster_id: nullable(fd,'roster_id'), staff_id: nullable(fd,'staff_id'),
    conflict_type:s(fd,'conflict_type','schedule_conflict'), severity:s(fd,'severity','medium'),
    stage:s(fd,'stage','detected'), status:s(fd,'status','open'), resolution:s(fd,'resolution'), notes:s(fd,'notes')
  }
  const { error } = await supabase.from('hr_roster_conflicts').insert([payload])
  if (error) throw new Error(error.message)
  await audit('create_roster_conflict_phase3','hr_roster_conflicts',null,payload)
  revalidatePath('/hr/rosters/conflicts')
}

export async function resolveRosterConflictPhase3(fd: FormData) {
  const supabase = await createClient()
  const user = await getCurrentUser()
  const id = s(fd,'id')
  const resolution = s(fd,'resolution')
  const { error } = await supabase.from('hr_roster_conflicts').update({
    status:'resolved', stage:'resolved', resolution, resolved_by:user?.id || null, resolved_at:new Date().toISOString(), updated_at:new Date().toISOString()
  }).eq('id', id)
  if (error) throw new Error(error.message)
  await audit('resolve_roster_conflict_phase3','hr_roster_conflicts',id,{resolution})
  revalidatePath('/hr/rosters/conflicts')
}

export async function createInterviewPhase3(fd: FormData) {
  const supabase = await createClient()
  const payload = {
    candidate_id: nullable(fd,'candidate_id'), opening_id: nullable(fd,'opening_id'),
    interview_type:s(fd,'interview_type','phone_screen'), scheduled_at: nullable(fd,'scheduled_at'),
    interviewer:s(fd,'interviewer'), status:s(fd,'status','scheduled'), score:n(fd,'score',0), notes:s(fd,'notes')
  }
  const { error } = await supabase.from('hr_interviews').insert([payload])
  if (error) throw new Error(error.message)
  await audit('create_interview_phase3','hr_interviews',null,payload)
  revalidatePath('/hr/recruitment/interviews')
}

export async function createRecruitmentSourcePhase3(fd: FormData) {
  const supabase = await createClient()
  const payload = {
    name:s(fd,'name'), source_type:s(fd,'source_type','manual'), owner:s(fd,'owner'), status:s(fd,'status','active'),
    monthly_budget:n(fd,'monthly_budget',0), leads_target:n(fd,'leads_target',0), notes:s(fd,'notes')
  }
  const { error } = await supabase.from('hr_recruitment_sources').insert([payload])
  if (error) throw new Error(error.message)
  await audit('create_source_phase3','hr_recruitment_sources',null,payload)
  revalidatePath('/hr/recruitment/sources')
}

export async function updateOnboardingStepStatusPhase3(fd: FormData) {
  const supabase = await createClient()
  const id = s(fd,'id')
  const status = s(fd,'status','completed')
  const { error } = await supabase.from('hr_onboarding_steps').update({
    status, stage:status, completed_at: status === 'completed' ? new Date().toISOString() : null, updated_at:new Date().toISOString()
  }).eq('id', id)
  if (error) throw new Error(error.message)
  await audit('update_onboarding_status_phase3','hr_onboarding_steps',id,{status})
  revalidatePath('/hr/onboarding/board')
}
