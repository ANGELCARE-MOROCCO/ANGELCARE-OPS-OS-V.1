'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/getUser'

function clean(value: FormDataEntryValue | null) {
  const text = String(value || '').trim()
  return text.length ? text : null
}

function snoozeIso(hours: number) {
  return new Date(Date.now() + hours * 60 * 60 * 1000).toISOString()
}

async function logEvent(supabase: any, taskId: string, eventType: string, note?: string | null, outcome?: string | null, userId?: string | null, metadata: Record<string, any> = {}) {
  await supabase.from('bd_task_execution_events').insert({
    task_id: taskId,
    event_type: eventType,
    outcome,
    note,
    created_by: userId || null,
    metadata,
  })

  await supabase.from('bd_activity_logs').insert({
    entity_type: 'task',
    entity_id: taskId,
    action: eventType,
    note: note || outcome,
    actor_user_id: userId || null,
    metadata,
  })
}

export async function completeTaskWithOutcome(formData: FormData) {
  const supabase = await createClient()
  const user = await getCurrentUser()

  const taskId = clean(formData.get('task_id'))
  const outcome = clean(formData.get('outcome'))
  const note = clean(formData.get('note'))

  if (!taskId) throw new Error('Missing task id.')
  if (!outcome) throw new Error('Outcome is required before completing the task.')

  const { error } = await supabase.from('bd_tasks').update({
    status: 'completed',
    outcome,
    outcome_note: note,
    actual_end_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }).eq('id', taskId)

  if (error) throw new Error(error.message)

  await logEvent(supabase, taskId, 'task_completed_with_outcome', note, outcome, user?.id || null)
  revalidatePath(`/revenue-command-center/tasks/${taskId}`)
}

export async function markTaskBlocked(formData: FormData) {
  const supabase = await createClient()
  const user = await getCurrentUser()

  const taskId = clean(formData.get('task_id'))
  const blocker = clean(formData.get('blocker'))

  if (!taskId) throw new Error('Missing task id.')
  if (!blocker) throw new Error('Blocker reason is required.')

  const { error } = await supabase.from('bd_tasks').update({
    status: 'blocked',
    blocker,
    blocked_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }).eq('id', taskId)

  if (error) throw new Error(error.message)

  await logEvent(supabase, taskId, 'task_blocked', blocker, null, user?.id || null)
  revalidatePath(`/revenue-command-center/tasks/${taskId}`)
}

export async function snoozeTask(formData: FormData) {
  const supabase = await createClient()
  const user = await getCurrentUser()

  const taskId = clean(formData.get('task_id'))
  const hours = Number(clean(formData.get('hours')) || 24)

  if (!taskId) throw new Error('Missing task id.')

  const until = snoozeIso(hours)

  const { error } = await supabase.from('bd_tasks').update({
    snoozed_until: until,
    updated_at: new Date().toISOString(),
  }).eq('id', taskId)

  if (error) throw new Error(error.message)

  await logEvent(supabase, taskId, 'task_snoozed', `Snoozed for ${hours} hours`, null, user?.id || null, { hours, until })
  revalidatePath(`/revenue-command-center/tasks/${taskId}`)
}

export async function escalateTaskDeep(formData: FormData) {
  const supabase = await createClient()
  const user = await getCurrentUser()

  const taskId = clean(formData.get('task_id'))
  const reason = clean(formData.get('reason'))

  if (!taskId) throw new Error('Missing task id.')
  if (!reason) throw new Error('Escalation reason is required.')

  const { data: task } = await supabase.from('bd_tasks').select('escalation_level').eq('id', taskId).maybeSingle()
  const nextLevel = Number(task?.escalation_level || 0) + 1

  const { error } = await supabase.from('bd_tasks').update({
    escalation_level: nextLevel,
    escalation_reason: reason,
    priority: 'critical',
    updated_at: new Date().toISOString(),
  }).eq('id', taskId)

  if (error) throw new Error(error.message)

  await logEvent(supabase, taskId, 'task_escalated_deep', reason, null, user?.id || null, { escalation_level: nextLevel })
  revalidatePath(`/revenue-command-center/tasks/${taskId}`)
}

export async function convertTaskToFollowup(formData: FormData) {
  const supabase = await createClient()
  const user = await getCurrentUser()

  const taskId = clean(formData.get('task_id'))
  const title = clean(formData.get('title'))
  const dueAt = clean(formData.get('due_at'))

  if (!taskId) throw new Error('Missing task id.')

  const { data: task, error: taskError } = await supabase.from('bd_tasks').select('*').eq('id', taskId).maybeSingle()
  if (taskError) throw new Error(taskError.message)
  if (!task) throw new Error('Task not found.')

  const followupTitle = title || `Follow-up: ${task.title || 'Task'}`
  const due = dueAt ? new Date(dueAt).toISOString() : new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()

  const { data: followup, error } = await supabase.from('bd_followups').insert({
    title: followupTitle,
    related_type: task.related_type || 'task',
    related_id: task.related_id || task.id,
    owner_id: task.assigned_to || task.owner_id || user?.id || null,
    due_at: due,
    status: 'pending',
    priority: task.priority || 'medium',
  }).select('id').single()

  if (error) throw new Error(error.message)

  await supabase.from('bd_tasks').update({
    converted_followup_id: followup?.id || null,
    updated_at: new Date().toISOString(),
  }).eq('id', taskId)

  await logEvent(supabase, taskId, 'task_converted_to_followup', followupTitle, null, user?.id || null, { followup_id: followup?.id, due_at: due })
  revalidatePath(`/revenue-command-center/tasks/${taskId}`)
  revalidatePath('/revenue-command-center/follow-ups')
}
