import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { HR_TABLES, getHRDashboardData, getHRRecord, getStaff360, logHRActivity } from '@/lib/hr-production/repository'

export type StaffWriteInput = Record<string, FormDataEntryValue | string | null | undefined>

function value(formData: FormData, key: string) {
  const v = formData.get(key)
  if (v === null || v === undefined) return null
  const s = String(v).trim()
  return s.length ? s : null
}

export function staffPayload(formData: FormData) {
  return {
    full_name: value(formData, 'full_name'),
    email: value(formData, 'email'),
    phone: value(formData, 'phone'),
    city: value(formData, 'city'),
    department: value(formData, 'department'),
    position: value(formData, 'position'),
    employment_status: value(formData, 'employment_status') || 'active',
    contract_type: value(formData, 'contract_type') || 'standard',
    manager_id: value(formData, 'manager_id'),
    user_id: value(formData, 'user_id'),
    hire_date: value(formData, 'hire_date'),
    skills: value(formData, 'skills'),
    emergency_contact: value(formData, 'emergency_contact'),
    notes: value(formData, 'notes'),
    updated_at: new Date().toISOString(),
  }
}

export async function createStaffAction(formData: FormData) {
  'use server'
  const supabase = await createClient()
  const payload = { ...staffPayload(formData), created_at: new Date().toISOString() }
  const { data, error } = await supabase.from(HR_TABLES.staff).insert(payload).select('id').single()
  if (error) throw new Error(error.message)
  await logHRActivity({ action: 'staff.created', source_table: HR_TABLES.staff, record_id: data.id, entity_type: 'staff', entity_id: data.id, payload })
  revalidatePath('/hr/staff')
  redirect(`/hr/staff/${data.id}`)
}

export async function updateStaffAction(id: string, formData: FormData) {
  'use server'
  const supabase = await createClient()
  const before = await getHRRecord(HR_TABLES.staff, id)
  const payload = staffPayload(formData)
  const { error } = await supabase.from(HR_TABLES.staff).update(payload).eq('id', id)
  if (error) throw new Error(error.message)
  await logHRActivity({ action: 'staff.updated', source_table: HR_TABLES.staff, record_id: id, entity_type: 'staff', entity_id: id, before, after: payload })
  revalidatePath('/hr/staff')
  revalidatePath(`/hr/staff/${id}`)
  redirect(`/hr/staff/${id}`)
}

export async function archiveStaffAction(id: string) {
  'use server'
  const supabase = await createClient()
  const before = await getHRRecord(HR_TABLES.staff, id)
  const payload = { employment_status: 'archived', archived_at: new Date().toISOString(), updated_at: new Date().toISOString() }
  const { error } = await supabase.from(HR_TABLES.staff).update(payload).eq('id', id)
  if (error) throw new Error(error.message)
  await logHRActivity({ action: 'staff.archived', source_table: HR_TABLES.staff, record_id: id, entity_type: 'staff', entity_id: id, before, after: payload })
  revalidatePath('/hr/staff')
  redirect('/hr/staff')
}

export async function restoreStaffAction(id: string) {
  'use server'
  const supabase = await createClient()
  const payload = { employment_status: 'active', archived_at: null, updated_at: new Date().toISOString() }
  const { error } = await supabase.from(HR_TABLES.staff).update(payload).eq('id', id)
  if (error) throw new Error(error.message)
  await logHRActivity({ action: 'staff.restored', source_table: HR_TABLES.staff, record_id: id, entity_type: 'staff', entity_id: id, after: payload })
  revalidatePath('/hr/staff')
  revalidatePath(`/hr/staff/${id}`)
  redirect(`/hr/staff/${id}`)
}

export async function addStaffNoteAction(id: string, formData: FormData) {
  'use server'
  const supabase = await createClient()
  const note = value(formData, 'note')
  if (!note) return
  const payload = { action: 'staff.note', entity_type: 'staff', entity_id: id, record_id: id, source_table: HR_TABLES.staff, payload: { note }, created_at: new Date().toISOString() }
  try { await supabase.from(HR_TABLES.activity).insert(payload) } catch {}
  await logHRActivity(payload)
  revalidatePath(`/hr/staff/${id}`)
}

export async function getStaffCommandData() {
  const data = await getHRDashboardData()
  const staff = Array.isArray(data.staff) ? data.staff : []
  const active = staff.filter((x: any) => String(x.employment_status || x.status || 'active').toLowerCase() === 'active')
  const archived = staff.filter((x: any) => String(x.employment_status || x.status || '').toLowerCase().includes('archiv'))
  const documents = Array.isArray(data.documents) ? data.documents : []
  const attendance = Array.isArray(data.attendance) ? data.attendance : []
  const contracts = Array.isArray(data.contracts) ? data.contracts : []
  return { data, staff, active, archived, documents, attendance, contracts }
}

export { getStaff360 }
