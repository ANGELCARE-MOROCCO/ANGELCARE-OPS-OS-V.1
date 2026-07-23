import 'server-only'

import { publicRevenueOsMessage } from '../errors'
import { createServiceClient } from '@/lib/supabase/server'
import type { CockpitIntervention, CockpitWatchlist, ExecutiveBrief, RevenueException } from './types'

export interface RawCockpitSources {
  objectives: any[]
  strategyObjectives: any[]
  signals: any[]
  strategies: any[]
  strategyModelRuns: any[]
  councilRuns: any[]
  councilReviews: any[]
  councilFindings: any[]
  councilContradictions: any[]
  councilDisagreements: any[]
  councilRedTeam: any[]
  councilClassifications: any[]
  approvalRequests: any[]
  approvalDecisions: any[]
  approvalConditions: any[]
  programs: any[]
  campaigns: any[]
  waves: any[]
  accountPlans: any[]
  missions: any[]
  tasks: any[]
  compilationRuns: any[]
  compilationBlueprints: any[]
  compilationConflicts: any[]
  propagationRuns: any[]
  executionActions: any[]
  adapterHealth: any[]
  deadLetters: any[]
  executionRetries: any[]
  compensations: any[]
  doctrines: any[]
  caseStudies: any[]
  campaignPatterns: any[]
  objectionPatterns: any[]
  cockpitExceptions: any[]
  cockpitInterventions: any[]
  cockpitBriefs: any[]
  cockpitWatchlists: any[]
  businessEvents: any[]
  sourceHealth: Record<string, { ok: boolean; message?: string }>
}

interface QuerySpec {
  key: keyof Omit<RawCockpitSources, 'sourceHealth'>
  table: string
  tenantScoped?: boolean
  limit?: number
  order?: string
  ascending?: boolean
  filters?: Array<{ column: string; operator: 'eq' | 'in'; value: unknown }>
}

async function database(): Promise<any> {
  return await createServiceClient() as any
}

