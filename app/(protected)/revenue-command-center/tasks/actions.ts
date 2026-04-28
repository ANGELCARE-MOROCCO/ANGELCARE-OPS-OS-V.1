'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { requireRole } from '@/lib/auth/session'

function value(formData: FormData, key: string) {
  const v = formData.get(key)
  return typeof v === 'string' && v.trim() ? v.trim() : null
}

function dateTimeOrNull(date?: string | null, time?: string | null) {
  if (!date) return null
  return new Date(`${date}T${time || '09:00'}:00`).toISOString()
}

export async function createTaskAction(formData: FormData) {
  const actor = await requireRole(['ceo', 'manager', 'agent'])
  const supabase = await createClient()

  const title = value(formData, 'title')
  if (!title) throw new Error('Titre obligatoire')

  const startAt = dateTimeOrNull(value(formData, 'start_date'), value(formData, 'start_time'))
  const endAt = dateTimeOrNull(value(formData, 'end_date'), value(formData, 'end_time'))

  const payload = {
    title,
    description: value(formData, 'description'),
    status: value(formData, 'status') || 'open',
    priority: value(formData, 'priority') || 'medium',
    assigned_to: value(formData, 'assigned_to'),
    created_by: actor.id,
    linked_entity_type: value(formData, 'linked_entity_type'),
    linked_entity_id: value(formData, 'linked_entity_id'),
    linked_entity_label: value(formData, 'linked_entity_label'),
    start_at: startAt,
    end_at: endAt,
    notify_assignee: formData.get('notify_assignee') === 'on',
  }

  const { data, error } = await supabase.from('bd_tasks').insert([payload]).select('id').single()
  if (error) throw new Error(error.message)

  await supabase.from('bd_task_activity_logs').insert([{ task_id: data.id, actor_user_id: actor.id, action: 'task_created', details: payload }])

  revalidatePath('/revenue-command-center/tasks')
  redirect(`/revenue-command-center/tasks/${data.id}`)
}

export async function updateTaskStatusAction(formData: FormData) {
  const actor = await requireRole(['ceo', 'manager', 'agent'])
  const supabase = await createClient()
  const taskId = value(formData, 'task_id')
  const status = value(formData, 'status') || 'open'
  if (!taskId) throw new Error('Task id missing')

  const payload: Record<string, string | null> = { status, updated_at: new Date().toISOString() }
  if (status === 'completed') payload.completed_at = new Date().toISOString()

  const { error } = await supabase.from('bd_tasks').update(payload).eq('id', taskId)
  if (error) throw new Error(error.message)

  await supabase.from('bd_task_activity_logs').insert([{ task_id: taskId, actor_user_id: actor.id, action: 'status_updated', details: { status } }])

  revalidatePath(`/revenue-command-center/tasks/${taskId}`)
  revalidatePath('/revenue-command-center/tasks')
}

export async function addTaskCommentAction(formData: FormData) {
  const actor = await requireRole(['ceo', 'manager', 'agent'])
  const supabase = await createClient()
  const taskId = value(formData, 'task_id')
  const comment = value(formData, 'comment')
  if (!taskId || !comment) throw new Error('Commentaire obligatoire')

  const { error } = await supabase.from('bd_task_comments').insert([{ task_id: taskId, author_user_id: actor.id, comment }])
  if (error) throw new Error(error.message)

  await supabase.from('bd_task_activity_logs').insert([{ task_id: taskId, actor_user_id: actor.id, action: 'comment_added', details: { comment } }])
  revalidatePath(`/revenue-command-center/tasks/${taskId}`)
}

export async function addChecklistItemAction(formData: FormData) {
  const actor = await requireRole(['ceo', 'manager', 'agent'])
  const supabase = await createClient()
  const taskId = value(formData, 'task_id')
  const label = value(formData, 'label')
  if (!taskId || !label) throw new Error('Checklist item missing')

  const { error } = await supabase.from('bd_task_checklist_items').insert([{ task_id: taskId, label, created_by: actor.id }])
  if (error) throw new Error(error.message)
  revalidatePath(`/revenue-command-center/tasks/${taskId}`)
}

export async function toggleChecklistItemAction(formData: FormData) {
  await requireRole(['ceo', 'manager', 'agent'])
  const supabase = await createClient()
  const itemId = value(formData, 'item_id')
  const taskId = value(formData, 'task_id')
  const isDone = formData.get('is_done') === 'true'
  if (!itemId || !taskId) throw new Error('Checklist id missing')

  const { error } = await supabase
    .from('bd_task_checklist_items')
    .update({ is_done: !isDone, completed_at: !isDone ? new Date().toISOString() : null })
    .eq('id', itemId)

  if (error) throw new Error(error.message)
  revalidatePath(`/revenue-command-center/tasks/${taskId}`)
}
