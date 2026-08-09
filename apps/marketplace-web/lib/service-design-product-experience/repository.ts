import 'server-only'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { ProductExperienceActor } from './server'
import { actorId, safeJson, safeText, tenantId } from './server'
import { normalizeScenario, timelineFromScenario } from './normalize'

type Row = Record<string, unknown>

const mapBlock = (row: Row) => ({ id: String(row.id), dayId: String(row.day_id), sourceActivityId: row.source_activity_id ? String(row.source_activity_id) : null, sourceCode: row.source_code ? String(row.source_code) : null, blockType: String(row.block_type || 'activity'), label: String(row.label || ''), objective: String(row.objective || ''), startMinute: Number(row.start_minute || 0), durationMinutes: Number(row.duration_minutes || 30), locked: Boolean(row.locked), sortOrder: Number(row.sort_order || 0), metadata: safeJson(row.metadata) })
const mapDay = (row: Row, blocks: Row[]) => ({ id: String(row.id), draftId: String(row.draft_id), sourceDayId: row.source_day_id ? String(row.source_day_id) : null, serviceDate: row.service_date ? String(row.service_date) : null, label: String(row.label || ''), startMinute: Number(row.start_minute || 480), endMinute: Number(row.end_minute || 960), sortOrder: Number(row.sort_order || 0), metadata: safeJson(row.metadata), blocks: blocks.filter((block) => String(block.day_id) === String(row.id)).sort((a,b)=>Number(a.start_minute)-Number(b.start_minute)).map(mapBlock) })

export async function findScenario(client: SupabaseClient, id: string) {
  const candidates = ['hsd_factory_scenarios', 'hsd_planning_scenarios', 'hsd_technical_plan_versions']
  for (const table of candidates) {
    const result = await client.from(table).select('*').eq('id', id).limit(1).maybeSingle()
    if (!result.error && result.data) return { table, scenario: normalizeScenario(result.data as Row) }
  }
  return null
}

export async function findScenariosForRequest(client: SupabaseClient, requestId: string) {
  const candidates = ['hsd_factory_scenarios', 'hsd_planning_scenarios']
  const keys = ['request_id', 'factory_request_id', 'planning_request_id']
  for (const table of candidates) for (const key of keys) {
    const result = await client.from(table).select('*').eq(key, requestId).limit(20)
    if (!result.error && result.data?.length) return (result.data as Row[]).map(normalizeScenario)
  }
  return []
}

export async function loadDraft(client: SupabaseClient, actor: ProductExperienceActor, workspaceKey: string) {
  const tenant = tenantId(actor), user = actorId(actor)
  const result = await client.from('hsd_px_workbench_drafts').select('*').eq('tenant_id', tenant).eq('user_id', user).eq('workspace_key', workspaceKey).maybeSingle()
  if (result.error) throw result.error
  if (!result.data) return null
  const daysResult = await client.from('hsd_px_timeline_days').select('*').eq('draft_id', result.data.id).order('sort_order')
  if (daysResult.error) throw daysResult.error
  const dayIds = (daysResult.data || []).map((row: Record<string, unknown>) => row.id)
  const blocksResult = dayIds.length ? await client.from('hsd_px_timeline_blocks').select('*').in('day_id', dayIds).order('start_minute') : { data: [], error: null }
  if (blocksResult.error) throw blocksResult.error
  return { id: String(result.data.id), workspaceKey: String(result.data.workspace_key), sourceType: String(result.data.source_type), sourceId: result.data.source_id ? String(result.data.source_id) : null, title: String(result.data.title || ''), state: safeJson(result.data.state), revision: Number(result.data.revision || 1), isDirty: Boolean(result.data.is_dirty), lastOpenedAt: String(result.data.last_opened_at), createdAt: String(result.data.created_at), updatedAt: String(result.data.updated_at), days: (daysResult.data as Row[]).map((day) => mapDay(day, blocksResult.data as Row[])) }
}

