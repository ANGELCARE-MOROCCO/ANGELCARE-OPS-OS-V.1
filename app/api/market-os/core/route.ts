// app/api/market-os/core/route.ts

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import {
  defaultRecordTitle,
  marketActionLabel,
  nextStageForAction,
  nextStatusForAction,
  priorityForAction,
  type MarketActionInput,
  type MarketEngine,
} from '@/lib/market-os/core'

const DEFAULT_AGENTS = [
  { agent_key: 'agent_1', name: 'Agent 1', role: 'Acquisition / Ads Manager', engine: 'acquisition', mission: 'Generate qualified demand and daily lead flow.', daily_routine: { morning: 'Verify ads and CPL', midday: 'Adjust campaigns and tests', evening: 'Launch new tests and report' }, target_kpis: { cpl: 25, leads_per_day: 100 }, is_active: true },
  { agent_key: 'agent_2', name: 'Agent 2', role: 'Content & Branding', engine: 'content', mission: 'Produce trust-building content and deliverables.', daily_routine: { morning: 'Plan content', midday: 'Produce and publish', evening: 'Prepare next assets' }, target_kpis: { content_per_day: 6, approval_delay_hours: 24 }, is_active: true },
  { agent_key: 'agent_3', name: 'Agent 3', role: 'Conversion / Lead Follow-up', engine: 'conversion', mission: 'Transform leads into qualified opportunities.', daily_routine: { morning: 'Reply and qualify', midday: 'Follow-ups', evening: 'Closing notes' }, target_kpis: { response_minutes: 5, conversion_rate: 15 }, is_active: true },
  { agent_key: 'agent_4', name: 'Agent 4', role: 'Data & Scaling', engine: 'data', mission: 'Turn execution data into optimization decisions.', daily_routine: { morning: 'Dashboard analysis', midday: 'Optimization tasks', evening: 'Strategy reporting' }, target_kpis: { roi: 3, report_frequency_days: 1 }, is_active: true },
]

const DEFAULT_KPIS = [
  { kpi_key: 'cpl', label: 'CPL', engine: 'acquisition', current_value: 0, target_value: 25, unit: 'MAD', status: 'empty' },
  { kpi_key: 'leads_per_day', label: 'Leads / day', engine: 'conversion', current_value: 0, target_value: 100, unit: 'leads', status: 'empty' },
  { kpi_key: 'conversion_rate', label: 'Conversion rate', engine: 'conversion', current_value: 0, target_value: 15, unit: '%', status: 'empty' },
  { kpi_key: 'roi', label: 'ROI', engine: 'data', current_value: 0, target_value: 3, unit: 'x', status: 'empty' },
  { kpi_key: 'content_output', label: 'Content output', engine: 'content', current_value: 0, target_value: 20, unit: 'items/week', status: 'empty' },
  { kpi_key: 'active_ambassadors', label: 'Active ambassadors', engine: 'network', current_value: 0, target_value: 20, unit: 'people', status: 'empty' },
]

const CREATE_ACTIONS = new Set(['add_ambassador', 'trigger_optimization_task', 'flag_underperformance', 'analyze_performance'])
const SESSION_ACTIONS = new Set(['start_session', 'complete_session', 'log_session_results'])
const KPI_ACTIONS = new Set(['log_kpi', 'update_kpi'])

function jsonError(message: string, status = 500) {
  console.error('Market-OS ERROR:', message)
  return NextResponse.json({ error: message }, { status })
}

function removeUndefined(row: Record<string, unknown>) {
  return Object.fromEntries(Object.entries(row).filter(([, value]) => value !== undefined))
}

async function seedBaseData(supabase: Awaited<ReturnType<typeof createClient>>) {
  for (const agent of DEFAULT_AGENTS) {
    const { error } = await supabase
  .from('market_os_agents')
  .upsert(agent as any, { onConflict: 'agent_key' })
    if (error) console.error('Market-OS agent seed error:', error)
  }

  for (const kpi of DEFAULT_KPIS) {
    const { error } = await supabase.from('market_os_kpis').upsert(kpi, { onConflict: 'kpi_key' })
    if (error) console.error('Market-OS KPI seed error:', error)
  }
}

export async function GET() {
  const supabase = await createClient()
  await seedBaseData(supabase)

  const [records, agents, kpis, actions, audit, sessions] = await Promise.all([
    supabase.from('market_os_records').select('*').order('updated_at', { ascending: false }).limit(300),
    supabase.from('market_os_agents').select('*').order('agent_key'),
    supabase.from('market_os_kpis').select('*').order('kpi_key'),
    supabase.from('market_os_actions').select('*').order('created_at', { ascending: false }).limit(120),
    supabase.from('market_os_audit').select('*').order('created_at', { ascending: false }).limit(120),
    supabase.from('market_os_sessions').select('*').order('created_at', { ascending: false }).limit(60),
  ])

  if (records.error) return jsonError(records.error.message)
  if (agents.error) return jsonError(agents.error.message)
  if (kpis.error) return jsonError(kpis.error.message)
  if (actions.error) return jsonError(actions.error.message)
  if (audit.error) return jsonError(audit.error.message)
  if (sessions.error) return jsonError(sessions.error.message)

  return NextResponse.json({
    records: records.data ?? [],
    agents: agents.data ?? [],
    kpis: kpis.data ?? [],
    actions: actions.data ?? [],
    audit: audit.data ?? [],
    sessions: sessions.data ?? [],
  })
}

