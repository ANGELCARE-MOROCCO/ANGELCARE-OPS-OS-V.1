import { composeFactoryScenarios, validateFactoryInput } from '@/lib/homeservice-factory/server/composer'
import { persistFactoryComposition } from '@/lib/homeservice-factory/server/repository'
import type { FactoryComposeInput, FactoryScenario } from '@/types/homeservice-factory'
import { masteryClient } from './server'
import { userId, type HomeServiceUser } from '@/lib/homeservice-design/server/auth'

function arr(value: unknown): string[] {
  if (Array.isArray(value)) return value.map(String).filter(Boolean)
  if (typeof value === 'string') return value.split(/[|,;]/).map((item) => item.trim()).filter(Boolean)
  return []
}

function rec(value: unknown): Record<string, any> { return value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, any> : {} }
function uuidOrNull(value: unknown) { const text = String(value || ''); return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(text) ? text : null }

export async function listPlanningRequests() {
  const client = await masteryClient(false)
  const result = await client.from('hsd_planning_requests').select('*').order('updated_at', { ascending: false }).limit(100)
  if (result.error) throw result.error
  return result.data || []
}

export async function createPlanningRequest(input: Record<string, any>, actor: HomeServiceUser) {
  const client = await masteryClient(true)
  const categoryId = String(input.categoryId || input.category_id || '')
  if (!categoryId) throw Object.assign(new Error('Catégorie requise.'), { status: 400 })
  const category = await client.from('hsd_service_categories').select('id,code,commercial_name_fr').eq('id', categoryId).maybeSingle()
  if (category.error) throw category.error
  if (!category.data) throw Object.assign(new Error('Catégorie introuvable.'), { status: 404 })
  const code = `HSD-REQ-${Date.now().toString(36).toUpperCase()}`
  const tenantId = String(input.tenantId || input.tenant_id || '')
  if (!/^[0-9a-f-]{36}$/i.test(tenantId)) throw Object.assign(new Error('Le tenant UUID de planification est requis par le schéma UMZ2.'), { status: 422, code: 'PLANNING_TENANT_UUID_REQUIRED' })
  const result = await client.from('hsd_planning_requests').insert({
    tenant_id: tenantId, code, title: String(input.title || `Planification · ${category.data.commercial_name_fr}`), status: 'draft',
    category_id: categoryId, service_version_id: input.serviceVersionId || null, universe: input.universe === 'b2b' ? 'b2b' : 'b2c',
    mission_format: String(input.missionFormat || 'single_mission'), customer_profile: String(input.customerProfile || 'family'),
    objectives: arr(input.objectives), outcomes: arr(input.outcomes), environment: rec(input.environment), constraints: rec(input.constraints),
    requested_scenario_count: Math.max(1, Math.min(10, Number(input.requestedScenarioCount || 3))), created_by: uuidOrNull(userId(actor)),
  }).select('*').single()
  if (result.error) throw result.error
  return result.data
}

async function requestContext(requestId: string) {
  const client = await masteryClient(true)
  const request = await client.from('hsd_planning_requests').select('*').eq('id', requestId).single()
  if (request.error) throw request.error
  const [category, dates, beneficiaries, objectives, blueprint] = await Promise.all([
    client.from('hsd_service_categories').select('*').eq('id', request.data.category_id).single(),
    client.from('hsd_planning_request_dates').select('*').eq('request_id', requestId).order('service_date'),
    client.from('hsd_planning_request_beneficiaries').select('*').eq('request_id', requestId).order('created_at'),
    client.from('hsd_planning_request_objectives').select('*').eq('request_id', requestId).order('priority'),
    client.from('hsd_category_experience_blueprints').select('*').eq('category_id', request.data.category_id).eq('status', 'active').order('version_number', { ascending: false }).limit(1).maybeSingle(),
  ])
  if (category.error) throw category.error
  if (dates.error) throw dates.error
  if (beneficiaries.error) throw beneficiaries.error
  if (objectives.error) throw objectives.error
  if (blueprint.error) throw blueprint.error
  let preset: Record<string, any> | null = null
  if (blueprint.data) {
    const presetResult = await client.from('hsd_category_experience_presets').select('*').eq('blueprint_id', blueprint.data.id).eq('status', 'active').order('sort_order').limit(1).maybeSingle()
    if (presetResult.error) throw presetResult.error
    preset = presetResult.data
  }
  return { client, request: request.data, category: category.data, dates: dates.data || [], beneficiaries: beneficiaries.data || [], objectives: objectives.data || [], blueprint: blueprint.data, preset }
}

