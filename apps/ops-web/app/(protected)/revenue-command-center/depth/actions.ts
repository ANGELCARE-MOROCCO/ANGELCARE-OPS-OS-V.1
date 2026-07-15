'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/getUser'

function clean(value: FormDataEntryValue | null) {
  const text = String(value || '').trim()
  return text.length ? text : null
}

export async function addChecklistItem(formData: FormData) {
  const supabase = await createClient()
  const user = await getCurrentUser()
  const taskId = clean(formData.get('task_id'))
  const title = clean(formData.get('title'))
  if (!taskId || !title) throw new Error('Missing task or checklist title')

  const { error } = await supabase.from('bd_task_checklists').insert({ task_id: taskId, title })
  if (error) throw new Error(error.message)

  await supabase.from('bd_activity_logs').insert({
    entity_type: 'task',
    entity_id: taskId,
    action: 'checklist_added',
    note: title,
    actor_user_id: user?.id || null,
  })

  revalidatePath(`/revenue-command-center/tasks/${taskId}/depth`)
}

export async function toggleChecklistItem(formData: FormData) {
  const supabase = await createClient()
  const taskId = clean(formData.get('task_id'))
  const itemId = clean(formData.get('item_id'))
  const isDone = clean(formData.get('is_done')) === 'true'
  if (!taskId || !itemId) throw new Error('Missing checklist item')

  const { error } = await supabase
    .from('bd_task_checklists')
    .update({ is_done: !isDone, updated_at: new Date().toISOString() })
    .eq('id', itemId)

  if (error) throw new Error(error.message)
  revalidatePath(`/revenue-command-center/tasks/${taskId}/depth`)
}

export async function addWatcher(formData: FormData) {
  const supabase = await createClient()
  const user = await getCurrentUser()
  const taskId = clean(formData.get('task_id'))
  const userId = clean(formData.get('user_id'))
  if (!taskId || !userId) throw new Error('Missing task or user')

  const { error } = await supabase.from('bd_task_watchers').insert({ task_id: taskId, user_id: userId })
  if (error) throw new Error(error.message)

  await supabase.from('bd_activity_logs').insert({
    entity_type: 'task',
    entity_id: taskId,
    action: 'watcher_added',
    note: userId,
    actor_user_id: user?.id || null,
  })

  revalidatePath(`/revenue-command-center/tasks/${taskId}/depth`)
}

export async function addDeepComment(formData: FormData) {
  const supabase = await createClient()
  const user = await getCurrentUser()
  const taskId = clean(formData.get('task_id'))
  const comment = clean(formData.get('comment'))
  if (!taskId || !comment) throw new Error('Missing task or comment')

  const { error } = await supabase.from('bd_task_comments').insert({
    task_id: taskId,
    user_id: user?.id || null,
    comment,
  })
  if (error) throw new Error(error.message)

  await supabase.from('bd_activity_logs').insert({
    entity_type: 'task',
    entity_id: taskId,
    action: 'comment_added',
    note: comment,
    actor_user_id: user?.id || null,
  })

  revalidatePath(`/revenue-command-center/tasks/${taskId}/depth`)
}
