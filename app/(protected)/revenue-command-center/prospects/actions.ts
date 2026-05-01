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

async function logActivity(supabase: any, prospectId: string, action: string, note?: string | null, actor?: string | null, metadata: Record<string, any> = {}) {
  await supabase.from('bd_activity_logs').insert({
    entity_type: 'prospect',
    entity_id: prospectId,
    action,
    note,
    actor_user_id: actor || null,
    metadata,
  })
}

export async function updateProspectNextAction(formData: FormData) {
  const supabase = await createClient()
  const user = await getCurrentUser()
  const prospectId = clean(formData.get('prospect_id'))
  const nextAction = clean(formData.get('next_action'))
  const nextActionAt = toIso(formData.get('next_action_at'))

  if (!prospectId) throw new Error('Missing prospect id.')

  const { error } = await supabase.from('bd_prospects').update({
    next_action: nextAction,
    next_action_at: nextActionAt,
    updated_at: new Date().toISOString(),
  }).eq('id', prospectId)

  if (error) throw new Error(error.message)

  await supabase.from('bd_prospect_actions').insert({
    prospect_id: prospectId,
    user_id: user?.id || null,
    action_type: 'next_action_updated',
    outcome: nextAction,
    next_action: nextAction,
    next_action_at: nextActionAt,
  })

  await logActivity(supabase, prospectId, 'next_action_updated', nextAction, user?.id || null)
  revalidatePath(`/revenue-command-center/prospects/${prospectId}`)
}

export async function createProspectRoomTask(formData: FormData) {
  const supabase = await createClient()
  const user = await getCurrentUser()
  const prospectId = clean(formData.get('prospect_id'))
  const title = clean(formData.get('title'))
  const description = clean(formData.get('description'))
  const priority = clean(formData.get('priority')) || 'medium'
  const dueAt = toIso(formData.get('due_at'))
  const assignedTo = clean(formData.get('assigned_to')) || clean(formData.get('owner_id')) || user?.id || null

  if (!prospectId || !title) throw new Error('Missing prospect id or task title.')

  const { error } = await supabase.from('bd_tasks').insert({
    title, description, status: 'open', priority, assigned_to: assignedTo, owner_id: user?.id || null,
    related_type: 'prospect', related_id: prospectId, due_at: dueAt, planned_end_at: dueAt,
  })

  if (error) throw new Error(error.message)

  await supabase.from('bd_prospect_actions').insert({
    prospect_id: prospectId, user_id: user?.id || null, action_type: 'task_created',
    outcome: title, next_action: title, next_action_at: dueAt,
  })

  await logActivity(supabase, prospectId, 'task_created', title, user?.id || null, { due_at: dueAt, priority })
  revalidatePath(`/revenue-command-center/prospects/${prospectId}`)
  revalidatePath('/revenue-command-center/tasks')
}

export async function addProspectRoomNote(formData: FormData) {
  const supabase = await createClient()
  const user = await getCurrentUser()
  const prospectId = clean(formData.get('prospect_id'))
  const content = clean(formData.get('content'))
  const noteType = clean(formData.get('note_type')) || 'general'

  if (!prospectId || !content) throw new Error('Missing prospect id or note.')

  const { error } = await supabase.from('bd_prospect_notes').insert({
    prospect_id: prospectId, user_id: user?.id || null, note_type: noteType, content,
  })

  if (error) throw new Error(error.message)

  await logActivity(supabase, prospectId, 'note_added', content, user?.id || null, { note_type: noteType })
  revalidatePath(`/revenue-command-center/prospects/${prospectId}`)
}

export async function logProspectRoomAction(formData: FormData) {
  const supabase = await createClient()
  const user = await getCurrentUser()
  const prospectId = clean(formData.get('prospect_id'))
  const actionType = clean(formData.get('action_type')) || 'interaction'
  const outcome = clean(formData.get('outcome'))
  const nextAction = clean(formData.get('next_action'))
  const nextActionAt = toIso(formData.get('next_action_at'))

  if (!prospectId) throw new Error('Missing prospect id.')

  const { error } = await supabase.from('bd_prospect_actions').insert({
    prospect_id: prospectId, user_id: user?.id || null, action_type: actionType,
    outcome, next_action: nextAction, next_action_at: nextActionAt,
  })

  if (error) throw new Error(error.message)

  const updatePayload: Record<string, any> = { last_interaction_at: new Date().toISOString(), updated_at: new Date().toISOString() }
  if (nextAction || nextActionAt) {
    updatePayload.next_action = nextAction
    updatePayload.next_action_at = nextActionAt
  }

  await supabase.from('bd_prospects').update(updatePayload).eq('id', prospectId)
  await logActivity(supabase, prospectId, actionType, outcome || nextAction, user?.id || null)
  revalidatePath(`/revenue-command-center/prospects/${prospectId}`)
}

export async function createProspectAppointment(formData: FormData) {
  const supabase = await createClient()
  const user = await getCurrentUser()
  const prospectId = clean(formData.get('prospect_id'))
  const title = clean(formData.get('title')) || 'Prospect appointment'
  const scheduledAt = toIso(formData.get('scheduled_at'))
  const notes = clean(formData.get('notes'))
  const ownerId = clean(formData.get('owner_id')) || user?.id || null

  if (!prospectId || !scheduledAt) throw new Error('Missing prospect id or appointment time.')

  const { error } = await supabase.from('bd_appointments').insert({
    title, scheduled_at: scheduledAt, owner_id: ownerId, related_type: 'prospect',
    related_id: prospectId, status: 'scheduled', notes,
  })

  if (error) throw new Error(error.message)

  await supabase.from('bd_prospect_actions').insert({
    prospect_id: prospectId, user_id: user?.id || null, action_type: 'appointment_created',
    outcome: title, next_action: `Appointment: ${title}`, next_action_at: scheduledAt,
  })

  await supabase.from('bd_prospects').update({
    next_action: `Appointment: ${title}`,
    next_action_at: scheduledAt,
    updated_at: new Date().toISOString(),
  }).eq('id', prospectId)

  await logActivity(supabase, prospectId, 'appointment_created', title, user?.id || null, { scheduled_at: scheduledAt })
  revalidatePath(`/revenue-command-center/prospects/${prospectId}`)
}
