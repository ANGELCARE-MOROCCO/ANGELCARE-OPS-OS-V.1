import 'server-only'

import type { SupabaseClient } from '@supabase/supabase-js'
import { normalizeServiceDocumentSource } from '../sourceNormalization'
import type { ServiceDocumentSourceKind } from '../types'

type AnyRow = Record<string, unknown>

const ROOT_TABLES: Record<ServiceDocumentSourceKind, string[]> = {
  plan: ['hsd_technical_plans', 'hsd_technical_plan_versions', 'hsd_planning_scenarios', 'hsd_factory_scenarios'],
  sellable: ['hsd_sellables', 'hsd_sellable_versions', 'hsd_factory_sellables', 'hsd_service_products'],
  handoff: ['hsd_handoff_requests', 'hsd_handoffs'],
  executive: ['hsd_performance_snapshots', 'hsd_executive_snapshots'],
  custom: [],
}

const ROOT_KEYS = ['id', 'code', 'number', 'reference', 'request_code', 'plan_code', 'sellable_code', 'handoff_code']

const RELATED: Record<ServiceDocumentSourceKind, Array<{ name: string; tables: string[]; keys: string[] }>> = {
  plan: [
    { name: 'days', tables: ['hsd_plan_days', 'hsd_technical_plan_days', 'hsd_planning_days'], keys: ['plan_id', 'technical_plan_id', 'plan_version_id', 'scenario_id'] },
    { name: 'blocks', tables: ['hsd_plan_blocks', 'hsd_technical_plan_blocks', 'hsd_programme_blocks', 'hsd_planning_blocks'], keys: ['plan_id', 'technical_plan_id', 'plan_version_id', 'day_id', 'scenario_id'] },
    { name: 'activities', tables: ['hsd_plan_activity_links', 'hsd_scenario_activity_links'], keys: ['plan_id', 'technical_plan_id', 'scenario_id'] },
    { name: 'materials', tables: ['hsd_plan_material_requirements'], keys: ['plan_id', 'technical_plan_id', 'plan_version_id'] },
    { name: 'competencies', tables: ['hsd_plan_competency_requirements'], keys: ['plan_id', 'technical_plan_id', 'plan_version_id'] },
    { name: 'staffing', tables: ['hsd_plan_staffing_requirements'], keys: ['plan_id', 'technical_plan_id', 'plan_version_id'] },
    { name: 'risks', tables: ['hsd_plan_risk_controls', 'hsd_plan_safety_findings'], keys: ['plan_id', 'technical_plan_id', 'plan_version_id'] },
    { name: 'checklists', tables: ['hsd_plan_checklist_requirements'], keys: ['plan_id', 'technical_plan_id', 'plan_version_id'] },
    { name: 'reporting', tables: ['hsd_plan_reporting_requirements'], keys: ['plan_id', 'technical_plan_id', 'plan_version_id'] },
    { name: 'approvals', tables: ['hsd_plan_approvals', 'hsd_technical_plan_approvals'], keys: ['plan_id', 'technical_plan_id', 'plan_version_id'] },
  ],
  sellable: [
    { name: 'priceLines', tables: ['hsd_sellable_prices', 'hsd_sellable_price_lines', 'hsd_commercial_lines'], keys: ['sellable_id', 'sellable_version_id', 'service_product_id'] },
    { name: 'activities', tables: ['hsd_sellable_items', 'hsd_sellable_activity_links'], keys: ['sellable_id', 'sellable_version_id', 'service_product_id'] },
    { name: 'sites', tables: ['hsd_sellable_sites', 'hsd_deployment_sites'], keys: ['sellable_id', 'sellable_version_id', 'service_product_id'] },
    { name: 'approvals', tables: ['hsd_sellable_approvals', 'hsd_commercial_approvals'], keys: ['sellable_id', 'sellable_version_id', 'service_product_id'] },
    { name: 'lineage', tables: ['hsd_sellable_lineage', 'hsd_product_lineage'], keys: ['sellable_id', 'sellable_version_id', 'service_product_id'] },
  ],
  handoff: [
    { name: 'days', tables: ['hsd_handoff_sub_missions', 'hsd_handoff_days'], keys: ['handoff_id', 'handoff_request_id'] },
    { name: 'blocks', tables: ['hsd_handoff_programme_lines'], keys: ['handoff_id', 'handoff_request_id'] },
    { name: 'staffing', tables: ['hsd_handoff_staffing_requirements'], keys: ['handoff_id', 'handoff_request_id'] },
    { name: 'routes', tables: ['hsd_handoff_routes'], keys: ['handoff_id', 'handoff_request_id'] },
    { name: 'checklists', tables: ['hsd_handoff_checklist_requirements'], keys: ['handoff_id', 'handoff_request_id'] },
    { name: 'reporting', tables: ['hsd_handoff_report_requirements'], keys: ['handoff_id', 'handoff_request_id'] },
    { name: 'lineage', tables: ['hsd_handoff_lineage', 'hsd_handoff_ledger'], keys: ['handoff_id', 'handoff_request_id'] },
    { name: 'approvals', tables: ['hsd_handoff_approvals'], keys: ['handoff_id', 'handoff_request_id'] },
  ],
  executive: [
    { name: 'metrics', tables: ['hsd_performance_metric_values', 'hsd_executive_metrics'], keys: ['snapshot_id', 'performance_snapshot_id'] },
    { name: 'warnings', tables: ['hsd_enterprise_reconciliation_findings', 'hsd_security_findings'], keys: ['snapshot_id', 'performance_snapshot_id'] },
    { name: 'approvals', tables: ['hsd_production_release_decisions'], keys: ['snapshot_id', 'performance_snapshot_id'] },
  ],
  custom: [],
}