export async function POST(req: Request) {
  try {
    const supabase = await createClient()
    await seedBaseData(supabase)

    const body = (await req.json().catch(() => ({}))) as MarketActionInput
    const action = String(body.action || '')
    if (!action) return jsonError('Missing action key', 400)

    const actorName = body.actorName || 'Market-OS Operator'
    const engine = (body.engine || 'system') as MarketEngine
    const payload = (body.payload || {}) as Record<string, unknown>

    let recordId = body.recordId || null
    let record: Record<string, unknown> | null = null

    const forceCreate = action.startsWith('create_') || CREATE_ACTIONS.has(action)
    const isSession = SESSION_ACTIONS.has(action)
    const isKpi = KPI_ACTIONS.has(action)

    if (isSession) {
      const sessionType = String(payload.sessionType || payload.session_type || 'morning')
      const { data, error } = await supabase
        .from('market_os_sessions')
        .insert({
          session_type: sessionType,
          engine,
          owner_agent: body.ownerAgent || null,
          status: action === 'complete_session' ? 'completed' : action === 'log_session_results' ? 'logged' : 'started',
          results: { ...payload, actorName },
        })
        .select('*')
        .single()
      if (error) return jsonError(error.message)
      record = data
      recordId = String(data.id)
    } else if (isKpi) {
      const kpiKey = String(payload.kpiKey || payload.kpi_key || 'custom_kpi')
      const value = Number(payload.value ?? payload.current_value ?? 0)
      const target = Number(payload.target ?? payload.target_value ?? 0)
      const validValue = Number.isFinite(value) ? value : 0
      const validTarget = Number.isFinite(target) ? target : 0

      const { data, error } = await supabase
        .from('market_os_kpis')
        .upsert({
          kpi_key: kpiKey,
          label: String(payload.label || body.title || kpiKey.replace(/_/g, ' ')),
          engine,
          current_value: validValue,
          target_value: validTarget,
          unit: String(payload.unit || ''),
          status: validTarget > 0 ? (validValue >= validTarget ? 'on_target' : 'under_target') : 'updated',
          last_updated_at: new Date().toISOString(),
        }, { onConflict: 'kpi_key' })
        .select('*')
        .single()
      if (error) return jsonError(error.message)
      record = data
      recordId = String(data.id)
    } else if (forceCreate || !recordId) {
      const recordType = body.recordType || String(payload.recordType || payload.record_type || action.replace(/^create_/, '') || 'task')
      const title = body.title || String(payload.title || defaultRecordTitle(action))
      const finalStatus = body.status || nextStatusForAction(action, 'active') || 'active'
      const finalStage = body.stage || nextStageForAction(action, 'active') || 'active'
      const finalPriority = body.priority || priorityForAction(action, 'normal') || 'normal'
      const ownerAgent = body.ownerAgent || String(payload.ownerAgent || payload.owner_agent || '')
      const description = body.description || String(payload.description || '')

      const { data, error } = await supabase
        .from('market_os_records')
        .insert({
          // Legacy-compatible required columns from the original Market-OS table
          kind: recordType || 'task',
          owner: ownerAgent || actorName || 'Market-OS Operator',
          notes: description || String(payload.note || ''),
          payload: payload || {},

          // Rebuilt V1 execution columns
          record_type: recordType || 'task',
          engine: engine || 'system',
          pipeline: String(payload.pipeline || engine || 'system'),
          title,
          description,
          status: finalStatus,
          priority: finalPriority,
          owner_agent: ownerAgent,
          stage: finalStage,
          due_date: payload.dueDate || payload.due_date || null,
          score: typeof payload.score === 'number' ? payload.score : null,
          metadata: { ...payload, created_by_action: action, actorName },
        })
        .select('*')
        .single()
      if (error) return jsonError(error.message)
      record = data
      recordId = String(data.id)
    } else {
      const existing = await supabase.from('market_os_records').select('metadata, payload').eq('id', recordId).maybeSingle()
      if (existing.error) return jsonError(existing.error.message)

      const oldMetadata = (existing.data?.metadata || {}) as Record<string, unknown>
      const oldPayload = (existing.data?.payload || {}) as Record<string, unknown>
      const ownerAgent = body.ownerAgent
      const description = body.description

      const updates = removeUndefined({
        updated_at: new Date().toISOString(),

        // Legacy fields
        owner: ownerAgent,
        notes: description,
        payload: { ...oldPayload, ...payload, last_action: action, last_actor: actorName, last_action_at: new Date().toISOString() },

        // Rebuilt V1 fields
        status: body.status || nextStatusForAction(action, undefined as unknown as string),
        stage: body.stage || nextStageForAction(action, undefined as unknown as string),
        priority: body.priority || priorityForAction(action, undefined as unknown as string),
        owner_agent: ownerAgent,
        title: body.title,
        description,
        metadata: { ...oldMetadata, ...payload, last_action: action, last_actor: actorName, last_action_at: new Date().toISOString() },
      })

      const { data, error } = await supabase
        .from('market_os_records')
        .update(updates)
        .eq('id', recordId)
        .select('*')
        .single()
      if (error) return jsonError(error.message)
      record = data
    }

    const label = marketActionLabel(action)
    const actionRow = {
      action_key: action,
      action_label: label,
      engine,
      record_id: recordId,
      actor_name: actorName,
      status: 'executed',
      payload: { ...payload, input: body },
    }

    const { error: actionError } = await supabase.from('market_os_actions').insert(actionRow)
    if (actionError) return jsonError(actionError.message)

    const { error: auditError } = await supabase.from('market_os_audit').insert({
      action_key: action,
      title: label,
      summary: `${actorName} executed ${label}`,
      engine,
      record_id: recordId,
      actor_name: actorName,
      payload: { ...payload, input: body },
    })
    if (auditError) return jsonError(auditError.message)

    return NextResponse.json({ ok: true, action: actionRow, recordId, record })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Market-OS action failed'
    return jsonError(message)
  }
}
