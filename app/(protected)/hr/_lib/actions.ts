'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { requireRole } from '@/lib/auth/session'

const allowedTables = new Set(['hr_opening_jobs','hr_candidates','hr_onboarding_cases','hr_staff_profiles','hr_departments','hr_positions','hr_rosters','hr_attendance_records','hr_tasks'])

const redirectByTable: Record<string,string> = {
  hr_opening_jobs:'/hr/openings',
  hr_candidates:'/hr/recruitment',
  hr_onboarding_cases:'/hr/onboarding',
  hr_staff_profiles:'/hr/staff',
  hr_departments:'/hr/departments',
  hr_positions:'/hr/departments/positions',
  hr_rosters:'/hr/rosters',
  hr_attendance_records:'/hr/attendance',
  hr_tasks:'/hr/tasks'
}

const text = (fd: FormData, k: string) => String(fd.get(k) || '').trim()
const num = (fd: FormData, k: string) => Number(fd.get(k) || 0)
const dateOrNull = (fd: FormData, k: string) => text(fd,k) || null
const yes = (fd: FormData, k: string) => text(fd,k) === 'yes'
function table(fd: FormData) { const t=text(fd,'_table'); if(!allowedTables.has(t)) throw new Error('Invalid HR table'); return t }
function clean(o: Record<string, any>) { return Object.fromEntries(Object.entries(o).filter(([,v]) => v !== undefined)) }

function payloadFor(t: string, fd: FormData) {
  if (t === 'hr_opening_jobs') return clean({title:text(fd,'title'),department:text(fd,'department'),position:text(fd,'position'),city:text(fd,'city'),contract_type:text(fd,'contract_type'),hiring_priority:text(fd,'hiring_priority')||'normal',status:text(fd,'status')||'open',openings_count:num(fd,'openings_count')||1,salary_min:num(fd,'salary_min'),salary_max:num(fd,'salary_max'),target_start_date:dateOrNull(fd,'target_start_date'),required_skills:text(fd,'required_skills'),mission_context:text(fd,'mission_context'),approval_owner:text(fd,'approval_owner'),notes:text(fd,'notes'),updated_at:new Date().toISOString()})
  if (t === 'hr_candidates') return clean({full_name:text(fd,'full_name'),phone:text(fd,'phone'),email:text(fd,'email'),city:text(fd,'city'),source:text(fd,'source'),job_id:text(fd,'job_id')||null,desired_position:text(fd,'desired_position'),pipeline_stage:text(fd,'pipeline_stage')||'new',score:num(fd,'score'),expected_salary:num(fd,'expected_salary'),availability_date:dateOrNull(fd,'availability_date'),interview_date:dateOrNull(fd,'interview_date'),decision:text(fd,'decision')||'pending',notes:text(fd,'notes'),updated_at:new Date().toISOString()})
  if (t === 'hr_onboarding_cases') return clean({staff_profile_id:text(fd,'staff_profile_id')||null,candidate_id:text(fd,'candidate_id')||null,full_name:text(fd,'full_name'),role:text(fd,'role'),department:text(fd,'department'),status:text(fd,'status')||'planned',start_date:dateOrNull(fd,'start_date'),contract_collected:yes(fd,'contract_collected'),documents_collected:yes(fd,'documents_collected'),training_assigned:yes(fd,'training_assigned'),buddy_owner:text(fd,'buddy_owner'),probation_end_date:dateOrNull(fd,'probation_end_date'),checklist:text(fd,'checklist'),notes:text(fd,'notes'),updated_at:new Date().toISOString()})
  if (t === 'hr_staff_profiles') return clean({app_user_id:text(fd,'app_user_id')||null,full_name:text(fd,'full_name'),phone:text(fd,'phone'),email:text(fd,'email'),city:text(fd,'city'),department:text(fd,'department'),position:text(fd,'position'),employment_status:text(fd,'employment_status')||'active',contract_type:text(fd,'contract_type'),start_date:dateOrNull(fd,'start_date'),emergency_contact:text(fd,'emergency_contact'),skills:text(fd,'skills'),certifications:text(fd,'certifications'),performance_notes:text(fd,'performance_notes'),updated_at:new Date().toISOString()})
  if (t === 'hr_departments') return clean({name:text(fd,'name'),code:text(fd,'code'),owner:text(fd,'owner'),mission:text(fd,'mission'),status:text(fd,'status')||'active',headcount_target:num(fd,'headcount_target'),budget_owner:text(fd,'budget_owner'),notes:text(fd,'notes'),updated_at:new Date().toISOString()})
  if (t === 'hr_positions') return clean({department_id:text(fd,'department_id')||null,title:text(fd,'title'),job_family:text(fd,'job_family'),level:text(fd,'level'),status:text(fd,'status')||'active',headcount_target:num(fd,'headcount_target'),base_salary:num(fd,'base_salary'),required_skills:text(fd,'required_skills'),responsibilities:text(fd,'responsibilities'),notes:text(fd,'notes'),updated_at:new Date().toISOString()})
  if (t === 'hr_rosters') return clean({staff_profile_id:text(fd,'staff_profile_id')||null,staff_name:text(fd,'staff_name'),shift_date:dateOrNull(fd,'shift_date'),start_time:text(fd,'start_time'),end_time:text(fd,'end_time'),location:text(fd,'location'),area:text(fd,'area'),duty_type:text(fd,'duty_type'),status:text(fd,'status')||'planned',mission_ref:text(fd,'mission_ref'),notes:text(fd,'notes'),updated_at:new Date().toISOString()})
  if (t === 'hr_attendance_records') return clean({staff_profile_id:text(fd,'staff_profile_id')||null,staff_name:text(fd,'staff_name'),attendance_date:dateOrNull(fd,'attendance_date'),check_in:text(fd,'check_in'),check_out:text(fd,'check_out'),status:text(fd,'status')||'present',validation_status:text(fd,'validation_status')||'pending',correction_reason:text(fd,'correction_reason'),approved_by:text(fd,'approved_by'),notes:text(fd,'notes'),updated_at:new Date().toISOString()})
  if (t === 'hr_tasks') return clean({task_type:text(fd,'task_type'),title:text(fd,'title'),owner:text(fd,'owner'),priority:text(fd,'priority')||'medium',status:text(fd,'status')||'open',due_date:dateOrNull(fd,'due_date'),related_module:text(fd,'related_module'),related_record_id:text(fd,'related_record_id'),description:text(fd,'description'),outcome:text(fd,'outcome'),updated_at:new Date().toISOString()})
  return {}
}

