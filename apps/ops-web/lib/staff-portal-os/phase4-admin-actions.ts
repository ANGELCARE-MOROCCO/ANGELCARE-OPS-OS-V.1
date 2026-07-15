'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/getUser'

function s(formData: FormData, key: string, fallback = ''): string {
  const out = String(formData.get(key) || '').trim()
  return out || fallback
}

export async function updateStaffServiceRequestPhase4(formData: FormData) {
  const supabase = await createClient()
  const requestId = s(formData, 'request_id')
  const status = s(formData, 'status', 'in_progress')
  const response = s(formData, 'response')

  if (!requestId) throw new Error('Missing request id.')

  const { error } = await supabase
    .from('staff_service_requests')
    .update({
      status,
      response,
      updated_at: new Date().toISOString(),
    })
    .eq('id', requestId)

  if (error) throw new Error(error.message)

  revalidatePath('/staff-services/admin')
  revalidatePath('/staff-services')
}

export async function createStaffControlMemoPhase4(formData: FormData) {
  const supabase = await createClient()
  const user = await getCurrentUser()

  const payload = {
    title: s(formData, 'title'),
    body: s(formData, 'body'),
    memo_type: s(formData, 'memo_type', 'briefing'),
    severity: s(formData, 'severity', 'info'),
    source: s(formData, 'source', 'AngelCare Control Tower'),
    status: s(formData, 'status', 'active'),
    target_role: s(formData, 'target_role') || null,
    target_department: s(formData, 'target_department') || null,
    created_by: user?.id || null,
  }

  const { error } = await supabase.from('staff_control_memos').insert([payload])
  if (error) throw new Error(error.message)

  revalidatePath('/staff-memos')
  revalidatePath('/staff-services')
  revalidatePath('/staff-home')
}

export async function updateStaffMemoStatusPhase4(formData: FormData) {
  const supabase = await createClient()
  const memoId = s(formData, 'memo_id')
  const status = s(formData, 'status', 'active')

  if (!memoId) throw new Error('Missing memo id.')

  const { error } = await supabase
    .from('staff_control_memos')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', memoId)

  if (error) throw new Error(error.message)

  revalidatePath('/staff-memos')
  revalidatePath('/staff-home')
}