const specs: QuerySpec[] = [
  { key: 'objectives', table: 'revenue_os_objectives', limit: 30, order: 'updated_at' },
  { key: 'strategyObjectives', table: 'revenue_os_strategy_objectives', tenantScoped: true, limit: 30, order: 'updated_at' },
  { key: 'signals', table: 'revenue_os_signals', limit: 100, order: 'detected_at' },
  { key: 'strategies', table: 'revenue_os_strategies', tenantScoped: true, limit: 80, order: 'updated_at' },
  { key: 'strategyModelRuns', table: 'revenue_os_strategy_model_runs', tenantScoped: true, limit: 80, order: 'updated_at' },
  { key: 'councilRuns', table: 'revenue_os_council_runs', tenantScoped: true, limit: 60, order: 'updated_at' },
  { key: 'councilReviews', table: 'revenue_os_council_reviews', tenantScoped: true, limit: 240, order: 'created_at' },
  { key: 'councilFindings', table: 'revenue_os_council_findings', tenantScoped: true, limit: 240, order: 'created_at' },
  { key: 'councilContradictions', table: 'revenue_os_council_contradictions', tenantScoped: true, limit: 120, order: 'created_at' },
  { key: 'councilDisagreements', table: 'revenue_os_council_disagreements', tenantScoped: true, limit: 120, order: 'updated_at' },
  { key: 'councilRedTeam', table: 'revenue_os_council_red_team_attacks', tenantScoped: true, limit: 120, order: 'created_at' },
  { key: 'councilClassifications', table: 'revenue_os_council_classifications', tenantScoped: true, limit: 80, order: 'updated_at' },
  { key: 'approvalRequests', table: 'revenue_os_approval_requests', tenantScoped: true, limit: 150, order: 'updated_at' },
  { key: 'approvalDecisions', table: 'revenue_os_approval_decisions', tenantScoped: true, limit: 150, order: 'created_at' },
  { key: 'approvalConditions', table: 'revenue_os_approval_conditions', tenantScoped: true, limit: 300, order: 'created_at' },
  { key: 'programs', table: 'revenue_os_programs', tenantScoped: true, limit: 80, order: 'updated_at' },
  { key: 'campaigns', table: 'revenue_os_campaigns', tenantScoped: true, limit: 160, order: 'updated_at' },
  { key: 'waves', table: 'revenue_os_campaign_waves', tenantScoped: true, limit: 240, order: 'updated_at' },
  { key: 'accountPlans', table: 'revenue_os_account_plans', tenantScoped: true, limit: 300, order: 'updated_at' },
  { key: 'missions', table: 'revenue_os_missions', tenantScoped: true, limit: 300, order: 'updated_at' },
  { key: 'tasks', table: 'revenue_os_mission_tasks', tenantScoped: true, limit: 600, order: 'updated_at' },
  { key: 'compilationRuns', table: 'revenue_os_compilation_runs', tenantScoped: true, limit: 80, order: 'updated_at' },
  { key: 'compilationBlueprints', table: 'revenue_os_compilation_blueprints', tenantScoped: true, limit: 80, order: 'updated_at' },
  { key: 'compilationConflicts', table: 'revenue_os_compilation_conflicts', tenantScoped: true, limit: 160, order: 'updated_at' },
  { key: 'propagationRuns', table: 'revenue_os_propagation_runs', tenantScoped: true, limit: 100, order: 'updated_at' },
  { key: 'executionActions', table: 'revenue_os_execution_actions', tenantScoped: true, limit: 700, order: 'updated_at' },
  { key: 'adapterHealth', table: 'revenue_os_adapter_health', tenantScoped: true, limit: 80, order: 'checked_at' },
  { key: 'deadLetters', table: 'revenue_os_execution_dead_letters', tenantScoped: true, limit: 120, order: 'created_at' },
  { key: 'executionRetries', table: 'revenue_os_execution_retries', tenantScoped: true, limit: 160, order: 'created_at' },
  { key: 'compensations', table: 'revenue_os_execution_compensations', tenantScoped: true, limit: 100, order: 'created_at' },
  { key: 'doctrines', table: 'revenue_os_doctrines', limit: 100, order: 'updated_at' },
  { key: 'caseStudies', table: 'revenue_os_case_studies', limit: 100, order: 'updated_at' },
  { key: 'campaignPatterns', table: 'revenue_os_campaign_patterns', limit: 100, order: 'updated_at' },
  { key: 'objectionPatterns', table: 'revenue_os_objection_patterns', limit: 100, order: 'updated_at' },
  { key: 'cockpitExceptions', table: 'revenue_os_cockpit_exceptions', tenantScoped: true, limit: 300, order: 'updated_at' },
  { key: 'cockpitInterventions', table: 'revenue_os_cockpit_interventions', tenantScoped: true, limit: 300, order: 'updated_at' },
  { key: 'cockpitBriefs', table: 'revenue_os_executive_briefs', tenantScoped: true, limit: 30, order: 'created_at' },
  { key: 'cockpitWatchlists', table: 'revenue_os_cockpit_watchlists', tenantScoped: true, limit: 100, order: 'updated_at' },
  { key: 'businessEvents', table: 'revenue_os_business_events', limit: 200, order: 'occurred_at' },
]

