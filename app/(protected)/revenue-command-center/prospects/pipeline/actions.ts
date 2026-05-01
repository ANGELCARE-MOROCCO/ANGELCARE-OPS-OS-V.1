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

export async function moveProspectStage(formData: FormData) {
  const supabase = await createClient()
  const user = await getCurrentUser()

  const prospectId = clean(formData.get('prospect_id'))
  const stage = clean(formData.get('stage'))

  if (!prospectId || !stage) throw new Error('Missing prospect or stage.')

  const { error } = await supabase.from('bd_prospects').update({
    stage,
    status: stage,
    updated_at: new Date().toISOString(),
  }).eq('id', prospectId)

  if (error) throw new Error(error.message)

  await supabase.from('bd_activity_logs').insert({
    entity_type: 'prospect',
    entity_id: prospectId,
    action: 'pipeline_stage_changed',
    note: stage,
    actor_user_id: user?.id || null,
    metadata: { stage },
  })

  revalidatePath('/revenue-command-center/prospects/pipeline')
  revalidatePath(`/revenue-command-center/prospects/${prospectId}`)
}

export async function quickPipelineTask(formData: FormData) {
  const supabase = await createClient()
  const user = await getCurrentUser()

  const prospectId = clean(formData.get('prospect_id'))
  const title = clean(formData.get('title')) || 'Pipeline follow-up'
  const dueAt = toIso(formData.get('due_at'))
  const assignedTo = clean(formData.get('assigned_to')) || user?.id || null

  if (!prospectId) throw new Error('Missing prospect.')

  const { error } = await supabase.from('bd_tasks').insert({
    title,
    description: 'Quick task created from Pipeline Operating Board.',
    status: 'open',
    priority: 'high',
    assigned_to: assignedTo,
    owner_id: user?.id || null,
    related_type: 'prospect',
    related_id: prospectId,
    due_at: dueAt,
    planned_end_at: dueAt,
  })

  if (error) throw new Error(error.message)

  await supabase.from('bd_activity_logs').insert({
    entity_type: 'prospect',
    entity_id: prospectId,
    action: 'pipeline_quick_task_created',
    note: title,
    actor_user_id: user?.id || null,
  })

  revalidatePath('/revenue-command-center/prospects/pipeline')
}

export async function quickSetNextAction(formData: FormData) {
  const supabase = await createClient()
  const user = await getCurrentUser()

  const prospectId = clean(formData.get('prospect_id'))
  const nextAction = clean(formData.get('next_action'))
  const nextActionAt = toIso(formData.get('next_action_at'))

  if (!prospectId) throw new Error('Missing prospect.')

  const { error } = await supabase.from('bd_prospects').update({
    next_action: nextAction,
    next_action_at: nextActionAt,
    updated_at: new Date().toISOString(),
  }).eq('id', prospectId)

  if (error) throw new Error(error.message)

  await supabase.from('bd_activity_logs').insert({
    entity_type: 'prospect',
    entity_id: prospectId,
    action: 'pipeline_next_action_set',
    note: nextAction,
    actor_user_id: user?.id || null,
  })

  revalidatePath('/revenue-command-center/prospects/pipeline')
  revalidatePath(`/revenue-command-center/prospects/${prospectId}`)
}