function safeId(value: string) {
  return value.trim().slice(0, 180)
}

async function tryOne(client: SupabaseClient, table: string, id: string): Promise<AnyRow | null> {
  for (const key of ROOT_KEYS) {
    const result = await client.from(table).select('*').eq(key, id).limit(1).maybeSingle()
    if (!result.error && result.data) return result.data as AnyRow
  }
  return null
}

async function tryRows(client: SupabaseClient, tables: string[], keys: string[], ids: string[]): Promise<AnyRow[]> {
  for (const table of tables) {
    for (const key of keys) {
      for (const id of ids) {
        if (!id) continue
        const result = await client.from(table).select('*').eq(key, id).limit(500)
        if (!result.error && Array.isArray(result.data) && result.data.length) return result.data as AnyRow[]
      }
    }
  }
  return []
}

export async function resolveServiceDocumentSource(client: SupabaseClient, kind: ServiceDocumentSourceKind, unsafeId: string) {
  const id = safeId(unsafeId)
  if (!id) return { source: normalizeServiceDocumentSource(kind, id, {}, {}, undefined), table: null, relatedTables: [] as string[] }
  if (kind === 'custom') {
    const draftResult = await client.from('hsd_px_workbench_drafts').select('*').eq('id', id).limit(1).maybeSingle()
    if (!draftResult.error && draftResult.data) {
      const daysResult = await client.from('hsd_px_timeline_days').select('*').eq('draft_id', id).order('sort_order')
      const dayRows = Array.isArray(daysResult.data) ? daysResult.data as AnyRow[] : []
      const dayIds = dayRows.map((day) => String(day.id || '')).filter(Boolean)
      const blocksResult = dayIds.length ? await client.from('hsd_px_timeline_blocks').select('*').in('day_id', dayIds).order('start_minute') : { data: [], error: null }
      const blocks = Array.isArray(blocksResult.data) ? blocksResult.data as AnyRow[] : []
      const state = draftResult.data.state && typeof draftResult.data.state === 'object' ? draftResult.data.state as AnyRow : {}
      const days = dayRows.map((day) => ({
        ...day,
        date: day.service_date,
        start_time: `${String(Math.floor(Number(day.start_minute || 0) / 60)).padStart(2, '0')}:${String(Number(day.start_minute || 0) % 60).padStart(2, '0')}`,
        end_time: `${String(Math.floor(Number(day.end_minute || 0) / 60)).padStart(2, '0')}:${String(Number(day.end_minute || 0) % 60).padStart(2, '0')}`,
        blocks: blocks.filter((block) => String(block.day_id || '') === String(day.id || '')).map((block) => ({
          ...block,
          start_time: `${String(Math.floor(Number(block.start_minute || 0) / 60)).padStart(2, '0')}:${String(Number(block.start_minute || 0) % 60).padStart(2, '0')}`,
          end_time: `${String(Math.floor((Number(block.start_minute || 0) + Number(block.duration_minutes || 0)) / 60)).padStart(2, '0')}:${String((Number(block.start_minute || 0) + Number(block.duration_minutes || 0)) % 60).padStart(2, '0')}`,
          activity_code: block.source_code,
        })),
      }))
      const root: AnyRow = {
        ...state,
        id,
        title: draftResult.data.title,
        code: draftResult.data.workspace_key,
        status: draftResult.data.is_dirty ? 'draft_dirty' : 'draft_saved',
        version: draftResult.data.revision,
        generated_at: draftResult.data.updated_at,
        category_code: state.categoryCode,
        universe: state.universe,
        promise: state.promise,
        objectives: state.objectives,
        outcomes: state.outcomes,
        pain_points: state.painPoints,
        contexts: state.contexts,
        routines: state.routines,
        warnings: state.warnings,
        total: (state.price as AnyRow | undefined)?.customerTotalDh,
        cost: (state.price as AnyRow | undefined)?.costTotalDh,
        margin: (state.price as AnyRow | undefined)?.marginPercent,
        days,
      }
      const source = normalizeServiceDocumentSource(kind, id, root, { days }, 'hsd_px_workbench_drafts')
      source.lineage.unshift({ label: 'Workbench', value: String(draftResult.data.workspace_key || id) })
      return { source, table: 'hsd_px_workbench_drafts', relatedTables: ['hsd_px_timeline_days', 'hsd_px_timeline_blocks'] }
    }
    return null
  }
  let root: AnyRow | null = null
  let table: string | null = null
  for (const candidate of ROOT_TABLES[kind]) {
    root = await tryOne(client, candidate, id)
    if (root) { table = candidate; break }
  }
  if (!root) return null
  const rootIds = [id, String(root.id || ''), String(root.plan_id || ''), String(root.sellable_id || ''), String(root.version_id || ''), String(root.scenario_id || ''), String(root.handoff_id || '')].filter(Boolean)
  const related: Record<string, unknown> = {}
  const relatedTables: string[] = []
  for (const descriptor of RELATED[kind]) {
    const result = await tryRows(client, descriptor.tables, descriptor.keys, rootIds)
    if (result.length) {
      related[descriptor.name] = result
      relatedTables.push(descriptor.tables[0])
    }
  }
  if (Array.isArray(related.days) && Array.isArray(related.blocks) && related.blocks.length) {
    const blocks = related.blocks as AnyRow[]
    related.days = (related.days as AnyRow[]).map((day) => ({ ...day, blocks: blocks.filter((block) => String(block.day_id || block.plan_day_id || '') === String(day.id || '')) }))
  }
  const source = normalizeServiceDocumentSource(kind, id, root, related, table || undefined)
  if (!source.lineage.some((item) => item.label === 'Source ID')) source.lineage.unshift({ label: 'Source ID', value: id })
  return { source, table, relatedTables }
}
