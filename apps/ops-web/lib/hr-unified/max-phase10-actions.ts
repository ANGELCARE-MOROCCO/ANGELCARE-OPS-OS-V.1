'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/getUser'

function s(formData: FormData, key: string, fallback = ''): string {
  return String(formData.get(key) || fallback)
}

function nullable(formData: FormData, key: string): string | null {
  const value = String(formData.get(key) || '').trim()
  return value || null
}

async function writeAudit(action: string, entityType: string, entityId: string | null, metadata: Record<string, unknown>) {
  const supabase = await createClient()
  const user = await getCurrentUser()
  await supabase.from('hr_audit_logs').insert([
    {
      actor_id: user?.id || null,
      action,
      entity_type: entityType,
      entity_id: entityId,
      status: 'ok',
      metadata,
    },
  ])
}

async function writeSyncEvent(eventType: string, status: string, summary: string, metadata: Record<string, unknown>) {
  const supabase = await createClient()
  await supabase.from('hr_sync_events').insert([
    {
      event_type: eventType,
      status,
      summary,
      metadata,
    },
  ])
}

export async function createHRRecordLinkPhase10(formData: FormData) {
  const supabase = await createClient()
  const payload = {
    source_table: s(formData, 'source_table'),
    source_id: nullable(formData, 'source_id'),
    target_table: s(formData, 'target_table'),
    target_id: nullable(formData, 'target_id'),
    link_type: s(formData, 'link_type', 'related'),
    status: s(formData, 'status', 'active'),
    notes: s(formData, 'notes'),
  }

  const { data, error } = await supabase.from('hr_record_links').insert([payload]).select('id').single()
  if (error) throw new Error(error.message)

  await writeAudit('create_record_link_phase10', 'hr_record_links', data?.id || null, payload)
  await writeSyncEvent('record_link_created', 'ok', 'HR record link created', payload)

  revalidatePath('/hr/sync-center')
  revalidatePath('/hr/linked-records')
}

export async function createHRDataQualityCheckPhase10(formData: FormData) {
  const supabase = await createClient()
  const payload = {
    title: s(formData, 'title'),
    check_type: s(formData, 'check_type', 'data_integrity'),
    entity_table: s(formData, 'entity_table', 'hr'),
    entity_id: nullable(formData, 'entity_id'),
    severity: s(formData, 'severity', 'medium'),
    status: s(formData, 'status', 'open'),
    finding: s(formData, 'finding'),
    recommended_fix: s(formData, 'recommended_fix'),
    notes: s(formData, 'notes'),
  }

  const { data, error } = await supabase.from('hr_data_quality_checks').insert([payload]).select('id').single()
  if (error) throw new Error(error.message)

  await writeAudit('create_quality_check_phase10', 'hr_data_quality_checks', data?.id || null, payload)
  await writeSyncEvent('quality_check_created', 'review', 'HR data quality check created', payload)

  revalidatePath('/hr/data-quality')
  revalidatePath('/hr/sync-center')
}

export async function updateHRDataQualityStatusPhase10(formData: FormData) {
  const supabase = await createClient()
  const id = s(formData, 'id')
  const status = s(formData, 'status', 'resolved')

  const { error } = await supabase
    .from('hr_data_quality_checks')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', id)

  if (error) throw new Error(error.message)

  await writeAudit('update_quality_status_phase10', 'hr_data_quality_checks', id, { status })
  await writeSyncEvent('quality_status_updated', 'ok', 'HR data quality status updated', { id, status })

  revalidatePath('/hr/data-quality')
  revalidatePath('/hr/sync-center')
}

export async function createLinkedHRTaskPhase10(formData: FormData) {
  const supabase = await createClient()
  const taskPayload = {
    title: s(formData, 'title'),
    task_type: s(formData, 'task_type', 'linked_followup'),
    module_area: s(formData, 'module_area', 'sync'),
    priority: s(formData, 'priority', 'medium'),
    stage: 'open',
    status: 'open',
    related_staff_id: nullable(formData, 'related_staff_id'),
    related_candidate_id: nullable(formData, 'related_candidate_id'),
    related_opening_id: nullable(formData, 'related_opening_id'),
    description: s(formData, 'description'),
    notes: s(formData, 'notes'),
  }

  const { data, error } = await supabase.from('hr_execution_tasks').insert([taskPayload]).select('id').single()
  if (error) throw new Error(error.message)

  const taskId = data?.id || null
  const linkSourceTable = s(formData, 'source_table', 'hr_execution_tasks')
  const linkSourceId = nullable(formData, 'source_id')

  if (taskId && linkSourceId) {
    await supabase.from('hr_record_links').insert([
      {
        source_table: linkSourceTable,
        source_id: linkSourceId,
        target_table: 'hr_execution_tasks',
        target_id: taskId,
        link_type: 'followup_task',
        status: 'active',
        notes: 'Linked task created from Phase 10 sync center',
      },
    ])
  }

  await writeAudit('create_linked_task_phase10', 'hr_execution_tasks', taskId, taskPayload)
  await writeSyncEvent('linked_task_created', 'ok', 'Linked HR task created', { taskId, linkSourceTable, linkSourceId })

  revalidatePath('/hr/sync-center')
  revalidatePath('/hr/tasks')
}
