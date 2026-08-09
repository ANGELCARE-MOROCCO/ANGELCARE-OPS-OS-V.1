'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/getUser'

function s(fd: FormData, key: string, fallback = ''): string {
  return String(fd.get(key) || fallback)
}

function nullable(fd: FormData, key: string): string | null {
  const value = String(fd.get(key) || '').trim()
  return value || null
}

async function audit(action: string, entityType: string, entityId: string | null, metadata: Record<string, unknown>) {
  const supabase = await createClient()
  const user = await getCurrentUser()
  await supabase.from('hr_audit_logs').insert([
    { actor_id: user?.id || null, action, entity_type: entityType, entity_id: entityId, metadata },
  ])
}

export async function createDailyOperationPhase7(formData: FormData) {
  const supabase = await createClient()
  const payload = {
    title: s(formData, 'title'),
    ops_type: s(formData, 'ops_type', 'daily_review'),
    priority: s(formData, 'priority', 'medium'),
    status: s(formData, 'status', 'open'),
    owner: s(formData, 'owner'),
    related_route: s(formData, 'related_route', '/hr'),
    summary: s(formData, 'summary'),
    next_action: s(formData, 'next_action'),
    due_at: nullable(formData, 'due_at'),
    notes: s(formData, 'notes'),
  }

  const { data, error } = await supabase.from('hr_daily_operations').insert([payload]).select('id').single()
  if (error) throw new Error(error.message)

  await audit('create_daily_operation_phase7', 'hr_daily_operations', data?.id || null, payload)
  revalidatePath('/hr/daily-ops')
  revalidatePath('/hr/operations-console')
}

export async function updateDailyOperationStatusPhase7(formData: FormData) {
  const supabase = await createClient()
  const id = s(formData, 'id')
  const status = s(formData, 'status', 'completed')

  const { error } = await supabase
    .from('hr_daily_operations')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', id)

  if (error) throw new Error(error.message)

  await audit('update_daily_operation_status_phase7', 'hr_daily_operations', id, { status })
  revalidatePath('/hr/daily-ops')
  revalidatePath('/hr/operations-console')
}