export async function loadCockpitSources(tenantId: string): Promise<RawCockpitSources> {
  const client = await database()
  const sourceHealth: RawCockpitSources['sourceHealth'] = {}
  const result: Record<string, any[]> = {}

  await Promise.all(specs.map(async (spec) => {
    try {
      let query = client.from(spec.table).select('*')
      if (spec.tenantScoped) query = query.eq('tenant_id', tenantId)
      for (const filter of spec.filters || []) {
        query = filter.operator === 'eq' ? query.eq(filter.column, filter.value) : query.in(filter.column, filter.value)
      }
      if (spec.order) query = query.order(spec.order, { ascending: spec.ascending ?? false })
      query = query.limit(spec.limit ?? 100)
      const response = await query
      if (response.error) throw response.error
      result[spec.key] = response.data || []
      sourceHealth[spec.key] = { ok: true }
    } catch (error) {
      result[spec.key] = []
      sourceHealth[spec.key] = { ok: false, message: publicRevenueOsMessage(error instanceof Error ? error.message : String(error)) }
    }
  }))

  return {
    objectives: result.objectives || [],
    strategyObjectives: result.strategyObjectives || [],
    signals: result.signals || [],
    strategies: result.strategies || [],
    strategyModelRuns: result.strategyModelRuns || [],
    councilRuns: result.councilRuns || [],
    councilReviews: result.councilReviews || [],
    councilFindings: result.councilFindings || [],
    councilContradictions: result.councilContradictions || [],
    councilDisagreements: result.councilDisagreements || [],
    councilRedTeam: result.councilRedTeam || [],
    councilClassifications: result.councilClassifications || [],
    approvalRequests: result.approvalRequests || [],
    approvalDecisions: result.approvalDecisions || [],
    approvalConditions: result.approvalConditions || [],
    programs: result.programs || [],
    campaigns: result.campaigns || [],
    waves: result.waves || [],
    accountPlans: result.accountPlans || [],
    missions: result.missions || [],
    tasks: result.tasks || [],
    compilationRuns: result.compilationRuns || [],
    compilationBlueprints: result.compilationBlueprints || [],
    compilationConflicts: result.compilationConflicts || [],
    propagationRuns: result.propagationRuns || [],
    executionActions: result.executionActions || [],
    adapterHealth: result.adapterHealth || [],
    deadLetters: result.deadLetters || [],
    executionRetries: result.executionRetries || [],
    compensations: result.compensations || [],
    doctrines: result.doctrines || [],
    caseStudies: result.caseStudies || [],
    campaignPatterns: result.campaignPatterns || [],
    objectionPatterns: result.objectionPatterns || [],
    cockpitExceptions: result.cockpitExceptions || [],
    cockpitInterventions: result.cockpitInterventions || [],
    cockpitBriefs: result.cockpitBriefs || [],
    cockpitWatchlists: result.cockpitWatchlists || [],
    businessEvents: result.businessEvents || [],
    sourceHealth,
  }
}

export async function saveCockpitSnapshot(input: { tenantId: string; roleView: string; sourceHash: string; payload: Record<string, unknown>; generatedAt: string }): Promise<void> {
  const client = await database()
  const response = await client.from('revenue_os_cockpit_snapshots').insert({
    tenant_id: input.tenantId,
    role_view: input.roleView,
    source_hash: input.sourceHash,
    generated_at: input.generatedAt,
    payload: input.payload,
  })
  if (response.error) throw response.error
}

export async function saveExecutiveBrief(tenantId: string, brief: ExecutiveBrief, sourceHash: string, actorId: string): Promise<void> {
  const client = await database()
  const response = await client.from('revenue_os_executive_briefs').insert({
    id: brief.id,
    tenant_id: tenantId,
    version: brief.version,
    status: 'generated',
    provider: brief.provider,
    source_hash: sourceHash,
    generated_by: actorId,
    payload: brief,
  })
  if (response.error) throw response.error
}

export async function upsertCockpitException(tenantId: string, exception: RevenueException): Promise<void> {
  const client = await database()
  const response = await client.from('revenue_os_cockpit_exceptions').upsert({
    id: exception.id,
    tenant_id: tenantId,
    exception_code: exception.code,
    exception_type: exception.exceptionType,
    priority: exception.priority,
    severity: exception.severity,
    status: exception.status,
    revenue_at_risk: exception.revenueAtRisk,
    owner_id: exception.ownerId,
    due_at: exception.dueAt,
    source_zone: exception.sourceZone,
    source_record_id: exception.sourceRecordId,
    acknowledged_at: exception.acknowledgedAt,
    resolved_at: exception.resolvedAt,
    payload: exception,
  }, { onConflict: 'tenant_id,exception_code' })
  if (response.error) throw response.error
}

export async function loadCockpitException(tenantId: string, exceptionId: string): Promise<RevenueException> {
  const client = await database()
  const response = await client.from('revenue_os_cockpit_exceptions').select('*').eq('tenant_id', tenantId).eq('id', exceptionId).maybeSingle()
  if (response.error || !response.data) throw response.error || new Error('COCKPIT_EXCEPTION_NOT_FOUND')
  return (response.data.payload || response.data) as RevenueException
}

