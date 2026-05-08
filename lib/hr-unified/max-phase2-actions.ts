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

export async function createOpeningPhase2(fd: FormData) {
  const supabase = await createClient()
  const payload = {
    title:s(fd,'title'), department:s(fd,'department'), position:s(fd,'position'), location:s(fd,'location','Morocco'),
    contract_type:s(fd,'contract_type','full_time'), priority:s(fd,'priority','medium'), status:s(fd,'status','open'), stage:s(fd,'stage','open'),
    headcount:n(fd,'headcount',1), salary_min:n(fd,'salary_min',0), salary_max:n(fd,'salary_max',0),
    description:s(fd,'description'), requirements:s(fd,'requirements'), notes:s(fd,'notes')
  }
  const { data, error } = await supabase.from('hr_job_openings').insert([payload]).select('id').single()
  if (error) throw new Error(error.message)
  await audit('create_opening_phase2','hr_job_openings',data?.id,payload)
  revalidatePath('/hr/openings')
  redirect(`/hr/openings/${data.id}`)
}

export async function createOnboardingStepPhase2(fd: FormData) {
  const supabase = await createClient()
  const payload = {
    staff_id: nullable(fd,'staff_id'), candidate_id: nullable(fd,'candidate_id'), onboarding_id: nullable(fd,'onboarding_id'),
    title:s(fd,'title'), category:s(fd,'category','general'), stage:s(fd,'stage','preboarding'), status:s(fd,'status','pending'),
    due_at: nullable(fd,'due_at'), evidence_url:s(fd,'evidence_url'), notes:s(fd,'notes')
  }
  const { data, error } = await supabase.from('hr_onboarding_steps').insert([payload]).select('id').single()
  if (error) throw new Error(error.message)
  await audit('create_onboarding_step_phase2','hr_onboarding_steps',data?.id,payload)
  revalidatePath('/hr/onboarding')
}

export async function createChecklistPhase2(fd: FormData) {
  const supabase = await createClient()
  const payload = {
    name:s(fd,'name'), role_key:s(fd,'role_key'), stage:s(fd,'stage','active'), status:s(fd,'status','active'),
    checklist: String(fd.get('checklist') || '').split('\n').filter(Boolean).map((title, i)=>({ id:i+1, title, status:'pending' })),
    notes:s(fd,'notes')
  }
  const { data, error } = await supabase.from('hr_onboarding_checklists').insert([payload]).select('id').single()
  if (error) throw new Error(error.message)
  await audit('create_checklist_phase2','hr_onboarding_checklists',data?.id,payload)
  revalidatePath('/hr/onboarding/checklists')
}

export async function createDocumentPhase2(fd: FormData) {
  const supabase = await createClient()
  const payload = {
    staff_id: nullable(fd,'staff_id'), document_type:s(fd,'document_type','document'), title:s(fd,'title'), file_url:s(fd,'file_url'),
    expiry_date: nullable(fd,'expiry_date'), status:s(fd,'status','active'), stage:s(fd,'stage','valid'), verification_status:s(fd,'verification_status','pending'), notes:s(fd,'notes')
  }
  const { error } = await supabase.from('hr_staff_documents').insert([payload])
  if (error) throw new Error(error.message)
  await audit('create_document_phase2','hr_staff_documents',null,payload)
  revalidatePath('/hr/staff')
}

export async function createReviewPhase2(fd: FormData) {
  const supabase = await createClient()
  const payload = {
    staff_id: nullable(fd,'staff_id'), period_start: nullable(fd,'period_start'), period_end: nullable(fd,'period_end'),
    overall_score:n(fd,'overall_score',0), punctuality_score:n(fd,'punctuality_score',0), quality_score:n(fd,'quality_score',0),
    reliability_score:n(fd,'reliability_score',0), client_feedback_score:n(fd,'client_feedback_score',0),
    status:s(fd,'status','open'), stage:s(fd,'stage','draft'), strengths:s(fd,'strengths'), improvements:s(fd,'improvements'), action_plan:s(fd,'action_plan'), notes:s(fd,'notes')
  }
  const { error } = await supabase.from('hr_staff_performance_reviews').insert([payload])
  if (error) throw new Error(error.message)
  await audit('create_review_phase2','hr_staff_performance_reviews',null,payload)
  revalidatePath('/hr/staff')
}

export async function createRosterPhase2(fd: FormData) {
  const supabase = await createClient()
  const payload = {
    staff_id: nullable(fd,'staff_id'), staff_name:s(fd,'staff_name'), shift_date:nullable(fd,'shift_date'),
    start_time:s(fd,'start_time'), end_time:s(fd,'end_time'), area:s(fd,'area'), role:s(fd,'role'),
    status:s(fd,'status','planned'), stage:s(fd,'stage','planned'), notes:s(fd,'notes')
  }
  const { error } = await supabase.from('hr_rosters').insert([payload])
  if (error) throw new Error(error.message)
  await audit('create_roster_phase2','hr_rosters',null,payload)
  revalidatePath('/hr/rosters')
  revalidatePath('/hr/rosters/planner')
}

export async function createAttendanceCorrectionPhase2(fd: FormData) {
  const supabase = await createClient()
  const payload = {
    staff_id: nullable(fd,'staff_id'), attendance_id: nullable(fd,'attendance_id'), correction_type:s(fd,'correction_type','manual_correction'),
    reason:s(fd,'reason'), original_value:{ value:s(fd,'original_value') }, requested_value:{ value:s(fd,'requested_value') },
    status:s(fd,'status','pending'), stage:s(fd,'stage','requested'), notes:s(fd,'notes')
  }
  const { error } = await supabase.from('hr_attendance_corrections').insert([payload])
  if (error) throw new Error(error.message)
  await audit('create_attendance_correction_phase2','hr_attendance_corrections',null,payload)
  revalidatePath('/hr/attendance/corrections')
}

export async function updateAnyHRPhase2(fd: FormData) {
  const supabase = await createClient()
  const table = s(fd,'table')
  const id = s(fd,'id')
  const returnPath = s(fd,'returnPath','/hr')
  const payload: Record<string, any> = {}
  for (const [k,v] of fd.entries()) {
    if (['table','id','returnPath'].includes(k)) continue
    payload[k] = String(v)
  }
  payload.updated_at = new Date().toISOString()
  const { error } = await supabase.from(table).update(payload).eq('id', id)
  if (error) throw new Error(error.message)
  await audit('update_any_phase2',table,id,payload)
  revalidatePath(returnPath)
}

export async function deleteAnyHRPhase2(fd: FormData) {
  const supabase = await createClient()
  const table = s(fd,'table')
  const id = s(fd,'id')
  const returnPath = s(fd,'returnPath','/hr')
  const { error } = await supabase.from(table).delete().eq('id', id)
  if (error) throw new Error(error.message)
  await audit('delete_any_phase2',table,id)
  revalidatePath(returnPath)
  redirect(returnPath)
}