export async function generatePlanningScenarios(requestId: string, actor: HomeServiceUser, input: Record<string, any> = {}) {
  const started = Date.now()
  const ctx = await requestContext(requestId)
  if (!ctx.dates.length) throw Object.assign(new Error('Ajoutez au moins une date réelle avant la composition.'), { status: 422, code: 'NO_PLANNING_DATES' })
  const firstBeneficiary = ctx.beneficiaries[0] || {}
  const requestObjectives = ctx.objectives.map((item: Record<string, any>) => String(item.objective_code)).filter(Boolean)
  const environment = rec(ctx.request.environment)
  const constraints = rec(ctx.request.constraints)
  const factoryInput: FactoryComposeInput = validateFactoryInput({
    blueprintCode: ctx.blueprint?.code,
    blueprintVersion: ctx.blueprint?.version_number,
    presetCode: ctx.preset?.code,
    structuredSelections: { ...environment, ...constraints, sourcePlanningRequestId: requestId },
    mode: String(ctx.request.mission_format || '').includes('multi') ? 'multi_mission' : 'single_mission',
    universe: ctx.request.universe === 'b2b' ? 'b2b' : 'b2c',
    categoryId: ctx.request.category_id,
    customerSegment: ctx.request.customer_profile || 'family',
    ageYears: Number(firstBeneficiary.age_years ?? input.ageYears ?? 4),
    beneficiaryCount: Math.max(1, ctx.beneficiaries.length || Number(input.beneficiaryCount || 1)),
    objectiveCodes: requestObjectives.length ? requestObjectives : arr(ctx.request.objectives).length ? arr(ctx.request.objectives) : ['safe_supervision'],
    contextCodes: arr(environment.contextCodes || environment.contexts || constraints.contextCodes),
    painPointCodes: arr(environment.painPointCodes || constraints.painPointCodes),
    outcomeCodes: arr(ctx.request.outcomes),
    dates: ctx.dates.map((date: Record<string, any>) => ({ serviceDate: String(date.service_date), startTime: String(date.start_time).slice(0, 5), endTime: String(date.end_time).slice(0, 5) })),
    includeMeal: Boolean(constraints.includeMeal || environment.includeMeal), includeSnack: Boolean(constraints.includeSnack || environment.includeSnack),
    includeRest: Boolean(constraints.includeRest || environment.includeRest), includeHygiene: Boolean(constraints.includeHygiene || environment.includeHygiene),
    maxActivitiesPerDay: Math.max(1, Number(constraints.maxActivitiesPerDay || input.maxActivitiesPerDay || 8)),
    maxOptions: Math.max(0, Number(constraints.maxOptions || input.maxOptions || 4)),
    requestedScenarioCount: Math.max(1, Math.min(10, Number(input.scenarioCount || ctx.request.requested_scenario_count || 3))),
    notes: String(input.notes || ''),
  })
  let composed: Awaited<ReturnType<typeof composeFactoryScenarios>>
  try {
    composed = await composeFactoryScenarios(factoryInput)
  } catch (error) {
    const text = error instanceof Error ? `${error.name} ${error.message}` : String(error)
    if (!/abort|timeout/i.test(text)) throw error
    composed = await composeFactoryScenarios(factoryInput)
  }
  const persistence = await persistFactoryComposition({ ...composed, input: factoryInput }, actor)
  const scenarios = ((persistence as any).scenarios || composed.scenarios) as FactoryScenario[]
  const run = await ctx.client.from('hsd_generation_runs').insert({
    tenant_id: ctx.request.tenant_id, request_id: requestId, status: 'completed', provider_route: 'openrouter/free',
    actual_model: scenarios[0]?.actualModel || null, started_at: new Date(started).toISOString(), completed_at: new Date().toISOString(), duration_ms: Date.now() - started,
    created_by: uuidOrNull(userId(actor)),
  }).select('*').single()
  if (run.error) throw run.error
  const created: Record<string, any>[] = []
  for (const scenario of scenarios) {
    const scenarioCode = `HSD-SCN-${requestId.slice(0, 6).toUpperCase()}-${scenario.scenarioNumber}-${Date.now().toString(36).toUpperCase()}`
    const inserted = await ctx.client.from('hsd_plan_scenarios').insert({
      tenant_id: ctx.request.tenant_id, request_id: requestId, generation_run_id: run.data.id, code: scenarioCode, name: scenario.name,
      intent: scenario.positioning || scenario.mode, thesis: scenario.rationale || scenario.promise, status: 'generated', customer_fit: scenario.promise,
      beneficiary_fit: scenario.positioning, total_minutes: scenario.days.reduce((sum: number, day: any) => sum + Number(day.totalMinutes || 0), 0),
      staffing: { beneficiaryCount: factoryInput.beneficiaryCount }, resources: { selectedOptionIds: scenario.selectedOptionIds },
      safety: { warnings: scenario.warnings }, deterministic_status: scenario.warnings.length ? 'conditional' : 'valid', provider_route: 'openrouter/free', actual_model: scenario.actualModel,
    }).select('*').single()
    if (inserted.error) throw inserted.error
    for (const day of scenario.days) {
      const dayRow = await ctx.client.from('hsd_plan_scenario_days').insert({
        tenant_id: ctx.request.tenant_id, scenario_id: inserted.data.id, service_date: day.serviceDate, day_number: day.dayNumber,
        objective: day.objective, progression_phase: day.progressionPhase, start_time: day.startTime, end_time: day.endTime,
        gross_minutes: day.totalMinutes, usable_minutes: day.timeline.reduce((sum: number, block: any) => sum + Number(block.durationMinutes || 0), 0),
        status: 'valid', messages: [],
      }).select('*').single()
      if (dayRow.error) throw dayRow.error
      if (day.timeline.length) {
        const blocks = await ctx.client.from('hsd_plan_scenario_blocks').insert(day.timeline.map((block: any, index: number) => ({
          tenant_id: ctx.request.tenant_id, day_id: dayRow.data.id, activity_id: uuidOrNull(block.sourceId), activity_code: block.sourceCode,
          label: block.label, block_kind: block.sourceType === 'system_routine' ? 'care' : 'learning', start_time: block.startTime, end_time: block.endTime,
          duration_minutes: block.durationMinutes, objective: block.objective, beneficiary_ids: ctx.beneficiaries.map((beneficiary: Record<string, any>) => beneficiary.id),
          locked: block.sourceType === 'system_routine', status: 'valid', messages: [], sort_order: index,
        })))
        if (blocks.error) throw blocks.error
      }
    }
    created.push(inserted.data)
  }
  await ctx.client.from('hsd_planning_requests').update({ status: 'generated', updated_at: new Date().toISOString() }).eq('id', requestId)
  return { requestId, run: run.data, scenarios: created, factoryRequestCode: (persistence as any).requestCode || null, actualModel: scenarios[0]?.actualModel || null }
}

