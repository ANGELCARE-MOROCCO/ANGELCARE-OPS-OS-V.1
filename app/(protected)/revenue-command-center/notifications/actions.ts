'use server'

import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/getUser'
import { revalidatePath } from 'next/cache'
import { buildNotificationCandidates } from '@/lib/notificationCommandEngine'

function clean(v: FormDataEntryValue | null) {
  return String(v || '').trim() || null
}

export async function generateNotifications() {
  const supabase = await createClient()
  const user = await getCurrentUser()

  const [{ data: tasks }, { data: prospects }, { data: followups }, { data: insights }, { data: interventions }, { data: activationEvents }] = await Promise.all([
    supabase.from('bd_tasks').select('*'),
    supabase.from('bd_prospects').select('*'),
    supabase.from('bd_followups').select('*'),
    supabase.from('bd_decision_insights').select('*'),
    supabase.from('bd_manager_interventions').select('*'),
    supabase.from('bd_activation_events').select('*').order('created_at', { ascending: false }).limit(50),
  ])

  const candidates = buildNotificationCandidates({
    tasks: tasks || [],
    prospects: prospects || [],
    followups: followups || [],
    insights: insights || [],
    interventions: interventions || [],
    activationEvents: activationEvents || [],
  })

  let created = 0
  let critical = 0
  let warning = 0

  for (const item of candidates) {
    const { data: existing } = await supabase
      .from('bd_notifications')
      .select('id')
      .eq('notification_type', item.notification_type)
      .eq('related_type', item.related_type || '')
      .eq('related_id', item.related_id || '')
      .neq('status', 'resolved')
      .maybeSingle()

    if (existing?.id) continue

    const { error } = await supabase.from('bd_notifications').insert(item)
    if (!error) {
      created++
      if (item.severity === 'critical') critical++
      if (item.severity === 'warning') warning++
    }
  }

  await supabase.from('bd_notification_digest_runs').insert({
    generated_by: user?.id || null,
    notifications_scanned: candidates.length,
    notifications_created: created,
    critical_created: critical,
    warning_created: warning,
  })

  revalidatePath('/revenue-command-center/notifications')
}

export async function markNotificationRead(formData: FormData) {
  const supabase = await createClient()
  const user = await getCurrentUser()
  const id = clean(formData.get('id'))
  if (!id) throw new Error('Missing notification id.')

  await supabase.from('bd_notifications').update({
    status: 'read',
    read_at: new Date().toISOString(),
  }).eq('id', id)

  await supabase.from('bd_notification_actions').insert({
    notification_id: id,
    action_type: 'read',
    actor_user_id: user?.id || null,
  })

  revalidatePath('/revenue-command-center/notifications')
}

export async function markNotificationActed(formData: FormData) {
  const supabase = await createClient()
  const user = await getCurrentUser()
  const id = clean(formData.get('id'))
  const note = clean(formData.get('note'))
  if (!id) throw new Error('Missing notification id.')

  await supabase.from('bd_notifications').update({
    status: 'acted',
    acted_at: new Date().toISOString(),
  }).eq('id', id)

  await supabase.from('bd_notification_actions').insert({
    notification_id: id,
    action_type: 'acted',
    actor_user_id: user?.id || null,
    note,
  })

  revalidatePath('/revenue-command-center/notifications')
}

export async function resolveNotification(formData: FormData) {
  const supabase = await createClient()
  const user = await getCurrentUser()
  const id = clean(formData.get('id'))
  if (!id) throw new Error('Missing notification id.')

  await supabase.from('bd_notifications').update({
    status: 'resolved',
    resolved_at: new Date().toISOString(),
  }).eq('id', id)

  await supabase.from('bd_notification_actions').insert({
    notification_id: id,
    action_type: 'resolved',
    actor_user_id: user?.id || null,
  })

  revalidatePath('/revenue-command-center/notifications')
}

export async function createManualNotification(formData: FormData) {
  const supabase = await createClient()
  const title = clean(formData.get('title'))
  const message = clean(formData.get('message'))
  const severity = clean(formData.get('severity')) || 'info'
  const recipient = clean(formData.get('recipient_user_id'))
  const actionUrl = clean(formData.get('action_url'))

  if (!title) throw new Error('Missing title.')

  const impact = severity === 'critical' ? 90 : severity === 'warning' ? 70 : 45

  await supabase.from('bd_notifications').insert({
    title,
    message,
    severity,
    impact_score: impact,
    recipient_user_id: recipient,
    action_url: actionUrl,
    action_label: actionUrl ? 'Open Context' : 'Review',
    notification_type: 'manual',
    source: 'manager_manual',
  })

  revalidatePath('/revenue-command-center/notifications')
}