export async function upsertDraft(client: SupabaseClient, actor: ProductExperienceActor, input: { workspaceKey: string; sourceType: string; sourceId?: string | null; title?: string; state?: Record<string, unknown>; isDirty?: boolean }) {
  const row = { tenant_id: tenantId(actor), user_id: actorId(actor), workspace_key: safeText(input.workspaceKey, 240), source_type: safeText(input.sourceType, 80), source_id: input.sourceId ? safeText(input.sourceId, 180) : null, title: safeText(input.title || 'Workbench Service Design', 260), state: input.state || {}, is_dirty: Boolean(input.isDirty), last_opened_at: new Date().toISOString(), updated_at: new Date().toISOString() }
  const result = await client.from('hsd_px_workbench_drafts').upsert(row, { onConflict: 'tenant_id,user_id,workspace_key' }).select('*').single()
  if (result.error) throw result.error
  return result.data as Row
}


export async function persistTimelineDays(client: SupabaseClient, actor: ProductExperienceActor, draftId: string, days: ReturnType<typeof timelineFromScenario>) {
  const removed = await client.from('hsd_px_timeline_days').delete().eq('draft_id', draftId)
  if (removed.error) throw removed.error
  for (const day of days) {
    const dayResult = await client.from('hsd_px_timeline_days').insert({ tenant_id: tenantId(actor), user_id: actorId(actor), draft_id: draftId, source_day_id: day.sourceDayId, service_date: day.serviceDate, label: day.label, start_minute: day.startMinute, end_minute: day.endMinute, sort_order: day.sortOrder, metadata: day.metadata }).select('*').single()
    if (dayResult.error) throw dayResult.error
    if (day.blocks.length) {
      const blocks = day.blocks.map((block) => ({ tenant_id: tenantId(actor), user_id: actorId(actor), day_id: dayResult.data.id, source_activity_id: block.sourceActivityId, source_code: block.sourceCode, block_type: block.blockType, label: block.label, objective: block.objective, start_minute: block.startMinute, duration_minutes: block.durationMinutes, locked: block.locked, sort_order: block.sortOrder, metadata: block.metadata }))
      const blockResult = await client.from('hsd_px_timeline_blocks').insert(blocks)
      if (blockResult.error) throw blockResult.error
    }
  }
}

export async function initializeDraftFromScenario(client: SupabaseClient, actor: ProductExperienceActor, scenarioId: string) {
  const found = await findScenario(client, scenarioId)
  if (!found) throw Object.assign(new Error('Scénario introuvable. Aucun workbench artificiel n’a été créé.'), { status: 404 })
  const workspaceKey = `scenario:${scenarioId}`
  let draft = await loadDraft(client, actor, workspaceKey)
  if (draft) return draft
  const row = await upsertDraft(client, actor, { workspaceKey, sourceType: 'factory_scenario', sourceId: scenarioId, title: found.scenario.name, state: { categoryCode: found.scenario.categoryCode, universe: found.scenario.universe, promise: found.scenario.promise, rationale: found.scenario.rationale, price: { customerTotalDh: found.scenario.customerTotalDh, costTotalDh: found.scenario.costTotalDh, marginPercent: found.scenario.marginPercent }, selectedActivityIds: found.scenario.selectedActivityIds, selectedOptionIds: found.scenario.selectedOptionIds, warnings: found.scenario.warnings, sourceTable: found.table } })
  const draftId = String(row.id)
  const days = timelineFromScenario(found.scenario, draftId)
  await persistTimelineDays(client, actor, draftId, days)
  return loadDraft(client, actor, workspaceKey)
}

export async function recordHistory(client: SupabaseClient, actor: ProductExperienceActor, draftId: string, action: string, snapshot: Record<string, unknown>) {
  const result = await client.from('hsd_px_operation_history').insert({ tenant_id: tenantId(actor), user_id: actorId(actor), draft_id: draftId, action: safeText(action, 100), snapshot })
  if (result.error) throw result.error
}