export async function validateTechnicalPlan(planId: string, actor: HomeServiceUser) {
  const client = await masteryClient(true)
  const plan = await client.from('hsd_technical_plans').select('*').eq('id', planId).single()
  if (plan.error) throw plan.error
  const versions = await client.from('hsd_technical_plan_versions').select('*').eq('plan_id', planId).order('version_number', { ascending: false }).limit(1)
  if (versions.error) throw versions.error
  const version = versions.data?.[0]
  const findings: Array<{ discipline: string; severity: string; rule_code: string; title: string; detail: string; consequence: string; corrective_action: string }> = []
  if (!version) findings.push({ discipline: 'version', severity: 'blocking', rule_code: 'NO_VERSION', title: 'Aucune version technique', detail: 'Le plan ne possède aucune version.', consequence: 'Aucun document ni handoff ne peut être produit.', corrective_action: 'Créez une version depuis un scénario.' })
  let days: Record<string, any>[] = []
  if (version) {
    const dayResult = await client.from('hsd_technical_plan_days').select('*').eq('version_id', version.id).order('day_number')
    if (dayResult.error) throw dayResult.error
    days = dayResult.data || []
    if (!days.length) findings.push({ discipline: 'planning', severity: 'blocking', rule_code: 'NO_DAYS', title: 'Programme vide', detail: 'Aucun jour technique n’est défini.', consequence: 'La mission ne peut pas être transmise.', corrective_action: 'Ajoutez ou régénérez les jours du programme.' })
    for (const day of days) {
      const blocks = await client.from('hsd_technical_plan_blocks').select('*').eq('plan_day_id', day.id)
      if (blocks.error) throw blocks.error
      if (!(blocks.data || []).length) findings.push({ discipline: 'timeline', severity: 'major', rule_code: `EMPTY_DAY_${day.day_number}`, title: `Jour ${day.day_number} sans bloc`, detail: `${day.service_date} ne contient aucun bloc opérationnel.`, consequence: 'Le terrain ne dispose pas de déroulé.', corrective_action: 'Ajoutez des activités et routines.' })
    }
  }
  const status = findings.some((item) => item.severity === 'blocking') ? 'blocked' : findings.length ? 'conditional' : 'valid'
  const run = await client.from('hsd_plan_validation_runs').insert({ tenant_id: plan.data.tenant_id, plan_id: planId, version_id: version?.id || null, status, completed_at: new Date().toISOString(), reviewed_by: uuidOrNull(userId(actor)) }).select('*').single()
  if (run.error) throw run.error
  if (findings.length) {
    const inserted = await client.from('hsd_plan_validation_findings').insert(findings.map((finding) => ({ tenant_id: plan.data.tenant_id, validation_run_id: run.data.id, plan_id: planId, ...finding, status: 'open', evidence: [] })))
    if (inserted.error) throw inserted.error
  }
  await client.from('hsd_technical_plans').update({ status: status === 'valid' ? 'validated' : status === 'blocked' ? 'correction_required' : 'validation_required', updated_at: new Date().toISOString() }).eq('id', planId)
  return { run: run.data, findings, status }
}
