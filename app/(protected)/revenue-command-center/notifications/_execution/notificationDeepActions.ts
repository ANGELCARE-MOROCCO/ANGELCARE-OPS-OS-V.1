'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

function clean(v: FormDataEntryValue | null): string | null {
  const value = String(v || '').trim()
  return value || null
}

function requireId(id: string | null): string {
  if (!id) {
    throw new Error('Notification id is required')
  }
  return id
}

async function logEvent(
  supabase: any,
  id: string,
  type: string,
  note?: string | null
) {
  await supabase.from('bd_notification_events').insert({
    notification_id: id,
    event_type: type,
    note: note || null,
  })
}

export async function assignNotification(formData: FormData) {
  const supabase = await createClient()
  const id = requireId(clean(formData.get('id')))
  const owner = clean(formData.get('owner_id'))

  const { error } = await supabase
    .from('bd_notifications')
    .update({ owner_id: owner })
    .eq('id', id)

  if (error) {
    throw new Error(error.message)
  }

  await logEvent(supabase, id, 'assigned')
  revalidatePath('/revenue-command-center/notifications')
}

export async function snoozeNotification(formData: FormData) {
  const supabase = await createClient()
  const id = requireId(clean(formData.get('id')))
  const hours = Number(clean(formData.get('hours')) || 24)
  const safeHours = Number.isFinite(hours) && hours > 0 ? hours : 24
  const until = new Date(Date.now() + safeHours * 3600000).toISOString()

  const { error } = await supabase
    .from('bd_notifications')
    .update({ snoozed_until: until })
    .eq('id', id)

  if (error) {
    throw new Error(error.message)
  }

  await logEvent(supabase, id, 'snoozed', `+${safeHours}h`)
  revalidatePath('/revenue-command-center/notifications')
}

export async function convertNotificationToTask(formData: FormData) {
  const supabase = await createClient()
  const id = requireId(clean(formData.get('id')))
  const title = clean(formData.get('title')) || 'Task from notification'

  const { data: notif, error: notifError } = await supabase
    .from('bd_notifications')
    .select('*')
    .eq('id', id)
    .maybeSingle()

  if (notifError) {
    throw new Error(notifError.message)
  }

  const { data: task, error: taskError } = await supabase
    .from('bd_tasks')
    .insert({
      title,
      related_type: notif?.related_type || 'notification',
      related_id: notif?.related_id || id,
      status: 'open',
    })
    .select('id')
    .single()

  if (taskError) {
    throw new Error(taskError.message)
  }

  const { error: updateError } = await supabase
    .from('bd_notifications')
    .update({ status: 'acted' })
    .eq('id', id)

  if (updateError) {
    throw new Error(updateError.message)
  }

  await logEvent(supabase, id, 'converted_to_task', task?.id || null)
  revalidatePath('/revenue-command-center/notifications')
  revalidatePath('/revenue-command-center/tasks')
}

export async function resolveNotification(formData: FormData) {
  const supabase = await createClient()
  const id = requireId(clean(formData.get('id')))

  const { error } = await supabase
    .from('bd_notifications')
    .update({ status: 'resolved' })
    .eq('id', id)

  if (error) {
    throw new Error(error.message)
  }

  await logEvent(supabase, id, 'resolved')
  revalidatePath('/revenue-command-center/notifications')
}