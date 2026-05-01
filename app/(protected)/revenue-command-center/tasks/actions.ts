'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/getUser'

function clean(value: FormDataEntryValue | null) {
  const text = String(value || '').trim()
  return text.length ? text : null
}

async function logTask(supabase: any, taskId: string, action: string, note?: string | null, actor?: string | null) {
  await supabase.from('bd_activity_logs').insert({
    entity_type: 'task',
    entity_id: taskId,
    action,
    note,
    actor_user_id: actor || null,
  })
}

export async function updateTaskStatus(formData: FormData) {
  const supabase = await createClient()
  const user = await getCurrentUser()
  const taskId = clean(formData.get('task_id'))
  const status = clean(formData.get('status'))
  if (!taskId || !status) throw new Error('Missing task or status.')

  const payload: Record<string, any> = { status, updated_at: new Date().toISOString() }
  if (status === 'in_progress') payload.actual_start_at = new Date().toISOString()
  if (status === 'completed') payload.actual_end_at = new Date().toISOString()

  const { error } = await supabase.from('bd_tasks').update(payload).eq('id', taskId)
  if (error) throw new Error(error.message)

  await logTask(supabase, taskId, 'status_updated', status, user?.id || null)
  revalidatePath(`/revenue-command-center/tasks/${taskId}`)
}

export async function addTaskChecklistItem(formData: FormData) {
  const supabase = await createClient()
  const user = await getCurrentUser()
  const taskId = clean(formData.get('task_id'))
  const title = clean(formData.get('title'))
  if (!taskId || !title) throw new Error('Missing task or checklist title.')

  const { error } = await supabase.from('bd_task_checklists').insert({ task_id: taskId, title })
  if (error) throw new Error(error.message)

  await logTask(supabase, taskId, 'checklist_added', title, user?.id || null)
  revalidatePath(`/revenue-command-center/tasks/${taskId}`)
}

export async function toggleTaskChecklistItem(formData: FormData) {
  const supabase = await createClient()
  const taskId = clean(formData.get('task_id'))
  const itemId = clean(formData.get('item_id'))
  const isDone = clean(formData.get('is_done')) === 'true'
  if (!taskId || !itemId) throw new Error('Missing checklist item.')

  const { error } = await supabase.from('bd_task_checklists').update({
    is_done: !isDone,
    updated_at: new Date().toISOString(),
  }).eq('id', itemId)

  if (error) throw new Error(error.message)
  revalidatePath(`/revenue-command-center/tasks/${taskId}`)
}

export async function addTaskComment(formData: FormData) {
  const supabase = await createClient()
  const user = await getCurrentUser()
  const taskId = clean(formData.get('task_id'))
  const comment = clean(formData.get('comment'))
  if (!taskId || !comment) throw new Error('Missing task or comment.')

  const { error } = await supabase.from('bd_task_comments').insert({ task_id: taskId, user_id: user?.id || null, comment })
  if (error) throw new Error(error.message)

  await logTask(supabase, taskId, 'comment_added', comment, user?.id || null)
  revalidatePath(`/revenue-command-center/tasks/${taskId}`)
}

export async function escalateTask(formData: FormData) {
  const supabase = await createClient()
  const user = await getCurrentUser()
  const taskId = clean(formData.get('task_id'))
  const blocker = clean(formData.get('blocker'))
  if (!taskId) throw new Error('Missing task.')

  const { data: task } = await supabase.from('bd_tasks').select('escalation_level').eq('id', taskId).maybeSingle()
  const level = Number(task?.escalation_level || 0) + 1

  const { error } = await supabase.from('bd_tasks').update({
    escalation_level: level,
    blocker,
    priority: 'critical',
    updated_at: new Date().toISOString(),
  }).eq('id', taskId)

  if (error) throw new Error(error.message)
  await logTask(supabase, taskId, 'task_escalated', blocker || `Escalation level ${level}`, user?.id || null)
  revalidatePath(`/revenue-command-center/tasks/${taskId}`)
}
