import 'server-only'
import crypto from 'node:crypto'
import { createServiceClient } from '@/lib/supabase/server'
import { writeRevenueOsAuditEvent } from '../repository'
import { runGeminiStrategyAssembly } from '../strategy-brain/ai-orchestration'
import { normalizeObjective } from '../strategy-brain/objective-normalizer'
import type { RevenueObjective } from '../strategy-brain/types'
import { compileApprovedStrategy } from '../mission-compiler/service'
import type { LiveEntityType, LiveOperation, LiveOperationInput, LiveOperationResult } from './types'

type Row = Record<string, any>
const tableOf: Record<LiveEntityType, string> = {
  objective: 'revenue_os_objectives', strategy: 'revenue_os_strategies', program: 'revenue_os_programs',
  mission: 'revenue_os_missions', task: 'revenue_os_mission_tasks', exception: 'revenue_os_operational_exceptions',
}
const statusFor: Partial<Record<LiveOperation, string>> = {
  activate: 'active', start: 'running', pause: 'paused', resume: 'active', complete: 'completed',
  close: 'closed', reopen: 'active', cancel: 'cancelled', archive: 'archived', retry: 'running',
  publish: 'active', unpublish: 'draft', execute: 'running', schedule: 'scheduled', reschedule: 'scheduled',
}
function asObject(value: unknown): Record<string, unknown> { return value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : {} }
function stringValue(value: unknown, fallback = '') { return typeof value === 'string' ? value.trim() : value == null ? fallback : String(value).trim() }
function codeValue(value: unknown, prefix: string) { const valueString = stringValue(value).toUpperCase().replace(/[^A-Z0-9._:-]+/g, '-').replace(/^-+|-+$/g, ''); return valueString || `${prefix}-${Date.now()}` }

async function loadRow(client: any, tenantId: string, entityType: LiveEntityType, entityId: string) {
  let query = client.from(tableOf[entityType]).select('*').eq('id', entityId)
  if (entityType !== 'objective') query = query.eq('tenant_id', tenantId)
  const result = await query.maybeSingle()
  if (result.error) throw result.error
  if (!result.data) throw new Error(`${entityType.toUpperCase()}_NOT_FOUND`)
  return result.data as Row
}

function createPayload(entityType: LiveEntityType, input: LiveOperationInput) {
  const changes = asObject(input.changes)
  const now = new Date().toISOString()
  const id = stringValue(changes.id) || crypto.randomUUID()
  const title = stringValue(changes.title, `${entityType} Revenue OS`)
  const code = codeValue(changes.code, entityType.toUpperCase())
  const payload = { ...changes, id, code, title, status: stringValue(changes.status, 'active'), ownerId: stringValue(changes.ownerId, input.actorId), ownerLabel: stringValue(changes.ownerLabel, input.actorLabel), createdBy: input.actorId, createdByLabel: input.actorLabel, createdAt: now, updatedAt: now, trustedOperatorLive: true }
  if (entityType === 'exception') return { id, tenant_id: input.tenantId, code, title, severity: stringValue(changes.severity, 'high'), status: stringValue(changes.status, 'active'), owner_id: stringValue(changes.ownerId, input.actorId), due_at: changes.dueAt || null, source_type: stringValue(changes.sourceType, 'manual'), source_id: changes.sourceId || null, revenue_impact_dh: Number(changes.revenueImpactDh || 0), payload, created_at: now, updated_at: now }
  if (entityType === 'objective') {
    const mandate = stringValue(changes.mandate, stringValue(changes.description))
    if (title.length < 8) throw new Error('OBJECTIVE_TITLE_MINIMUM_8_CHARACTERS')
    if (mandate.length < 20) throw new Error('OBJECTIVE_MANDATE_MINIMUM_20_CHARACTERS')
    return { id, code, title, mandate, business_unit: stringValue(changes.businessUnit, 'ANGELCARE'), target_market: stringValue(changes.targetMarket, 'Maroc'), horizon: stringValue(changes.horizon, '30 jours'), priority: stringValue(changes.priority, 'high'), status: stringValue(changes.status, 'active'), execution_mode: 'live', owner_id: stringValue(changes.ownerId, input.actorId), owner_label: stringValue(changes.ownerLabel, input.actorLabel), source: 'manual', metadata: { ...payload, tenantId: input.tenantId }, updated_at: now }
  }
  if (entityType === 'strategy') return { id, tenant_id: input.tenantId, objective_id: changes.objectiveId, code, title, status: stringValue(changes.status, 'active'), version: stringValue(changes.version, '1.0.0'), payload, created_at: now, updated_at: now }
  const compilationRunId = stringValue(changes.compilationRunId)
  const strategyId = stringValue(changes.strategyId)
  return { id, tenant_id: input.tenantId, compilation_run_id: compilationRunId || null, strategy_id: strategyId || null, strategy_version: stringValue(changes.strategyVersion, '1.0.0'), code, status: stringValue(changes.status, 'active'), external_actions: 0, payload, created_at: now, updated_at: now }
}

