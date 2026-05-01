'use server'

import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/getUser'
import { revalidatePath } from 'next/cache'
import { buildRebalanceRecommendations, computeWorkloadSnapshots } from '@/lib/workloadBalancerEngine'

function clean(v: FormDataEntryValue | null) {
  return String(v || '').trim() || null
}

export async function runWorkloadAnalysis() {
  const supabase = await createClient()

  const [{ data: users }, { data: tasks }, { data: prospects }] = await Promise.all([
    supabase.from('app_users').select('id, full_name, username, role'),
    supabase.from('bd_tasks').select('*'),
    supabase.from('bd_prospects').select('*'),
  ])

  const snapshots = computeWorkloadSnapshots({
    users: users || [],
    tasks: tasks || [],
    prospects: prospects || [],
  })

  for (const snapshot of snapshots) {
    await supabase.from('bd_workload_snapshots').insert(snapshot)
  }

  const recs = buildRebalanceRecommendations({
    users: users || [],
    snapshots,
    tasks: tasks || [],
    prospects: prospects || [],
  })

  for (const rec of recs) {
    await supabase.from('bd_rebalance_recommendations').insert(rec)
  }

  revalidatePath('/revenue-command-center/workload-balancer')
}

export async function approveRebalance(formData: FormData) {
  const supabase = await createClient()
  const user = await getCurrentUser()
  const id = clean(formData.get('id'))
  if (!id) throw new Error('Missing recommendation id.')

  const { data: rec, error: recError } = await supabase.from('bd_rebalance_recommendations').select('*').eq('id', id).maybeSingle()
  if (recError) throw new Error(recError.message)
  if (!rec) throw new Error('Recommendation not found.')

  if (rec.related_type === 'task') {
    await supabase.from('bd_tasks').update({
      assigned_to: rec.to_user_id,
      updated_at: new Date().toISOString(),
    }).eq('id', rec.related_id)
  }

  if (rec.related_type === 'prospect') {
    await supabase.from('bd_prospects').update({
      owner_id: rec.to_user_id,
      updated_at: new Date().toISOString(),
    }).eq('id', rec.related_id)
  }

  await supabase.from('bd_rebalance_recommendations').update({
    status: 'approved',
    decided_at: new Date().toISOString(),
    decided_by: user?.id || null,
  }).eq('id', id)

  await supabase.from('bd_activity_logs').insert({
    entity_type: rec.related_type,
    entity_id: rec.related_id,
    action: 'rebalance_approved',
    note: rec.reason,
    actor_user_id: user?.id || null,
    metadata: { from_user_id: rec.from_user_id, to_user_id: rec.to_user_id },
  })

  revalidatePath('/revenue-command-center/workload-balancer')
}

export async function rejectRebalance(formData: FormData) {
  const supabase = await createClient()
  const user = await getCurrentUser()
  const id = clean(formData.get('id'))
  if (!id) throw new Error('Missing recommendation id.')

  const { error } = await supabase.from('bd_rebalance_recommendations').update({
    status: 'rejected',
    decided_at: new Date().toISOString(),
    decided_by: user?.id || null,
  }).eq('id', id)

  if (error) throw new Error(error.message)
  revalidatePath('/revenue-command-center/workload-balancer')
}

export async function createManagerIntervention(formData: FormData) {
  const supabase = await createClient()
  const user = await getCurrentUser()

  const title = clean(formData.get('title'))
  const description = clean(formData.get('description'))
  const severity = clean(formData.get('severity')) || 'medium'
  const targetUserId = clean(formData.get('target_user_id'))
  const dueAt = clean(formData.get('due_at'))

  if (!title) throw new Error('Missing intervention title.')

  const { error } = await supabase.from('bd_manager_interventions').insert({
    title,
    description,
    severity,
    target_user_id: targetUserId,
    created_by: user?.id || null,
    due_at: dueAt,
    status: 'open',
  })

  if (error) throw new Error(error.message)
  revalidatePath('/revenue-command-center/workload-balancer')
}

export async function closeManagerIntervention(formData: FormData) {
  const supabase = await createClient()
  const id = clean(formData.get('id'))
  if (!id) throw new Error('Missing intervention id.')

  const { error } = await supabase.from('bd_manager_interventions').update({
    status: 'closed',
    updated_at: new Date().toISOString(),
  }).eq('id', id)

  if (error) throw new Error(error.message)
  revalidatePath('/revenue-command-center/workload-balancer')
}
