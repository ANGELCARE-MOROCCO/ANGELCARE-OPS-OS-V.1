'use server'

import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/getUser'
import { revalidatePath } from 'next/cache'

function clean(v: FormDataEntryValue | null) {
  return String(v || '').trim() || null
}

function dueIso(hours: number) {
  return new Date(Date.now() + hours * 60 * 60 * 1000).toISOString()
}

async function logControl(supabase: any, actionType: string, relatedType?: string | null, relatedId?: string | null, note?: string | null, actor?: string | null, metadata: Record<string, any> = {}) {
  await supabase.from('bd_control_actions_log').insert({
    action_type: actionType,
    related_type: relatedType,
    related_id: relatedId,
    note,
    actor_user_id: actor || null,
    metadata,
  })
}

export async function createFixNowTask(formData: FormData) {
  const supabase = await createClient()
  const user = await getCurrentUser()

  const relatedType = clean(formData.get('related_type')) || 'control'
  const relatedId = clean(formData.get('related_id'))
  const title = clean(formData.get('title')) || 'Fix-now control action'
  const description = clean(formData.get('description'))
  const priority = clean(formData.get('priority')) || 'critical'
  const targetUserId = clean(formData.get('target_user_id')) || user?.id || null
  const dueHours = Number(clean(formData.get('due_hours')) || 24)
  const dueAt = dueIso(dueHours)

  const { error } = await supabase.from('bd_tasks').insert({
    title,
    description,
    status: 'open',
    priority,
    assigned_to: targetUserId,
    owner_id: user?.id || null,
    related_type: relatedType,
    related_id: relatedId,
    due_at: dueAt,
    planned_end_at: dueAt,
  })

  if (error) throw new Error(error.message)

  await logControl(supabase, 'fix_now_task_created', relatedType, relatedId, title, user?.id || null, { due_at: dueAt, priority })
  revalidatePath('/revenue-command-center/control-tower')
  revalidatePath('/revenue-command-center/system-activation')
  revalidatePath('/revenue-command-center/tasks')
}

export async function createFixNowFollowup(formData: FormData) {
  const supabase = await createClient()
  const user = await getCurrentUser()

  const relatedType = clean(formData.get('related_type')) || 'control'
  const relatedId = clean(formData.get('related_id'))
  const title = clean(formData.get('title')) || 'Fix-now follow-up'
  const priority = clean(formData.get('priority')) || 'critical'
  const targetUserId = clean(formData.get('target_user_id')) || user?.id || null
  const dueHours = Number(clean(formData.get('due_hours')) || 24)
  const dueAt = dueIso(dueHours)

  const { error } = await supabase.from('bd_followups').insert({
    title,
    related_type: relatedType,
    related_id: relatedId,
    owner_id: targetUserId,
    due_at: dueAt,
    status: 'pending',
    priority,
  })

  if (error) throw new Error(error.message)

  await logControl(supabase, 'fix_now_followup_created', relatedType, relatedId, title, user?.id || null, { due_at: dueAt, priority })
  revalidatePath('/revenue-command-center/control-tower')
  revalidatePath('/revenue-command-center/system-activation')
  revalidatePath('/revenue-command-center/follow-ups')
}

export async function createManagerOverride(formData: FormData) {
  const supabase = await createClient()
  const user = await getCurrentUser()

  const title = clean(formData.get('title'))
  const description = clean(formData.get('description'))
  const severity = clean(formData.get('severity')) || 'medium'
  const overrideType = clean(formData.get('override_type')) || 'manager_override'
  const relatedType = clean(formData.get('related_type'))
  const relatedId = clean(formData.get('related_id'))
  const targetUserId = clean(formData.get('target_user_id'))
  const dueAtRaw = clean(formData.get('due_at'))
  const dueAt = dueAtRaw ? new Date(dueAtRaw).toISOString() : null

  if (!title) throw new Error('Override title is required.')

  const { error } = await supabase.from('bd_manager_overrides').insert({
    title,
    description,
    severity,
    override_type: overrideType,
    related_type: relatedType,
    related_id: relatedId,
    target_user_id: targetUserId,
    created_by: user?.id || null,
    due_at: dueAt,
    status: 'open',
  })

  if (error) throw new Error(error.message)

  await logControl(supabase, 'manager_override_created', relatedType, relatedId, title, user?.id || null, { severity, override_type: overrideType })
  revalidatePath('/revenue-command-center/control-tower')
  revalidatePath('/revenue-command-center/system-activation')
}

export async function closeManagerOverride(formData: FormData) {
  const supabase = await createClient()
  const user = await getCurrentUser()
  const id = clean(formData.get('id'))
  if (!id) throw new Error('Missing override id.')

  const { error } = await supabase.from('bd_manager_overrides').update({
    status: 'closed',
    updated_at: new Date().toISOString(),
  }).eq('id', id)

  if (error) throw new Error(error.message)

  await logControl(supabase, 'manager_override_closed', 'manager_override', id, 'Override closed', user?.id || null)
  revalidatePath('/revenue-command-center/control-tower')
  revalidatePath('/revenue-command-center/system-activation')
}

export async function replayActivationEvent(formData: FormData) {
  const supabase = await createClient()
  const user = await getCurrentUser()
  const eventId = clean(formData.get('event_id'))

  if (!eventId) throw new Error('Missing activation event id.')

  const { data: event, error: eventError } = await supabase.from('bd_activation_events').select('*').eq('id', eventId).maybeSingle()
  if (eventError) throw new Error(eventError.message)
  if (!event) throw new Error('Activation event not found.')

  const dueAt = dueIso(event.severity === 'critical' ? 12 : 24)

  await supabase.from('bd_tasks').insert({
    title: `Replay: ${event.title || event.event_type || 'Activation event'}`,
    description: event.message || event.action_taken || 'Replayed activation event.',
    status: 'open',
    priority: event.severity === 'critical' ? 'critical' : 'high',
    owner_id: user?.id || null,
    assigned_to: user?.id || null,
    related_type: event.related_type || 'activation_event',
    related_id: event.related_id || event.id,
    due_at: dueAt,
    planned_end_at: dueAt,
  })

  await supabase.from('bd_activation_replays').insert({
    activation_event_id: eventId,
    replay_type: 'manual',
    result: 'task_created',
    created_by: user?.id || null,
  })

  await logControl(supabase, 'activation_event_replayed', event.related_type, event.related_id, event.title || event.event_type, user?.id || null, { event_id: eventId })
  revalidatePath('/revenue-command-center/system-activation')
  revalidatePath('/revenue-command-center/tasks')
}

export async function forceInsightClosed(formData: FormData) {
  const supabase = await createClient()
  const user = await getCurrentUser()
  const id = clean(formData.get('id'))
  if (!id) throw new Error('Missing insight id.')

  const { error } = await supabase.from('bd_decision_insights').update({
    status: 'closed',
    updated_at: new Date().toISOString(),
  }).eq('id', id)

  if (error) throw new Error(error.message)

  await logControl(supabase, 'insight_force_closed', 'decision_insight', id, 'Insight force closed', user?.id || null)
  revalidatePath('/revenue-command-center/control-tower')
}
