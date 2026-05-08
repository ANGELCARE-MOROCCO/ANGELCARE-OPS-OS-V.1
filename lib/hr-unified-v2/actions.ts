'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

type Payload = Record<string, any>
function str(v: FormDataEntryValue | null) { return String(v || '').trim() }
function num(v: FormDataEntryValue | null) { const n = Number(v || 0); return Number.isFinite(n) ? n : 0 }
function bool(v: FormDataEntryValue | null) { return v === 'on' || v === 'true' || v === '1' }
async function insertAudit(action:string, entity:string, entityId:any, details:Payload={}) {
  const supabase = await createClient()
  await supabase.from('hr_audit_logs').insert([{ action, entity, entity_id:String(entityId||''), details }])
}
async function upsert(table:string, payload:Payload, id?:string|null, path='/hr') {
  const supabase = await createClient()
  if (id) {
    const { error } = await supabase.from(table).update(payload).eq('id', id)
    if (error) throw new Error(error.message)
    await insertAudit('update', table, id, payload)
  } else {
    const { data, error } = await supabase.from(table).insert([payload]).select('id').single()
    if (error) throw new Error(error.message)
    await insertAudit('create', table, data?.id, payload)
  }
  revalidatePath('/hr')
  revalidatePath(path)
}

export async function saveHrOpening(formData: FormData) {
  const id = str(formData.get('id')) || null
  await upsert('hr_openings', {
    title:str(formData.get('title')), department_id:str(formData.get('department_id')) || null, position_id:str(formData.get('position_id')) || null,
    status:str(formData.get('status')) || 'open', priority:str(formData.get('priority')) || 'medium', openings_count:num(formData.get('openings_count')) || 1,
    city:str(formData.get('city')), contract_type:str(formData.get('contract_type')), salary_range:str(formData.get('salary_range')),
    mission:str(formData.get('mission')), requirements:str(formData.get('requirements')), owner:str(formData.get('owner')), due_date:str(formData.get('due_date')) || null,
  }, id, '/hr/openings')
  redirect('/hr/openings')
}

export async function saveHrCandidate(formData: FormData) {
  const id = str(formData.get('id')) || null
  await upsert('hr_candidates', {
    opening_id:str(formData.get('opening_id')) || null, full_name:str(formData.get('full_name')), phone:str(formData.get('phone')), email:str(formData.get('email')),
    stage:str(formData.get('stage')) || 'applied', score:num(formData.get('score')), source:str(formData.get('source')), city:str(formData.get('city')),
    availability:str(formData.get('availability')), notes:str(formData.get('notes')), owner:str(formData.get('owner')), next_action_at:str(formData.get('next_action_at')) || null,
  }, id, '/hr/recruitment')
  redirect('/hr/recruitment')
}

export async function saveHrOnboarding(formData: FormData) {
  const id = str(formData.get('id')) || null
  await upsert('hr_onboardings', {
    candidate_id:str(formData.get('candidate_id')) || null, staff_id:str(formData.get('staff_id')) || null, title:str(formData.get('title')),
    status:str(formData.get('status')) || 'pending', start_date:str(formData.get('start_date')) || null, owner:str(formData.get('owner')),
    checklist: { identity: bool(formData.get('identity')), documents: bool(formData.get('documents')), contract: bool(formData.get('contract')), training: bool(formData.get('training')), tools: bool(formData.get('tools')), first_shift: bool(formData.get('first_shift')), manager_validation: bool(formData.get('manager_validation')) },
    notes:str(formData.get('notes')),
  }, id, '/hr/onboarding')
  redirect('/hr/onboarding')
}

export async function saveHrStaffProfile(formData: FormData) {
  const id = str(formData.get('id')) || null
  await upsert('hr_staff_profiles', {
    app_user_id:str(formData.get('app_user_id')) || null, full_name:str(formData.get('full_name')), phone:str(formData.get('phone')), email:str(formData.get('email')), city:str(formData.get('city')),
    department_id:str(formData.get('department_id')) || null, position_id:str(formData.get('position_id')) || null, status:str(formData.get('status')) || 'active', employment_type:str(formData.get('employment_type')),
    start_date:str(formData.get('start_date')) || null, manager:str(formData.get('manager')), emergency_contact:str(formData.get('emergency_contact')), notes:str(formData.get('notes')),
  }, id, '/hr/staff')
  redirect('/hr/staff')
}

