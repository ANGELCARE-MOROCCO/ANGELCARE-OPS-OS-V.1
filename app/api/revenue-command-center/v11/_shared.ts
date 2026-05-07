import { createClient } from '@/lib/supabase/server'

export async function getSupabase() {
  return await createClient()
}

export function cleanRecordPayload(payload: any) {
  const now = new Date().toISOString()
  return {
    module_key: payload.module_key || payload.module || 'hq',
    page_key: payload.page_key || payload.page || 'revenue-command-center',
    record_type: payload.record_type || 'task',
    title: payload.title || payload.name || 'Revenue command record',
    description: payload.description || null,
    owner_name: payload.owner_name || payload.owner || null,
    department: payload.department || 'Revenue Command',
    status: payload.status || 'open',
    priority: payload.priority || 'medium',
    risk_level: payload.risk_level || payload.risk || 'low',
    value_mad: Number(payload.value_mad || payload.value || 0),
    due_at: payload.due_at || null,
    metadata: { ...(payload.metadata || {}), source: payload.source || 'v11_hq_real_sync' },
    updated_at: now,
  }
}

export async function logAction(supabase: any, action_key: string, payload: any, status = 'completed') {
  try {
    await supabase.from('revenue_command_action_logs').insert({
      module_key: payload.module_key || payload.record?.module_key || 'hq',
      page_key: payload.page_key || 'revenue-command-center',
      action_key,
      selected_count: payload.selected_count || (payload.ids?.length || 1),
      payload,
      status,
    })
  } catch (e) {
    console.warn('Revenue Command action log skipped', e)
  }
}

export function actionUpdates(action_key: string, payload: any = {}) {
  const now = new Date().toISOString()
  if (action_key === 'start') return { status: 'active', started_at: now, updated_at: now }
  if (action_key === 'complete') return { status: 'done', completed_at: now, updated_at: now }
  if (action_key === 'archive') return { status: 'archived', archived_at: now, updated_at: now }
  if (action_key === 'escalate') return { status: 'escalated', risk_level: 'critical', priority: 'critical', escalated_at: now, updated_at: now }
  if (action_key === 'qualify_prospect') return { status: 'active', record_type: 'prospect', priority: 'high', updated_at: now }
  if (action_key === 'mark_won') return { status: 'won', risk_level: 'low', completed_at: now, updated_at: now }
  if (action_key === 'mark_lost') return { status: 'lost', completed_at: now, updated_at: now }
  if (action_key === 'create_next_follow_up') return { status: 'active', record_type: 'follow_up', due_at: payload.due_at || new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), updated_at: now }
  return { ...(payload.updates || {}), updated_at: now }
}
