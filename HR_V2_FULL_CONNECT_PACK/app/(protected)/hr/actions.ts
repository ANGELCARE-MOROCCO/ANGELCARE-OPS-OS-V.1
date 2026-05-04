'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/getUser'

function clean(v: FormDataEntryValue | null) {
  const s = String(v || '').trim()
  return s.length ? s : null
}

async function currentActor() {
  const user = await getCurrentUser()
  return user?.id || null
}

export async function createHRMemo(formData: FormData) {
  const supabase = await createClient()
  const actor = await currentActor()
  const title = clean(formData.get('title')) || 'Management memo'
  const message = clean(formData.get('message'))
  const target = clean(formData.get('target_user_id'))
  const type = clean(formData.get('type')) || 'memo'
  if (!message) throw new Error('Memo message is required.')
  await supabase.from('hr_staff_notifications').insert({ title, message, type, user_id: target, created_by: actor, status: 'active', metadata: { source: 'hr_v2' } })
  revalidatePath('/hr')
  revalidatePath('/staff-home')
}

export async function createHRRosterShift(formData: FormData) {
  const supabase = await createClient()
  const actor = await currentActor()
  const user_id = clean(formData.get('user_id'))
  const shift_date = clean(formData.get('shift_date'))
  const start_time = clean(formData.get('start_time')) || '10:00'
  const end_time = clean(formData.get('end_time')) || '18:00'
  const role = clean(formData.get('role')) || 'Duty shift'
  const location = clean(formData.get('location')) || 'AngelCare Operations Center'
  if (!user_id || !shift_date) throw new Error('Staff and date are required.')
  await supabase.from('hr_rosters').insert({ user_id, shift_date, start_time, end_time, role, location, status: 'scheduled', created_by: actor })
  revalidatePath('/hr')
  revalidatePath('/staff-home')
}

export async function createHRLeaveRequest(formData: FormData) {
  const supabase = await createClient()
  const actor = await currentActor()
  const user_id = clean(formData.get('user_id')) || actor
  const start_date = clean(formData.get('start_date'))
  const end_date = clean(formData.get('end_date'))
  const reason = clean(formData.get('reason')) || 'Leave request'
  if (!user_id || !start_date || !end_date) throw new Error('Staff, start date and end date are required.')
  await supabase.from('hr_leave_requests').insert({ user_id, start_date, end_date, reason, status: 'pending', created_by: actor })
  revalidatePath('/hr')
  revalidatePath('/staff-home')
}

export async function approveHRRequest(formData: FormData) {
  const supabase = await createClient()
  const id = clean(formData.get('id'))
  const table = clean(formData.get('table')) || 'hr_leave_requests'
  const status = clean(formData.get('status')) || 'approved'
  if (!id) throw new Error('Missing request id.')
  await supabase.from(table).update({ status, reviewed_at: new Date().toISOString(), reviewed_by: await currentActor() }).eq('id', id)
  revalidatePath('/hr')
  revalidatePath('/staff-home')
}

export async function createHRProfile(formData: FormData) {
  const supabase = await createClient()
  const user_id = clean(formData.get('user_id'))
  const position = clean(formData.get('position'))
  const department = clean(formData.get('department'))
  const contract_type = clean(formData.get('contract_type')) || 'CDI / permanent'
  if (!user_id || !position || !department) throw new Error('Staff, position and department are required.')
  const payload = { user_id, position, department, contract_type, status: 'active', updated_at: new Date().toISOString() }
  const existing = await supabase.from('hr_staff_profiles').select('id').eq('user_id', user_id).maybeSingle()
  if (existing.data?.id) await supabase.from('hr_staff_profiles').update(payload).eq('id', existing.data.id)
  else await supabase.from('hr_staff_profiles').insert(payload)
  revalidatePath('/hr')
  revalidatePath('/staff-home')
}
