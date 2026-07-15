'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { requireRole } from '@/lib/auth/session'
import { HR_ALLOWED_WRITE_TABLES, HR_TABLES, logHRActivity } from '@/lib/hr-production/repository'
import { ensureStaffIdentityContract } from '@/lib/hr-production/identity-contract'

const redirectByTable: Record<string,string> = {
  [HR_TABLES.openings]: '/hr/openings',
  [HR_TABLES.candidates]: '/hr/recruitment',
  [HR_TABLES.onboarding]: '/hr/onboarding',
  [HR_TABLES.staff]: '/hr/staff',
  [HR_TABLES.departments]: '/hr/departments',
  [HR_TABLES.positions]: '/hr/positions',
  [HR_TABLES.rosters]: '/hr/rosters',
  [HR_TABLES.attendance]: '/hr/attendance',
  [HR_TABLES.tasks]: '/hr/tasks',
  [HR_TABLES.approvals]: '/hr/approvals',
  [HR_TABLES.docs]: '/hr/documents',
  [HR_TABLES.serviceRequests]: '/hr/service-requests',
}

const text = (fd: FormData, k: string) => String(fd.get(k) || '').trim()
const num = (fd: FormData, k: string) => Number(fd.get(k) || 0)
const dateOrNull = (fd: FormData, k: string) => text(fd,k) || null
const yes = (fd: FormData, k: string) => ['yes', 'true', '1', 'on'].includes(text(fd,k))
function clean(o: Record<string, any>) { return Object.fromEntries(Object.entries(o).filter(([,v]) => v !== undefined && v !== '')) }
function table(fd: FormData) { const t = text(fd,'_table'); if(!HR_ALLOWED_WRITE_TABLES.has(t as any)) throw new Error(`Invalid HR table: ${t}`); return t }

function payloadFor(t: string, fd: FormData) {
  if (t === HR_TABLES.openings) return clean({ title:text(fd,'title'), department:text(fd,'department'), position:text(fd,'position'), city:text(fd,'city'), contract_type:text(fd,'contract_type'), hiring_priority:text(fd,'hiring_priority')||'normal', status:text(fd,'status')||'open', openings_count:num(fd,'openings_count')||1, salary_min:num(fd,'salary_min'), salary_max:num(fd,'salary_max'), target_start_date:dateOrNull(fd,'target_start_date'), required_skills:text(fd,'required_skills'), mission_context:text(fd,'mission_context'), approval_owner:text(fd,'approval_owner'), notes:text(fd,'notes') })
  if (t === HR_TABLES.candidates) return clean({ full_name:text(fd,'full_name'), phone:text(fd,'phone'), email:text(fd,'email'), city:text(fd,'city'), source:text(fd,'source'), job_id:text(fd,'job_id')||null, desired_position:text(fd,'desired_position'), pipeline_stage:text(fd,'pipeline_stage')||'new', score:num(fd,'score'), expected_salary:num(fd,'expected_salary'), availability_date:dateOrNull(fd,'availability_date'), interview_date:text(fd,'interview_date') || null, decision:text(fd,'decision')||'pending', notes:text(fd,'notes') })
  if (t === HR_TABLES.onboarding) return clean({ staff_id:text(fd,'staff_id')||null, candidate_id:text(fd,'candidate_id')||null, full_name:text(fd,'full_name'), role:text(fd,'role'), department:text(fd,'department'), status:text(fd,'status')||'planned', start_date:dateOrNull(fd,'start_date'), contract_collected:yes(fd,'contract_collected'), documents_collected:yes(fd,'documents_collected'), training_assigned:yes(fd,'training_assigned'), buddy_owner:text(fd,'buddy_owner'), probation_end_date:dateOrNull(fd,'probation_end_date'), checklist:text(fd,'checklist'), notes:text(fd,'notes') })
  if (t === HR_TABLES.staff) return clean({ app_user_id:text(fd,'app_user_id')||null, full_name:text(fd,'full_name'), phone:text(fd,'phone'), email:text(fd,'email'), city:text(fd,'city'), department:text(fd,'department'), position:text(fd,'position'), employment_status:text(fd,'employment_status')||'active', contract_type:text(fd,'contract_type'), start_date:dateOrNull(fd,'start_date'), end_date:dateOrNull(fd,'end_date'), emergency_contact:text(fd,'emergency_contact'), skills:text(fd,'skills'), certifications:text(fd,'certifications'), performance_notes:text(fd,'performance_notes'), compliance_status:text(fd,'compliance_status')||'pending', mission_capacity:num(fd,'mission_capacity'), hourly_cost:num(fd,'hourly_cost'), monthly_salary:num(fd,'monthly_salary') })
  if (t === HR_TABLES.departments) return clean({ name:text(fd,'name'), code:text(fd,'code'), owner:text(fd,'owner'), mission:text(fd,'mission'), status:text(fd,'status')||'active', headcount_target:num(fd,'headcount_target'), budget_owner:text(fd,'budget_owner'), notes:text(fd,'notes') })
  if (t === HR_TABLES.positions) return clean({ department_id:text(fd,'department_id')||null, title:text(fd,'title'), job_family:text(fd,'job_family'), level:text(fd,'level'), status:text(fd,'status')||'active', headcount_target:num(fd,'headcount_target'), base_salary:num(fd,'base_salary'), required_skills:text(fd,'required_skills'), responsibilities:text(fd,'responsibilities'), notes:text(fd,'notes') })
  if (t === HR_TABLES.rosters) return clean({ staff_id:text(fd,'staff_id')||null, staff_name:text(fd,'staff_name'), shift_date:dateOrNull(fd,'shift_date'), start_time:text(fd,'start_time')||null, end_time:text(fd,'end_time')||null, location:text(fd,'location'), area:text(fd,'area'), duty_type:text(fd,'duty_type'), status:text(fd,'status')||'planned', conflict_status:text(fd,'conflict_status')||'clear', mission_ref:text(fd,'mission_ref'), notes:text(fd,'notes') })
  if (t === HR_TABLES.attendance) return clean({ staff_id:text(fd,'staff_id')||null, staff_name:text(fd,'staff_name'), attendance_date:dateOrNull(fd,'attendance_date'), check_in:text(fd,'check_in')||null, check_out:text(fd,'check_out')||null, status:text(fd,'status')||'present', validation_status:text(fd,'validation_status')||'pending', correction_reason:text(fd,'correction_reason'), approved_by:text(fd,'approved_by'), notes:text(fd,'notes') })
  if (t === HR_TABLES.tasks) return clean({ task_type:text(fd,'task_type'), title:text(fd,'title'), owner:text(fd,'owner'), priority:text(fd,'priority')||'medium', status:text(fd,'status')||'open', due_date:dateOrNull(fd,'due_date'), related_module:text(fd,'related_module'), related_record_id:text(fd,'related_record_id')||null, related_staff_id:text(fd,'related_staff_id')||null, description:text(fd,'description'), outcome:text(fd,'outcome') })
  if (t === HR_TABLES.approvals) return clean({ request_type:text(fd,'request_type'), source_table:text(fd,'source_table'), source_record_id:text(fd,'source_record_id')||null, title:text(fd,'title'), requested_by:text(fd,'requested_by'), approver:text(fd,'approver'), status:text(fd,'status')||'pending', decision_notes:text(fd,'decision_notes'), decided_at:text(fd,'decided_at') || null })
  if (t === HR_TABLES.docs) return clean({ staff_id:text(fd,'staff_id')||null, document_type:text(fd,'document_type'), title:text(fd,'title'), file_url:text(fd,'file_url'), status:text(fd,'status')||'missing', expiry_date:dateOrNull(fd,'expiry_date'), owner:text(fd,'owner'), notes:text(fd,'notes') })
  if (t === HR_TABLES.serviceRequests) return clean({ requester:text(fd,'requester'), request_type:text(fd,'request_type'), title:text(fd,'title'), priority:text(fd,'priority')||'medium', status:text(fd,'status')||'open', owner:text(fd,'owner'), due_date:dateOrNull(fd,'due_date'), description:text(fd,'description'), resolution:text(fd,'resolution') })
  return {}
}

