'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/getUser'

function clean(value: FormDataEntryValue | null) {
  const text = String(value || '').trim()
  return text.length ? text : null
}

function toIso(value: FormDataEntryValue | null) {
  const text = clean(value)
  if (!text) return null
  const date = new Date(text)
  return Number.isNaN(date.getTime()) ? null : date.toISOString()
}

function snoozeIso(hours: number) {
  return new Date(Date.now() + hours * 60 * 60 * 1000).toISOString()
}

async function logFollowupEvent(supabase: any, followupId: string, eventType: string, note?: string | null, outcome?: string | null, userId?: string | null, metadata: Record<string, any> = {}) {
  await supabase.from('bd_followup_events').insert({
    followup_id: followupId,
    event_type: eventType,
    outcome,
    note,
    created_by: userId || null,
    metadata,
  })

  await supabase.from('bd_activity_logs').insert({
    entity_type: 'followup',
    entity_id: followupId,
    action: eventType,
    note: note || outcome,
    actor_user_id: userId || null,
    metadata,
  })
}

export async function completeFollowupWithOutcome(formData: FormData) {
  const supabase = await createClient()
  const user = await getCurrentUser()

  const followupId = clean(formData.get('followup_id'))
  const outcome = clean(formData.get('outcome'))
  const note = clean(formData.get('note'))

  if (!followupId) throw new Error('Missing follow-up id.')
  if (!outcome) throw new Error('Outcome is required.')

  const { error } = await supabase.from('bd_followups').update({
    status: 'completed',
    outcome,
    outcome_note: note,
    updated_at: new Date().toISOString(),
  }).eq('id', followupId)

  if (error) throw new Error(error.message)

  await logFollowupEvent(supabase, followupId, 'followup_completed_with_outcome', note, outcome, user?.id || null)
  revalidatePath('/revenue-command-center/follow-ups')
}

export async function snoozeFollowup(formData: FormData) {
  const supabase = await createClient()
  const user = await getCurrentUser()

  const followupId = clean(formData.get('followup_id'))
  const hours = Number(clean(formData.get('hours')) || 24)

  if (!followupId) throw new Error('Missing follow-up id.')

  const until = snoozeIso(hours)

  const { error } = await supabase.from('bd_followups').update({
    snoozed_until: until,
    due_at: until,
    updated_at: new Date().toISOString(),
  }).eq('id', followupId)

  if (error) throw new Error(error.message)

  await logFollowupEvent(supabase, followupId, 'followup_snoozed', `Snoozed for ${hours} hours`, null, user?.id || null, { hours, until })
  revalidatePath('/revenue-command-center/follow-ups')
}

export async function advanceFollowupCadence(formData: FormData) {
  const supabase = await createClient()
  const user = await getCurrentUser()

  const followupId = clean(formData.get('followup_id'))
  if (!followupId) throw new Error('Missing follow-up id.')

  const { data: followup } = await supabase.from('bd_followups').select('*').eq('id', followupId).maybeSingle()
  const nextStep = Number(followup?.cadence_step || 1) + 1
  const nextChannel = nextStep === 2 ? 'whatsapp' : nextStep === 3 ? 'call' : nextStep >= 4 ? 'manager' : 'call'
  const dueAt = nextStep === 2 ? snoozeIso(24) : nextStep === 3 ? snoozeIso(72) : snoozeIso(120)

  const { error } = await supabase.from('bd_followups').update({
    cadence_step: nextStep,
    channel: nextChannel,
    due_at: dueAt,
    recovery_status: nextStep >= 4 ? 'manager_recovery' : 'cadence_active',
    updated_at: new Date().toISOString(),
  }).eq('id', followupId)

  if (error) throw new Error(error.message)

  await logFollowupEvent(supabase, followupId, 'followup_cadence_advanced', `Advanced to step ${nextStep} via ${nextChannel}`, null, user?.id || null, { nextStep, nextChannel, dueAt })
  revalidatePath('/revenue-command-center/follow-ups')
}