async function logHr(source_table:string, record_id:any, action:string, details:any) {
  const supabase = await createClient()
  let actor:any = null
  try { actor = await requireRole(['ceo','manager','ops_admin','hr','coordinator']) } catch {}
  await supabase.from('hr_activity_log').insert([{actor_user_id:actor?.id||null,source_table,record_id:String(record_id||''),action,details}])
}

export async function createHrRecord(formData: FormData) {
  await requireRole(['ceo','manager','ops_admin','hr','coordinator'])
  const supabase = await createClient()
  const t = table(formData)
  const payload = payloadFor(t, formData)
  const { data, error } = await supabase.from(t).insert([payload]).select('id').single()
  if (error) throw new Error(error.message)
  await logHr(t, data?.id, 'create', payload)
  revalidatePath('/hr')
  redirect(redirectByTable[t] || '/hr')
}

export async function updateHrRecord(formData: FormData) {
  await requireRole(['ceo','manager','ops_admin','hr','coordinator'])
  const supabase = await createClient()
  const t = table(formData)
  const id = text(formData, '_id')
  const payload = payloadFor(t, formData)
  const { error } = await supabase.from(t).update(payload).eq('id', id)
  if (error) throw new Error(error.message)
  await logHr(t, id, 'update', payload)
  revalidatePath('/hr')
  redirect(text(formData, '_redirect') || redirectByTable[t] || '/hr')
}

export async function deleteHrRecord(formData: FormData) {
  await requireRole(['ceo','manager','ops_admin','hr'])
  const supabase = await createClient()
  const t = table(formData)
  const id = text(formData, '_id')
  const { error } = await supabase.from(t).delete().eq('id', id)
  if (error) throw new Error(error.message)
  await logHr(t, id, 'delete', {})
  revalidatePath('/hr')
  redirect(text(formData, '_redirect') || redirectByTable[t] || '/hr')
}

export async function advanceHrStatus(formData: FormData) {
  await requireRole(['ceo','manager','ops_admin','hr','coordinator'])
  const supabase = await createClient()
  const t = table(formData)
  const id = text(formData, '_id')
  const status = text(formData, 'status')
  const field = text(formData, '_field') || 'status'
  const { error } = await supabase.from(t).update({[field]:status,updated_at:new Date().toISOString()}).eq('id', id)
  if (error) throw new Error(error.message)
  await logHr(t, id, 'status_change', {field,status})
  revalidatePath('/hr')
  redirect(text(formData, '_redirect') || redirectByTable[t] || '/hr')
}

export async function addHrTask(formData: FormData) {
  await requireRole(['ceo','manager','ops_admin','hr','coordinator'])
  const supabase = await createClient()
  const payload = payloadFor('hr_tasks', formData)
  const { data, error } = await supabase.from('hr_tasks').insert([payload]).select('id').single()
  if (error) throw new Error(error.message)
  await logHr('hr_tasks', data?.id, 'create_task', payload)
  revalidatePath('/hr')
  redirect(text(formData, '_redirect') || '/hr/tasks')
}