async function actor() {
  return requireRole(['ceo','manager','ops_admin','hr','coordinator'])
}

export async function createHrRecord(formData: FormData) {
  const user = await actor()
  const supabase = await createClient()
  const t = table(formData)
  const payload = payloadFor(t, formData)
  const { data, error } = await supabase.from(t).insert([payload]).select('id').single()
  if (error) throw new Error(error.message)

  if (t === HR_TABLES.staff && data?.id) {
    await ensureStaffIdentityContract({
      staff_id: data.id,
      email: payload.email,
      full_name: payload.full_name || payload.name,
      user_id: payload.user_id,
      source: 'identity.contract.auto_from_createHrRecord',
    })
  }
  await logHRActivity({ actor_user_id:user?.id, actor_label:user?.full_name || user?.email || user?.role, source_table:t, record_id:data?.id, action:'create', details:payload })
  revalidatePath('/hr')
  redirect(text(formData, '_redirect') || redirectByTable[t] || '/hr')
}

export async function updateHrRecord(formData: FormData) {
  const user = await actor()
  const supabase = await createClient()
  const t = table(formData)
  const id = text(formData, '_id')
  const payload = payloadFor(t, formData)
  const { error } = await supabase.from(t).update(payload).eq('id', id)
  if (error) throw new Error(error.message)
  await logHRActivity({ actor_user_id:user?.id, actor_label:user?.full_name || user?.email || user?.role, source_table:t, record_id:id, action:'update', details:payload })
  revalidatePath('/hr')
  redirect(text(formData, '_redirect') || redirectByTable[t] || '/hr')
}

export async function deleteHrRecord(formData: FormData) {
  const user = await requireRole(['ceo','manager','ops_admin','hr'])
  const supabase = await createClient()
  const t = table(formData)
  const id = text(formData, '_id')
  const { error } = await supabase.from(t).delete().eq('id', id)
  if (error) throw new Error(error.message)
  await logHRActivity({ actor_user_id:user?.id, actor_label:user?.full_name || user?.email || user?.role, source_table:t, record_id:id, action:'delete', details:{} })
  revalidatePath('/hr')
  redirect(text(formData, '_redirect') || redirectByTable[t] || '/hr')
}

export async function advanceHrStatus(formData: FormData) {
  const user = await actor()
  const supabase = await createClient()
  const t = table(formData)
  const id = text(formData, '_id')
  const status = text(formData, 'status')
  const field = text(formData, '_field') || 'status'
  const { error } = await supabase.from(t).update({ [field]: status }).eq('id', id)
  if (error) throw new Error(error.message)
  await logHRActivity({ actor_user_id:user?.id, actor_label:user?.full_name || user?.email || user?.role, source_table:t, record_id:id, action:'status_change', details:{ field, status } })
  revalidatePath('/hr')
  redirect(text(formData, '_redirect') || redirectByTable[t] || '/hr')
}

export async function addHrTask(formData: FormData) {
  formData.set('_table', HR_TABLES.tasks)
  return createHrRecord(formData)
}

export async function decideHrApproval(formData: FormData) {
  formData.set('_table', HR_TABLES.approvals)
  formData.set('_field', 'status')
  formData.set('decided_at', new Date().toISOString())
  return advanceHrStatus(formData)
}
