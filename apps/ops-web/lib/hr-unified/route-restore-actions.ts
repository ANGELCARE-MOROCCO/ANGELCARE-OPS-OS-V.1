'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

function s(fd: FormData, k: string, f='') { return String(fd.get(k) || f) }
function n(fd: FormData, k: string, f=0) { const v = Number(fd.get(k)); return Number.isFinite(v) ? v : f }
function nullable(fd: FormData, k: string) { const v = String(fd.get(k) || '').trim(); return v || null }

export async function createOpeningRestore(fd: FormData) {
  const supabase = await createClient()
  const payload = {
    title:s(fd,'title'), department:s(fd,'department'), position:s(fd,'position'), location:s(fd,'location','Morocco'),
    contract_type:s(fd,'contract_type','full_time'), priority:s(fd,'priority','medium'), status:s(fd,'status','open'), stage:s(fd,'stage','open'),
    headcount:n(fd,'headcount',1), salary_min:n(fd,'salary_min',0), salary_max:n(fd,'salary_max',0),
    description:s(fd,'description'), requirements:s(fd,'requirements'), notes:s(fd,'notes')
  }
  const { data, error } = await supabase.from('hr_job_openings').insert([payload]).select('id').single()
  if (error) throw new Error(error.message)
  revalidatePath('/hr/openings')
  redirect(`/hr/openings/${data.id}`)
}

export async function createCandidateRestore(fd: FormData) {
  const supabase = await createClient()
  const payload = {
    full_name:s(fd,'full_name'), phone:s(fd,'phone'), email:s(fd,'email'), city:s(fd,'city'),
    source:s(fd,'source','manual'), stage:s(fd,'stage','new'), status:s(fd,'status','active'),
    rating:n(fd,'rating',0), expected_salary:n(fd,'expected_salary',0), next_action:s(fd,'next_action'), notes:s(fd,'notes')
  }
  const { data, error } = await supabase.from('hr_recruitment_candidates').insert([payload]).select('id').single()
  if (error) throw new Error(error.message)
  await supabase.from('hr_recruitment_pipeline').insert([{ candidate_id:data.id, stage:payload.stage, status:'active', decision:'Candidate created' }])
  revalidatePath('/hr/recruitment')
  redirect(`/hr/recruitment/candidates/${data.id}`)
}

export async function moveCandidateRestore(fd: FormData) {
  const supabase = await createClient()
  const id = s(fd,'id')
  const stage = s(fd,'stage','screening')
  const { error } = await supabase.from('hr_recruitment_candidates').update({ stage, updated_at:new Date().toISOString() }).eq('id', id)
  if (error) throw new Error(error.message)
  await supabase.from('hr_recruitment_pipeline').insert([{ candidate_id:id, stage, status:'active', decision:`Moved to ${stage}` }])
  revalidatePath('/hr/recruitment')
  revalidatePath('/hr/recruitment/kanban')
  revalidatePath(`/hr/recruitment/candidates/${id}`)
}

export async function createStaffRestore(fd: FormData) {
  const supabase = await createClient()
  const payload = {
    full_name:s(fd,'full_name'), name:s(fd,'full_name'), phone:s(fd,'phone'), email:s(fd,'email'),
    department:s(fd,'department'), position:s(fd,'position'), job_title:s(fd,'position'), city:s(fd,'city'),
    status:s(fd,'status','active'), stage:s(fd,'stage','active'), notes:s(fd,'notes')
  }
  const { data, error } = await supabase.from('hr_staff').insert([payload]).select('id').single()
  if (error) throw new Error(error.message)
  revalidatePath('/hr/staff')
  redirect(`/hr/staff/${data.id}`)
}

export async function createRosterRestore(fd: FormData) {
  const supabase = await createClient()
  const payload = { staff_id:nullable(fd,'staff_id'), staff_name:s(fd,'staff_name'), shift_date:nullable(fd,'shift_date'), start_time:s(fd,'start_time'), end_time:s(fd,'end_time'), area:s(fd,'area'), role:s(fd,'role'), status:s(fd,'status','planned'), stage:s(fd,'stage','planned'), notes:s(fd,'notes') }
  const { error } = await supabase.from('hr_rosters').insert([payload])
  if (error) throw new Error(error.message)
  revalidatePath('/hr/rosters')
  revalidatePath('/hr/rosters/planner')
}

export async function createOnboardingRestore(fd: FormData) {
  const supabase = await createClient()
  const payload = { title:s(fd,'title'), staff_id:nullable(fd,'staff_id'), candidate_id:nullable(fd,'candidate_id'), category:s(fd,'category','general'), stage:s(fd,'stage','preboarding'), status:s(fd,'status','pending'), due_at:nullable(fd,'due_at'), notes:s(fd,'notes') }
  const { error } = await supabase.from('hr_onboarding_steps').insert([payload])
  if (error) throw new Error(error.message)
  revalidatePath('/hr/onboarding')
}

export async function createAttendanceRestore(fd: FormData) {
  const supabase = await createClient()
  const payload = { staff_id:nullable(fd,'staff_id'), staff_name:s(fd,'staff_name'), attendance_date:nullable(fd,'attendance_date'), clock_in:s(fd,'clock_in'), clock_out:s(fd,'clock_out'), status:s(fd,'status','recorded'), stage:s(fd,'stage','recorded'), notes:s(fd,'notes') }
  const { error } = await supabase.from('hr_attendance').insert([payload])
  if (error) throw new Error(error.message)
  revalidatePath('/hr/attendance')
}

export async function createCorrectionRestore(fd: FormData) {
  const supabase = await createClient()
  const payload = { staff_id:nullable(fd,'staff_id'), correction_type:s(fd,'correction_type','manual_correction'), reason:s(fd,'reason'), original_value:{ value:s(fd,'original_value') }, requested_value:{ value:s(fd,'requested_value') }, status:s(fd,'status','pending'), stage:s(fd,'stage','requested'), notes:s(fd,'notes') }
  const { error } = await supabase.from('hr_attendance_corrections').insert([payload])
  if (error) throw new Error(error.message)
  revalidatePath('/hr/attendance/corrections')
}

export async function updateRestore(fd: FormData) {
  const supabase = await createClient()
  const table = s(fd,'table')
  const id = s(fd,'id')
  const returnPath = s(fd,'returnPath','/hr')
  const payload: Record<string, any> = {}
  for (const [k,v] of fd.entries()) {
    if (!['table','id','returnPath'].includes(k)) payload[k] = String(v)
  }
  payload.updated_at = new Date().toISOString()
  const { error } = await supabase.from(table).update(payload).eq('id', id)
  if (error) throw new Error(error.message)
  revalidatePath(returnPath)
}
