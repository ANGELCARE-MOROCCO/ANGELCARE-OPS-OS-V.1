'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/getUser'

function clean(value: FormDataEntryValue | null) {
  const text = String(value || '').trim()
  return text.length ? text : null
}

export async function reassignTask(formData: FormData) {
  const supabase = await createClient()
  const user = await getCurrentUser()

  const taskId = clean(formData.get('task_id'))
  const assignedTo = clean(formData.get('assigned_to'))
  if (!taskId) throw new Error('Missing task id')

  const { error } = await supabase
    .from('bd_tasks')
    .update({ assigned_to: assignedTo, updated_at: new Date().toISOString() })
    .eq('id', taskId)

  if (error) throw new Error(error.message)

  await supabase.from('bd_activity_logs').insert({
    entity_type: 'task',
    entity_id: taskId,
    action: 'manager_reassign',
    note: `Task reassigned to ${assignedTo || 'unassigned'}`,
    actor_user_id: user?.id || null,
  })

  revalidatePath('/revenue-command-center/management')
  revalidatePath('/revenue-command-center/team-performance')
}

export async function pushPriority(formData: FormData) {
  const supabase = await createClient()
  const user = await getCurrentUser()

  const title = clean(formData.get('title'))
  const message = clean(formData.get('message'))
  const targetUserId = clean(formData.get('target_user_id'))
  const targetType = clean(formData.get('target_type'))
  const targetId = clean(formData.get('target_id'))
  const priority = clean(formData.get('priority')) || 'high'

  if (!title) throw new Error('Missing priority title')

  const { error } = await supabase.from('bd_priority_pushes').insert({
    title,
    message,
    target_user_id: targetUserId,
    target_type: targetType,
    target_id: targetId,
    priority,
    is_active: true,
  })

  if (error) throw new Error(error.message)

  await supabase.from('bd_activity_logs').insert({
    entity_type: targetType || 'priority',
    entity_id: targetId,
    action: 'manager_priority_push',
    note: title,
    actor_user_id: user?.id || null,
  })

  revalidatePath('/revenue-command-center/management')
}

export async function addManagerReview(formData: FormData) {
  const supabase = await createClient()
  const user = await getCurrentUser()

  const entityType = clean(formData.get('entity_type')) || 'general'
  const entityId = clean(formData.get('entity_id'))
  const decision = clean(formData.get('decision'))
  const note = clean(formData.get('note'))

  const { error } = await supabase.from('bd_manager_reviews').insert({
    entity_type: entityType,
    entity_id: entityId,
    manager_id: user?.id || null,
    decision,
    note,
  })

  if (error) throw new Error(error.message)

  revalidatePath('/revenue-command-center/management')
}