export async function updateCockpitException(tenantId: string, exception: RevenueException): Promise<void> {
  const client = await database()
  const response = await client.from('revenue_os_cockpit_exceptions').update({
    status: exception.status,
    owner_id: exception.ownerId,
    due_at: exception.dueAt,
    acknowledged_at: exception.acknowledgedAt,
    resolved_at: exception.resolvedAt,
    updated_at: new Date().toISOString(),
    payload: exception,
  }).eq('tenant_id', tenantId).eq('id', exception.id)
  if (response.error) throw response.error
}

export async function findInterventionByIdempotency(tenantId: string, idempotencyKey: string): Promise<CockpitIntervention | null> {
  const client = await database()
  const response = await client.from('revenue_os_cockpit_interventions').select('*').eq('tenant_id', tenantId).eq('idempotency_key', idempotencyKey).maybeSingle()
  if (response.error) throw response.error
  return response.data ? (response.data.payload || response.data) as CockpitIntervention : null
}

export async function saveIntervention(intervention: CockpitIntervention, idempotencyKey: string): Promise<void> {
  const client = await database()
  const response = await client.from('revenue_os_cockpit_interventions').upsert({
    id: intervention.id,
    tenant_id: intervention.tenantId,
    exception_id: intervention.exceptionId,
    status: intervention.status,
    action_type: intervention.actionType,
    assigned_to: intervention.assignedTo,
    assigned_role: intervention.assignedRole,
    deadline: intervention.deadline,
    source_zone: intervention.sourceZone,
    source_object_id: intervention.sourceObjectId,
    created_by: intervention.createdBy,
    idempotency_key: idempotencyKey,
    payload: intervention,
  }, { onConflict: 'tenant_id,idempotency_key' })
  if (response.error) throw response.error
}

export async function saveAcknowledgement(input: { tenantId: string; exceptionId: string; actorId: string; note?: string; idempotencyKey: string }): Promise<void> {
  const client = await database()
  const response = await client.from('revenue_os_cockpit_acknowledgements').upsert({
    tenant_id: input.tenantId,
    exception_id: input.exceptionId,
    actor_id: input.actorId,
    note: input.note,
    idempotency_key: input.idempotencyKey,
    acknowledged_at: new Date().toISOString(),
  }, { onConflict: 'tenant_id,idempotency_key' })
  if (response.error) throw response.error
}

export async function saveCockpitView(input: { tenantId: string; actorId: string; name: string; roleView: string; layout: Record<string, unknown>; filters: Record<string, unknown>; isDefault: boolean; idempotencyKey: string }): Promise<Record<string, unknown>> {
  const client = await database()
  const row = {
    tenant_id: input.tenantId,
    name: input.name,
    role_view: input.roleView,
    owner_id: input.actorId,
    layout: input.layout,
    filters: input.filters,
    is_default: input.isDefault,
    idempotency_key: input.idempotencyKey,
  }
  const response = await client.from('revenue_os_cockpit_views').upsert(row, { onConflict: 'tenant_id,idempotency_key' }).select('*').single()
  if (response.error) throw response.error
  return response.data as Record<string, unknown>
}

export async function saveWatchlist(input: CockpitWatchlist & { tenantId: string; idempotencyKey: string }): Promise<void> {
  const client = await database()
  const response = await client.from('revenue_os_cockpit_watchlists').upsert({
    id: input.id,
    tenant_id: input.tenantId,
    name: input.name,
    object_types: input.objectTypes,
    object_ids: input.objectIds,
    filters: input.filters,
    created_by: input.createdBy,
    idempotency_key: input.idempotencyKey,
    payload: input,
  }, { onConflict: 'tenant_id,idempotency_key' })
  if (response.error) throw response.error
}

export async function writeCockpitAudit(input: { tenantId: string; actorId: string; action: string; sourceZone?: string; sourceObjectId?: string; idempotencyKey?: string; payload: Record<string, unknown> }): Promise<void> {
  const client = await database()
  const response = await client.from('revenue_os_cockpit_audit_events').insert({
    tenant_id: input.tenantId,
    actor_id: input.actorId,
    action: input.action,
    source_zone: input.sourceZone,
    source_object_id: input.sourceObjectId,
    idempotency_key: input.idempotencyKey,
    payload: input.payload,
  })
  if (response.error) throw response.error
}
