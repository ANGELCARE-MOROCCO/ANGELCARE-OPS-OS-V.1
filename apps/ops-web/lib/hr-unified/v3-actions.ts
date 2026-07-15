'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/getUser'

async function audit(action: string, entity_type: string, entity_id?: string, metadata: Record<string, any> = {}) {
  const supabase = await createClient()
  const user = await getCurrentUser()
  await supabase.from('hr_audit_logs').insert([{ actor_id: user?.id || null, action, entity_type, entity_id: entity_id || null, metadata }])
}

export async function createHRApproval(formData: FormData) {
  const supabase = await createClient()
  const payload = {
    title: String(formData.get('title') || ''),
    approval_type: String(formData.get('approval_type') || 'general'),
    entity_type: String(formData.get('entity_type') || 'hr'),
    entity_id: String(formData.get('entity_id') || '') || null,
    priority: String(formData.get('priority') || 'medium'),
    status: 'pending',
    requested_reason: String(formData.get('requested_reason') || ''),
    notes: String(formData.get('notes') || ''),
  }
  const { data, error } = await supabase.from('hr_approval_requests').insert([payload]).select('id').single()
  if (error) throw new Error(error.message)
  await audit('create_approval_request', 'hr_approval_requests', data?.id, payload)
  revalidatePath('/hr')
  revalidatePath('/hr/approvals')
}

export async function decideHRApproval(formData: FormData) {
  const supabase = await createClient()
  const user = await getCurrentUser()
  const id = String(formData.get('id') || '')
  const status = String(formData.get('status') || 'approved')
  const decision_notes = String(formData.get('decision_notes') || '')
  const { error } = await supabase.from('hr_approval_requests').update({
    status,
    decision_notes,
    decided_by: user?.id || null,
    decided_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }).eq('id', id)
  if (error) throw new Error(error.message)
  await audit(`approval_${status}`, 'hr_approval_requests', id, { decision_notes })
  revalidatePath('/hr/approvals')
  revalidatePath('/hr')
}

export async function createHRNotification(formData: FormData) {
  const supabase = await createClient()
  const payload = {
    title: String(formData.get('title') || ''),
    channel: String(formData.get('channel') || 'internal'),
    audience: String(formData.get('audience') || 'hr'),
    severity: String(formData.get('severity') || 'info'),
    message: String(formData.get('message') || ''),
    status: String(formData.get('status') || 'draft'),
  }
  const { data, error } = await supabase.from('hr_notifications').insert([payload]).select('id').single()
  if (error) throw new Error(error.message)
  await audit('create_notification', 'hr_notifications', data?.id, payload)
  revalidatePath('/hr/notifications')
}

export async function updateHRTaskStatus(formData: FormData) {
  const supabase = await createClient()
  const id = String(formData.get('id') || '')
  const status = String(formData.get('status') || 'open')
  const { error } = await supabase.from('hr_execution_tasks').update({
    status,
    stage: status,
    completed_at: status === 'completed' ? new Date().toISOString() : null,
    updated_at: new Date().toISOString(),
  }).eq('id', id)
  if (error) throw new Error(error.message)
  await audit('update_task_status', 'hr_execution_tasks', id, { status })
  revalidatePath('/hr')
}

export async function createHRReportSnapshot(formData: FormData) {
  const supabase = await createClient()
  const payload = {
    title: String(formData.get('title') || 'HR Executive Snapshot'),
    report_type: String(formData.get('report_type') || 'executive'),
    period_label: String(formData.get('period_label') || ''),
    status: 'generated',
    payload: {
      summary: String(formData.get('summary') || ''),
      focus: String(formData.get('focus') || ''),
    },
  }
  const { data, error } = await supabase.from('hr_report_snapshots').insert([payload]).select('id').single()
  if (error) throw new Error(error.message)
  await audit('create_report_snapshot', 'hr_report_snapshots', data?.id, payload)
  revalidatePath('/hr/reports')
}