function objectiveFromRow(row: Row, input: LiveOperationInput): RevenueObjective {
  const metadata = asObject(row.metadata)
  const payload = { ...metadata, ...asObject(metadata.payload) }
  const array = (value: unknown) => Array.isArray(value) ? value.map(String).filter(Boolean) : stringValue(value) ? stringValue(value).split('|').map((item)=>item.trim()).filter(Boolean) : []
  return normalizeObjective({
    id: String(row.id), tenantId: input.tenantId, title: stringValue(row.title, 'Mandat Revenue live'), objectiveType: stringValue(payload.objectiveType || payload.objective_type, 'growth'), businessReason: stringValue(payload.businessReason || payload.description || row.mandate, stringValue(row.mandate, row.title)), businessUnits: array(payload.businessUnits || payload.business_unit || row.business_unit), targetMarkets: array(payload.targetMarkets || payload.target_market || row.target_market), targetSegments: array(payload.targetSegments || payload.segments), territories: array(payload.territories || row.target_market), targetAccounts: array(payload.targetAccounts || payload.namedAccounts), revenueTarget: Number(payload.revenueTarget || payload.revenue_target_dh || 0) || undefined, marginTarget: Number(payload.marginTarget || payload.minimum_margin_percent || 0) || undefined, timeHorizon: stringValue(payload.timeHorizon || payload.horizon || row.horizon, '30 jours'), deadline: stringValue(payload.deadline || payload.due_date) || undefined, priority: (['low','normal','high','critical'].includes(stringValue(row.priority)) ? stringValue(row.priority) : 'high') as RevenueObjective['priority'], budgetLimit: Number(payload.budgetLimit || payload.budget_limit_dh || 0) || undefined, capacityLimit: Number(payload.capacityLimit || 0) || undefined, approvedOffers: array(payload.approvedOffers || payload.approved_offers), excludedOffers: array(payload.excludedOffers), approvedChannels: array(payload.approvedChannels || payload.approved_channels), excludedChannels: array(payload.excludedChannels), riskAppetite: (['conservative','balanced','aggressive'].includes(stringValue(payload.riskAppetite || payload.risk_appetite)) ? stringValue(payload.riskAppetite || payload.risk_appetite) : 'balanced') as RevenueObjective['riskAppetite'], authorityLevel: 'full', constraints: array(payload.constraints || payload.capacity_constraints), successDefinition: array(payload.successDefinition || payload.success_criteria), failureDefinition: array(payload.failureDefinition || payload.failure_conditions), requestedBy: input.actorId, status: 'active',
  }).objective
}

