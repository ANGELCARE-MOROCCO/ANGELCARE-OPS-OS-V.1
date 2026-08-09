import 'server-only'
import { createHash, randomUUID } from 'node:crypto'
import type { HomeServiceUser } from '@/lib/homeservice-design/server/auth'
import { userId, userLabel } from '@/lib/homeservice-design/server/auth'
import type { FactoryComposeInput, FactoryScenario } from '@/types/homeservice-factory'
import { factoryDb } from './catalogue'

const TENANT = 'angelcare-main'

async function audit(user: HomeServiceUser, action: string, entityType: string, entityId: string, label: string, payload: unknown) {
  const db = factoryDb()
  if (!db) return null
  const correlationId = randomUUID()
  await Promise.all([
    db.from('hsd_audit_events').insert({ tenant_id: TENANT, actor_id: userId(user), actor_label: userLabel(user), action, entity_type: entityType, entity_id: entityId, entity_label: label, correlation_id: correlationId, payload }),
    db.from('hsd_outbox_events').insert({ tenant_id: TENANT, event_type: `homeservice.factory.${action}`, aggregate_type: entityType, aggregate_id: entityId, correlation_id: correlationId, payload }),
  ])
  return correlationId
}

export async function persistFactoryComposition(args: { requestId: string; input: FactoryComposeInput; scenarios: FactoryScenario[]; sourceHash: string }, user: HomeServiceUser) {
  const db = factoryDb()
  if (!db) throw Object.assign(new Error('Base HomeService non configurée.'), { status: 503, code: 'DATABASE_NOT_CONFIGURED' })
  const requestCode = `HSF-${Date.now().toString(36).toUpperCase()}`
  const { error: requestError } = await db.from('hsd_factory_requests').insert({
    id: args.requestId, tenant_id: TENANT, code: requestCode, mode: args.input.mode, universe: args.input.universe, category_id: args.input.categoryId,
    status: 'generated', conditions: args.input, blueprint_code: args.input.blueprintCode || null, blueprint_version: args.input.blueprintVersion || null, preset_code: args.input.presetCode || null, structured_configuration: args.input.structuredSelections || {}, requested_scenario_count: args.input.requestedScenarioCount, source_hash: args.sourceHash, created_by: userId(user),
  })
  if (requestError) throw requestError
  const payload = args.scenarios.map((scenario) => ({
    id: scenario.id, tenant_id: TENANT, request_id: args.requestId, scenario_number: scenario.scenarioNumber, status: 'generated',
    name: scenario.name, promise: scenario.promise, positioning: scenario.positioning, rationale: scenario.rationale,
    mode: scenario.mode, universe: scenario.universe, category_id: scenario.categoryId, category_code: scenario.categoryCode, category_name: scenario.categoryName,
    selected_activity_ids: scenario.selectedActivityIds, selected_option_ids: scenario.selectedOptionIds,
    plan_snapshot: scenario.days, price_snapshot: scenario.price, warnings: scenario.warnings,
    provider_route: scenario.providerRoute, actual_model: scenario.actualModel, blueprint_code: scenario.blueprintCode || null, blueprint_version: scenario.blueprintVersion || null, preset_code: scenario.presetCode || null, configuration_snapshot: scenario.configurationSnapshot || {}, created_by: userId(user),
  }))
  const { error: scenarioError } = await db.from('hsd_factory_scenarios').insert(payload)
  if (scenarioError) throw scenarioError
  if (args.input.blueprintCode) {
    await db.from('hsd_category_experience_usage').insert({ tenant_id: TENANT, category_id: args.input.categoryId, blueprint_code: args.input.blueprintCode, preset_code: args.input.presetCode || null, factory_request_id: args.requestId, configuration_snapshot: args.input.structuredSelections || {}, created_by: userId(user) })
  }
  const correlationId = await audit(user, 'scenarios_generated', 'factory_request', args.requestId, requestCode, { scenarioCount: args.scenarios.length, sourceHash: args.sourceHash })
  return { requestCode, correlationId }
}

export async function loadFactoryScenarioIds(ids: string[]) {
  const db = factoryDb()
  if (!db) throw Object.assign(new Error('Base HomeService non configurée.'), { status: 503 })
  const { data, error } = await db.from('hsd_factory_scenarios').select('*').eq('tenant_id', TENANT).in('id', ids)
  if (error) throw error
  return data || []
}

export async function publishFactoryScenarios(input: unknown, user: HomeServiceUser) {
  const body = (input && typeof input === 'object' ? input : {}) as Record<string, unknown>
  const scenarioIds = Array.isArray(body.scenarioIds) ? Array.from(new Set(body.scenarioIds.map(String))).slice(0, 10) : []
  if (!scenarioIds.length) throw Object.assign(new Error('Sélectionnez au moins un résultat.'), { status: 422 })
  const scenarios = await loadFactoryScenarioIds(scenarioIds)
  if (scenarios.length !== scenarioIds.length) throw Object.assign(new Error('Un ou plusieurs résultats sont introuvables.'), { status: 422 })
  const db = factoryDb()!
  const published = []
  for (const scenario of scenarios) {
    const code = `HSFS-${Date.now().toString(36).toUpperCase()}-${String(scenario.scenario_number).padStart(2, '0')}`
    const snapshot = { scenarioId: scenario.id, requestId: scenario.request_id, categoryId: scenario.category_id, categoryCode: scenario.category_code, blueprintCode: scenario.blueprint_code || null, blueprintVersion: scenario.blueprint_version || null, presetCode: scenario.preset_code || null, configuration: scenario.configuration_snapshot || {}, plan: scenario.plan_snapshot, price: scenario.price_snapshot, activities: scenario.selected_activity_ids, options: scenario.selected_option_ids }
    const checksum = createHash('sha256').update(JSON.stringify(snapshot)).digest('hex')
    const { data, error } = await db.from('hsd_factory_sellables').insert({
      tenant_id: TENANT, code, universe: body.universe === 'b2b' ? 'b2b' : body.universe === 'b2c' ? 'b2c' : scenario.universe || 'b2c', status: 'published',
      commercial_name: scenario.name, technical_name: `${scenario.category_name} · ${scenario.name}`, promise: scenario.promise,
      category_id: scenario.category_id, factory_scenario_id: scenario.id, blueprint_code: scenario.blueprint_code || null, blueprint_version: scenario.blueprint_version || null, preset_code: scenario.preset_code || null, active_version: 1, snapshot, checksum,
      starting_price_dh: scenario.price_snapshot?.customerTotalDh ?? null, margin_percent: scenario.price_snapshot?.marginPercent ?? null,
      readiness: 'ready', published_by: userId(user), published_at: new Date().toISOString(), created_by: userId(user),
    }).select('*').single()
    if (error) throw error
    await db.from('hsd_factory_scenarios').update({ status: 'published', selected_at: new Date().toISOString(), selected_by: userId(user) }).eq('id', scenario.id)
    published.push(data)
  }
  const correlationId = await audit(user, 'sellables_published', 'factory_sellable_batch', randomUUID(), `${published.length} référence(s)`, { scenarioIds, sellableIds: published.map((row) => row.id) })
  return { published, correlationId }
}

export async function loadFactorySellables(universe?: 'b2c' | 'b2b') {
  const db = factoryDb()
  if (!db) return []
  let query = db.from('hsd_factory_sellables').select('*').eq('tenant_id', TENANT).eq('status', 'published').order('published_at', { ascending: false })
  if (universe) query = query.eq('universe', universe)
  const { data, error } = await query
  if (error) return []
  return data || []
}
