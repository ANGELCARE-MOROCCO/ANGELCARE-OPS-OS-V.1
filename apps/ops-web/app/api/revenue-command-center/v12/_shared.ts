import { createClient } from '@/lib/supabase/server'

export async function getSupabase() {
  return await createClient()
}

export function nowIso() {
  return new Date().toISOString()
}

export function addHours(hours: number) {
  return new Date(Date.now() + hours * 60 * 60 * 1000).toISOString()
}

export function cleanRecordPayload(payload: any) {
  const now = nowIso()
  return {
    module_key: payload.module_key || payload.module || 'hq',
    page_key: payload.page_key || payload.page || 'revenue-command-center',
    record_type: payload.record_type || 'command_record',
    title: payload.title || payload.name || 'Revenue command record',
    description: payload.description || null,
    owner_name: payload.owner_name || payload.owner || null,
    department: payload.department || 'Revenue Command',
    status: payload.status || 'open',
    priority: payload.priority || 'medium',
    risk_level: payload.risk_level || payload.risk || 'low',
    value_mad: Number(payload.value_mad || payload.value || 0),
    due_at: payload.due_at || null,
    metadata: { ...(payload.metadata || {}), source: payload.source || 'v12_hq_execution_depth' },
    updated_at: now,
  }
}

export async function logAction(supabase: any, action_key: string, payload: any, status = 'completed') {
  try {
    await supabase.from('revenue_command_action_logs').insert({
      module_key: payload.module_key || payload.record?.module_key || payload.module || 'hq',
      page_key: payload.page_key || 'revenue-command-center',
      action_key,
      selected_count: payload.selected_count || (payload.ids?.length || (payload.id ? 1 : 0)),
      payload,
      status,
    })
  } catch (error) {
    console.warn('Revenue Command v12 action log skipped', error)
  }
}

export function actionUpdates(action_key: string, payload: any = {}) {
  const now = nowIso()
  const base = { updated_at: now }
  if (action_key === 'start') return { ...base, status: 'active', started_at: now }
  if (action_key === 'complete') return { ...base, status: 'done', completed_at: now, risk_level: 'low' }
  if (action_key === 'archive') return { ...base, status: 'archived', archived_at: now }
  if (action_key === 'delete') return { ...base, deleted_at: now }
  if (action_key === 'escalate') return { ...base, status: 'escalated', risk_level: 'critical', priority: 'critical', escalated_at: now }
  if (action_key === 'assign') return { ...base, owner_name: payload.owner_name || payload.owner || 'Revenue Owner', status: payload.status || 'active' }
  if (action_key === 'defer_24h') return { ...base, due_at: addHours(24), status: 'open' }
  if (action_key === 'raise_priority') return { ...base, priority: payload.priority || 'high' }
  if (action_key === 'qualify') return { ...base, status: 'qualified', record_type: 'prospect', priority: 'high' }
  if (action_key === 'mark_won') return { ...base, status: 'won', risk_level: 'low', completed_at: now }
  if (action_key === 'mark_lost') return { ...base, status: 'lost', completed_at: now }
  return { ...base, ...(payload.updates || {}) }
}

export const playbooks = [
  {
    key: 'sla_rescue',
    title: 'SLA rescue intervention',
    description: 'Escalate overdue/high-risk work, assign rescue owner, create same-day follow-up, and open manager approval.',
    actions: ['escalate_record', 'assign_rescue_owner', 'create_follow_up', 'create_approval'],
  },
  {
    key: 'prospect_acceleration',
    title: 'Prospect acceleration chain',
    description: 'Qualify prospect, schedule appointment, create decision-map task, and protect next commercial action.',
    actions: ['qualify_record', 'create_appointment', 'create_decision_task', 'create_follow_up'],
  },
  {
    key: 'campaign_recovery',
    title: 'Campaign recovery chain',
    description: 'Open campaign inspection, create owner tasks, flag ROI risk, and generate corrective action checklist.',
    actions: ['activate_record', 'create_roi_task', 'create_quality_task', 'create_approval'],
  },
  {
    key: 'manager_review',
    title: 'Manager review chain',
    description: 'Freeze risky record, open approval, create audit note, and require management decision.',
    actions: ['escalate_record', 'create_approval', 'create_manager_task'],
  },
]

export async function getRecord(supabase: any, id: string) {
  const { data, error } = await supabase.from('revenue_command_records').select('*').eq('id', id).maybeSingle()
  if (error) throw error
  return data
}

export async function createLinkedRecord(supabase: any, source: any, patch: any) {
  const payload = cleanRecordPayload({
    module_key: patch.module_key || source?.module_key || 'hq',
    page_key: patch.page_key || 'revenue-command-center',
    record_type: patch.record_type || 'task',
    title: patch.title,
    description: patch.description,
    owner_name: patch.owner_name || source?.owner_name,
    priority: patch.priority || source?.priority || 'medium',
    risk_level: patch.risk_level || source?.risk_level || 'low',
    value_mad: patch.value_mad ?? 0,
    due_at: patch.due_at || addHours(24),
    status: patch.status || 'open',
    metadata: { linked_source_id: source?.id, chain_key: patch.chain_key, ...(patch.metadata || {}) },
  })
  const { data, error } = await supabase.from('revenue_command_records').insert(payload).select('*').single()
  if (error) throw error
  return data
}