export async function escalateFollowup(formData: FormData) {
  const supabase = await createClient()
  const user = await getCurrentUser()

  const followupId = clean(formData.get('followup_id'))
  const reason = clean(formData.get('reason'))

  if (!followupId) throw new Error('Missing follow-up id.')
  if (!reason) throw new Error('Escalation reason is required.')

  const { data: followup } = await supabase.from('bd_followups').select('escalation_level').eq('id', followupId).maybeSingle()
  const nextLevel = Number(followup?.escalation_level || 0) + 1

  const { error } = await supabase.from('bd_followups').update({
    escalation_level: nextLevel,
    recovery_status: 'escalated',
    priority: 'critical',
    updated_at: new Date().toISOString(),
  }).eq('id', followupId)

  if (error) throw new Error(error.message)

  await logFollowupEvent(supabase, followupId, 'followup_escalated', reason, null, user?.id || null, { escalation_level: nextLevel })
  revalidatePath('/revenue-command-center/follow-ups')
}

export async function convertFollowupToTask(formData: FormData) {
  const supabase = await createClient()
  const user = await getCurrentUser()

  const followupId = clean(formData.get('followup_id'))
  const title = clean(formData.get('title'))
  const dueAt = toIso(formData.get('due_at'))

  if (!followupId) throw new Error('Missing follow-up id.')

  const { data: followup } = await supabase.from('bd_followups').select('*').eq('id', followupId).maybeSingle()
  if (!followup) throw new Error('Follow-up not found.')

  const taskTitle = title || `Task from follow-up: ${followup.title || 'Follow-up'}`
  const due = dueAt || snoozeIso(24)

  const { data: task, error } = await supabase.from('bd_tasks').insert({
    title: taskTitle,
    description: `Converted from follow-up: ${followup.title || ''}`,
    status: 'open',
    priority: followup.priority || 'medium',
    assigned_to: followup.owner_id || user?.id || null,
    owner_id: followup.owner_id || user?.id || null,
    related_type: followup.related_type || 'followup',
    related_id: followup.related_id || followup.id,
    due_at: due,
    planned_end_at: due,
  }).select('id').single()

  if (error) throw new Error(error.message)

  await supabase.from('bd_followups').update({
    converted_task_id: task?.id || null,
    updated_at: new Date().toISOString(),
  }).eq('id', followupId)

  await logFollowupEvent(supabase, followupId, 'followup_converted_to_task', taskTitle, null, user?.id || null, { task_id: task?.id, due_at: due })
  revalidatePath('/revenue-command-center/follow-ups')
  revalidatePath('/revenue-command-center/tasks')
}

export async function convertFollowupToAppointment(formData: FormData) {
  const supabase = await createClient()
  const user = await getCurrentUser()

  const followupId = clean(formData.get('followup_id'))
  const title = clean(formData.get('title'))
  const scheduledAt = toIso(formData.get('scheduled_at'))
  const notes = clean(formData.get('notes'))

  if (!followupId) throw new Error('Missing follow-up id.')
  if (!scheduledAt) throw new Error('Appointment date is required.')

  const { data: followup } = await supabase.from('bd_followups').select('*').eq('id', followupId).maybeSingle()
  if (!followup) throw new Error('Follow-up not found.')

  const appointmentTitle = title || `Appointment from follow-up: ${followup.title || 'Follow-up'}`

  const { data: appointment, error } = await supabase.from('bd_appointments').insert({
    title: appointmentTitle,
    scheduled_at: scheduledAt,
    owner_id: followup.owner_id || user?.id || null,
    related_type: followup.related_type || 'followup',
    related_id: followup.related_id || followup.id,
    status: 'scheduled',
    notes,
  }).select('id').single()

  if (error) throw new Error(error.message)

  await supabase.from('bd_followups').update({
    converted_appointment_id: appointment?.id || null,
    status: 'completed',
    outcome: 'converted_to_appointment',
    updated_at: new Date().toISOString(),
  }).eq('id', followupId)

  await logFollowupEvent(supabase, followupId, 'followup_converted_to_appointment', appointmentTitle, 'converted_to_appointment', user?.id || null, { appointment_id: appointment?.id, scheduled_at: scheduledAt })
  revalidatePath('/revenue-command-center/follow-ups')
}