async function mutateOne(input: LiveOperationInput, entityId?: string): Promise<LiveOperationResult> {
  const client = await createServiceClient() as any
  const now = new Date().toISOString()
  if (input.operation === 'create') {
    const row = createPayload(input.entityType, input)
    const result = await client.from(tableOf[input.entityType]).insert(row).select('*').single()
    if (result.error) throw result.error
    const createdId = String(result.data.id)
    await writeRevenueOsAuditEvent({ action: `${input.entityType}.created_live`, actorId: input.actorId, actorLabel: input.actorLabel, actorType: 'user', resourceType: `revenue_os_${input.entityType}`, resourceId: createdId, outcome: 'success', summary: `${input.entityType} créé en exécution live.`, metadata: { operation: input.operation, reason: input.reason, changes: input.changes } }, client)
    return { entityType: input.entityType, operation: input.operation, entityId: createdId, status: String(result.data.status || 'active'), row: result.data, executedAt: now }
  }
  const id = entityId || input.entityId
  if (!id) throw new Error('ENTITY_ID_REQUIRED')
  const row = await loadRow(client, input.tenantId, input.entityType, id)
  const previousStatus = stringValue(row.status || asObject(row.payload).status)
  if (input.operation === 'execute' && input.entityType === 'objective') {
    const objective = objectiveFromRow(row, input)
    const assembly = await runGeminiStrategyAssembly({ objective, userId: input.actorId, idempotencyKey: `objective-live:${id}:${Date.now()}` })
    const nextMetadata = { ...asObject(row.metadata), lastStrategyRunId: assembly.runId, lastStrategyCount: assembly.strategies.length, lastProvider: assembly.provider, lastExecutedAt: now, lastExecutedBy: input.actorId, tenantId: input.tenantId }
    const persisted = await client.from('revenue_os_objectives').update({ status: 'active', execution_mode: 'live', metadata: nextMetadata, updated_at: now }).eq('id', id).select('*').single()
    if (persisted.error) throw persisted.error
    await writeRevenueOsAuditEvent({ action: 'objective.strategy_assembly_live', actorId: input.actorId, actorLabel: input.actorLabel, actorType: 'user', resourceType: 'revenue_os_objective', resourceId: id, outcome: 'success', summary: 'Mandat exécuté et stratégies persistées immédiatement.', metadata: { runId: assembly.runId, strategyCount: assembly.strategies.length, provider: assembly.provider } }, client)
    return { entityType: input.entityType, operation: input.operation, entityId: id, previousStatus, status: 'active', row: persisted.data, executedAt: now, result: assembly } as LiveOperationResult
  }
  if (input.operation === 'execute' && input.entityType === 'strategy') {
    const payload = { ...asObject(row.payload), ...asObject(row.metadata) }
    const version = stringValue(payload.version || row.version, '1.0.0')
    const compilation = await compileApprovedStrategy({ tenantId: input.tenantId, strategyId: id, strategyVersion: version, scope: 'full', dryRun: false, idempotencyKey: `strategy-live:${id}:${version}:${Date.now()}`, actor: { id: input.actorId, displayName: input.actorLabel, role: 'operator', permissions: ['*'], tenantId: input.tenantId } })
    const nextPayload = { ...asObject(row.payload), lastCompilationRunId: compilation.run.id, lastCompiledAt: now, lastCompiledBy: input.actorId, programCount: compilation.blueprint.programs.length, missionCount: compilation.blueprint.missions.length, taskCount: compilation.blueprint.tasks.length }
    const persisted = await client.from('revenue_os_strategies').update({ status: 'active', payload: nextPayload, updated_at: now }).eq('tenant_id', input.tenantId).eq('id', id).select('*').single()
    if (persisted.error) throw persisted.error
    await writeRevenueOsAuditEvent({ action: 'strategy.compiled_live', actorId: input.actorId, actorLabel: input.actorLabel, actorType: 'user', resourceType: 'revenue_os_strategy', resourceId: id, outcome: 'success', summary: 'Stratégie compilée en programmes, missions et tâches.', metadata: { compilationRunId: compilation.run.id, programs: compilation.blueprint.programs.length, missions: compilation.blueprint.missions.length, tasks: compilation.blueprint.tasks.length } }, client)
    return { entityType: input.entityType, operation: input.operation, entityId: id, previousStatus, status: 'active', row: persisted.data, executedAt: now, result: compilation } as LiveOperationResult
  }
  if (input.operation === 'delete') {
    let deleteQuery = client.from(tableOf[input.entityType]).delete().eq('id', id)
    if (input.entityType !== 'objective') deleteQuery = deleteQuery.eq('tenant_id', input.tenantId)
    const result = await deleteQuery
    if (result.error) throw result.error
    await writeRevenueOsAuditEvent({ action: `${input.entityType}.deleted_live`, actorId: input.actorId, actorLabel: input.actorLabel, actorType: 'user', resourceType: `revenue_os_${input.entityType}`, resourceId: id, outcome: 'success', summary: `${input.entityType} supprimé par l’opérateur.`, metadata: { previousStatus, reason: input.reason } }, client)
    return { entityType: input.entityType, operation: input.operation, entityId: id, previousStatus, deleted: true, executedAt: now }
  }
  const changes = asObject(input.changes)
  const nextStatus = statusFor[input.operation] || stringValue(changes.status, previousStatus || 'active')
  const nextPayload = { ...asObject(row.payload), ...changes, status: nextStatus, updatedAt: now, updatedBy: input.actorId, updatedByLabel: input.actorLabel, lastOperation: input.operation, lastOperationReason: input.reason, trustedOperatorLive: true }
  const update: Row = { status: nextStatus, payload: nextPayload, updated_at: now }
  if (input.entityType === 'objective') {
    update.execution_mode = 'live'
    if (changes.title) update.title = changes.title
    if (changes.mandate || changes.description) update.mandate = changes.mandate || changes.description
    if (changes.ownerLabel) update.owner_label = changes.ownerLabel
  }
  if (input.entityType === 'exception') {
    if (changes.ownerId) update.owner_id = changes.ownerId
    if (changes.dueAt) update.due_at = changes.dueAt
    if (changes.severity) update.severity = changes.severity
    if (input.operation === 'close' || input.operation === 'complete') update.closed_at = now
    if (input.operation === 'reopen') update.closed_at = null
  }
  let updateQuery = client.from(tableOf[input.entityType]).update(update).eq('id', id)
  if (input.entityType !== 'objective') updateQuery = updateQuery.eq('tenant_id', input.tenantId)
  const result = await updateQuery.select('*').single()
  if (result.error) throw result.error
  await writeRevenueOsAuditEvent({ action: `${input.entityType}.${input.operation}_live`, actorId: input.actorId, actorLabel: input.actorLabel, actorType: 'user', resourceType: `revenue_os_${input.entityType}`, resourceId: id, outcome: 'success', summary: `${input.operation} exécuté immédiatement sur ${input.entityType}.`, metadata: { previousStatus, status: nextStatus, reason: input.reason, changes } }, client)
  return { entityType: input.entityType, operation: input.operation, entityId: id, previousStatus, status: nextStatus, row: result.data, executedAt: now }
}