export async function saveHrDepartment(formData: FormData) {
  const id = str(formData.get('id')) || null
  await upsert('hr_departments', { name:str(formData.get('name')), code:str(formData.get('code')), owner:str(formData.get('owner')), mission:str(formData.get('mission')), status:str(formData.get('status')) || 'active', headcount_target:num(formData.get('headcount_target')), budget_owner:str(formData.get('budget_owner')), notes:str(formData.get('notes')) }, id, '/hr/departments')
  redirect('/hr/departments')
}

export async function saveHrPosition(formData: FormData) {
  const id = str(formData.get('id')) || null
  await upsert('hr_positions', { department_id:str(formData.get('department_id')) || null, title:str(formData.get('title')), level:str(formData.get('level')), status:str(formData.get('status')) || 'active', required_skills:str(formData.get('required_skills')), responsibilities:str(formData.get('responsibilities')), salary_band:str(formData.get('salary_band')), notes:str(formData.get('notes')) }, id, '/hr/departments/positions')
  redirect('/hr/departments/positions')
}

export async function saveHrRoster(formData: FormData) {
  const id = str(formData.get('id')) || null
  await upsert('hr_rosters', { staff_id:str(formData.get('staff_id')) || null, staff_name:str(formData.get('staff_name')), shift_date:str(formData.get('shift_date')) || null, start_time:str(formData.get('start_time')), end_time:str(formData.get('end_time')), area:str(formData.get('area')), role:str(formData.get('role')), status:str(formData.get('status')) || 'planned', notes:str(formData.get('notes')) }, id, '/hr/rosters')
  redirect('/hr/rosters')
}

export async function saveHrAttendance(formData: FormData) {
  const id = str(formData.get('id')) || null
  await upsert('hr_attendance', { staff_id:str(formData.get('staff_id')) || null, staff_name:str(formData.get('staff_name')), attendance_date:str(formData.get('attendance_date')) || null, clock_in:str(formData.get('clock_in')), clock_out:str(formData.get('clock_out')), status:str(formData.get('status')) || 'present', source:str(formData.get('source')) || 'manual', correction_reason:str(formData.get('correction_reason')), approval_status:str(formData.get('approval_status')) || 'pending', notes:str(formData.get('notes')) }, id, '/hr/attendance')
  redirect('/hr/attendance')
}

export async function saveHrTask(formData: FormData) {
  const id = str(formData.get('id')) || null
  await upsert('hr_tasks', { title:str(formData.get('title')), task_type:str(formData.get('task_type')) || 'general', status:str(formData.get('status')) || 'open', priority:str(formData.get('priority')) || 'medium', owner:str(formData.get('owner')), due_date:str(formData.get('due_date')) || null, related_entity:str(formData.get('related_entity')), related_id:str(formData.get('related_id')), description:str(formData.get('description')) }, id, '/hr/tasks')
  redirect('/hr/tasks')
}

export async function saveHrDocument(formData: FormData) {
  const id = str(formData.get('id')) || null
  await upsert('hr_documents', { staff_id:str(formData.get('staff_id')) || null, title:str(formData.get('title')), document_type:str(formData.get('document_type')), status:str(formData.get('status')) || 'pending', expiry_date:str(formData.get('expiry_date')) || null, file_url:str(formData.get('file_url')), notes:str(formData.get('notes')) }, id, '/hr/documents')
  redirect('/hr/documents')
}

export async function updateHrStatus(table:string, id:string, status:string, path='/hr') {
  const supabase = await createClient()
  const { error } = await supabase.from(table).update({ status }).eq('id', id)
  if (error) throw new Error(error.message)
  await insertAudit('status_change', table, id, { status })
  revalidatePath('/hr'); revalidatePath(path)
}

export async function deleteHrRecord(table:string, id:string, path='/hr') {
  const supabase = await createClient()
  const { error } = await supabase.from(table).delete().eq('id', id)
  if (error) throw new Error(error.message)
  await insertAudit('delete', table, id, {})
  revalidatePath('/hr'); revalidatePath(path)
}