export async function executeLiveOperation(input: LiveOperationInput) {
  const ids = input.entityIds?.length ? input.entityIds : input.entityId ? [input.entityId] : input.operation === 'create' ? [undefined] : []
  if (!ids.length) throw new Error('ENTITY_ID_REQUIRED')
  const results: LiveOperationResult[] = []
  const failures: Array<{ entityId?: string; error: string }> = []
  for (const id of ids) {
    try { results.push(await mutateOne(input, id)) }
    catch (error) { failures.push({ entityId: id, error: error instanceof Error ? error.message : String(error) }) }
  }
  return { operation: input.operation, entityType: input.entityType, total: ids.length, succeeded: results.length, failed: failures.length, results, failures, status: failures.length ? results.length ? 'partial' : 'failed' : 'completed' }
}

export async function listLiveEntities(input: { tenantId: string; entityType: LiveEntityType; limit?: number }) {
  const client = await createServiceClient() as any
  const table = tableOf[input.entityType]
  let query = client.from(table).select('*').eq('tenant_id', input.tenantId).order('updated_at', { ascending: false }).limit(Math.min(500, Math.max(1, input.limit || 100)))
  if (input.entityType === 'objective') query = client.from(table).select('*').order('updated_at', { ascending: false }).limit(Math.min(500, Math.max(1, input.limit || 100)))
  const result = await query
  if (result.error) throw result.error
  return { entityType: input.entityType, rows: result.data || [], total: (result.data || []).length, generatedAt: new Date().toISOString() }
}
