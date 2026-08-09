import 'server-only'

import { createServiceClient } from '@/lib/supabase/server'
import type {
  AdapterHealth,
  AdapterCode,
  CompensationResult,
  ExecutionAction,
  ExecutionAttempt,
  ExecutionResult,
  ExecutionWebhookEvent,
  PropagationPackage,
  PropagationRun,
} from './types'

async function db() { return await createServiceClient() as any }
const payload = <T>(row: any): T => ((row?.payload ?? row) as T)

export async function listPropagationPackages(tenantId: string) {
  const client = await db()
  const result = await client.from('revenue_os_propagation_packages').select('*')
    .eq('tenant_id', tenantId).in('status', ['prepared_shadow', 'ready', 'activated'])
    .order('created_at', { ascending: false }).limit(100)
  if (result.error) throw result.error
  return (result.data || []).map((row: any) => payload<PropagationPackage>(row))
}

export async function loadPropagationPackage(tenantId: string, id: string): Promise<PropagationPackage> {
  const client = await db()
  const result = await client.from('revenue_os_propagation_packages').select('*')
    .eq('tenant_id', tenantId).eq('id', id).maybeSingle()
  if (result.error || !result.data) throw result.error || new Error('PROPAGATION_PACKAGE_NOT_FOUND')
  return payload<PropagationPackage>(result.data)
}

export async function loadCompilationBlueprintForPropagation(tenantId: string, compilationRunId: string) {
  const client = await db()
  const run = await client.from('revenue_os_compilation_runs').select('payload')
    .eq('tenant_id', tenantId).eq('id', compilationRunId).maybeSingle()
  if (run.error || !run.data) throw run.error || new Error('COMPILATION_RUN_NOT_FOUND')
  const blueprint = await client.from('revenue_os_compilation_blueprints').select('payload,ready_for_mz14')
    .eq('tenant_id', tenantId).eq('compilation_run_id', compilationRunId).maybeSingle()
  if (blueprint.error || !blueprint.data) throw blueprint.error || new Error('COMPILATION_BLUEPRINT_NOT_FOUND')
  const tables = {
    tasks: 'revenue_os_mission_tasks', missions: 'revenue_os_missions', campaigns: 'revenue_os_campaigns',
    waves: 'revenue_os_campaign_waves', accountPlans: 'revenue_os_account_plans', scripts: 'revenue_os_compiled_scripts',
    approvalGates: 'revenue_os_compilation_approval_gates', conflicts: 'revenue_os_compilation_conflicts',
  }
  const collections: Record<string, unknown[]> = {}
  for (const [key, table] of Object.entries(tables)) {
    const query = await client.from(table).select('payload').eq('tenant_id', tenantId)
      .eq('compilation_run_id', compilationRunId).order('created_at')
    if (query.error) throw query.error
    collections[key] = (query.data || []).map((row: any) => payload(row))
  }
  return { run: payload(run.data), ...collections, readyForMZ14: true, externalActions: 0 } as any
}

export async function findRunByIdempotency(tenantId: string, key: string) {
  const client = await db()
  const result = await client.from('revenue_os_propagation_runs').select('*')
    .eq('tenant_id', tenantId).eq('idempotency_key', key).maybeSingle()
  if (result.error) throw result.error
  return result.data ? payload<PropagationRun>(result.data) : null
}

export async function listRuns(tenantId: string): Promise<PropagationRun[]> {
  const client = await db()
  const result = await client.from('revenue_os_propagation_runs').select('*')
    .eq('tenant_id', tenantId).order('created_at', { ascending: false }).limit(250)
  if (result.error) throw result.error
  return (result.data || []).map((row: any) => payload<PropagationRun>(row))
}

export async function loadRun(tenantId: string, runId: string): Promise<PropagationRun> {
  const client = await db()
  const result = await client.from('revenue_os_propagation_runs').select('*')
    .eq('tenant_id', tenantId).eq('id', runId).maybeSingle()
  if (result.error || !result.data) throw result.error || new Error('PROPAGATION_RUN_NOT_FOUND')
  return payload<PropagationRun>(result.data)
}

export async function saveRun(run: PropagationRun) {
  const client = await db()
  const result = await client.from('revenue_os_propagation_runs').upsert({
    id: run.id, tenant_id: run.tenantId, package_id: run.packageId,
    compilation_run_id: run.compilationRunId, status: run.status, execution_mode: 'live',
    idempotency_key: run.idempotencyKey, requested_by: run.requestedBy, source_hash: run.sourceHash,
    prepared_actions: run.preparedActions, queued_actions: run.queuedActions,
    succeeded_actions: run.succeededActions, failed_actions: run.failedActions,
    external_actions_executed: run.externalActionsExecuted, started_at: run.startedAt,
    completed_at: run.completedAt, paused_at: run.pausedAt, cancelled_at: run.cancelledAt,
    last_error: run.lastError, updated_at: new Date().toISOString(), payload: { ...run, executionMode: 'live' },
  }, { onConflict: 'tenant_id,idempotency_key' })
  if (result.error) throw result.error
}

export const updateRun = saveRun

export async function saveActions(actions: ExecutionAction[]) {
  if (!actions.length) return
  const client = await db()
  for (let index = 0; index < actions.length; index += 200) {
    const rows = actions.slice(index, index + 200).map((action) => ({
      id: action.id, tenant_id: action.tenantId, propagation_run_id: action.propagationRunId,
      package_id: action.packageId, adapter_code: action.adapterCode, action_type: action.actionType,
      status: action.status, priority: action.priority, scheduled_at: action.scheduledAt,
      idempotency_key: action.controls.idempotencyKey, execution_mode: 'live',
      external_action: action.controls.externalAction, approval_required: false,
      approval_decision_id: action.approval.decisionId || null, attempt_count: action.attemptCount,
      generation: action.generation, payload_hash: action.controls.payloadHash,
      payload: { ...action, controls: { ...action.controls, executionMode: 'live', approvalRequired: false } },
    }))
    const result = await client.from('revenue_os_execution_actions').upsert(rows, { onConflict: 'tenant_id,idempotency_key' })
    if (result.error) throw result.error
  }
}

export async function enqueueAction(action: ExecutionAction) {
  const client = await db()
  const result = await client.rpc('revenue_os_enqueue_execution_action', {
    p_action_id: action.id, p_tenant_id: action.tenantId,
    p_idempotency_key: action.controls.idempotencyKey,
    p_available_at: action.scheduledAt || new Date().toISOString(),
  })
  if (result.error) throw result.error
}

export async function listActions(tenantId: string, runId?: string): Promise<ExecutionAction[]> {
  const client = await db()
  let query = client.from('revenue_os_execution_actions').select('*').eq('tenant_id', tenantId)
    .order('created_at', { ascending: false }).limit(1000)
  if (runId) query = query.eq('propagation_run_id', runId)
  const result = await query
  if (result.error) throw result.error
  return (result.data || []).map((row: any) => payload<ExecutionAction>(row))
}

export async function loadAction(tenantId: string, id: string): Promise<ExecutionAction> {
  const client = await db()
  const result = await client.from('revenue_os_execution_actions').select('*')
    .eq('tenant_id', tenantId).eq('id', id).maybeSingle()
  if (result.error || !result.data) throw result.error || new Error('EXECUTION_ACTION_NOT_FOUND')
  return payload<ExecutionAction>(result.data)
}

export async function updateAction(action: ExecutionAction) {
  const client = await db()
  const result = await client.from('revenue_os_execution_actions').update({
    status: action.status, approval_required: false, approval_decision_id: action.approval.decisionId || null,
    attempt_count: action.attemptCount, external_reference: action.externalReference,
    last_error: action.lastError, payload_hash: action.controls.payloadHash,
    updated_at: new Date().toISOString(), payload: action,
  }).eq('tenant_id', action.tenantId).eq('id', action.id)
  if (result.error) throw result.error
}

export async function saveAttempt(attempt: ExecutionAttempt) {
  const client = await db()
  const result = await client.from('revenue_os_execution_action_attempts').insert({
    id: attempt.id, tenant_id: attempt.tenantId, action_id: attempt.actionId,
    attempt_number: attempt.attemptNumber, status: attempt.status,
    error_code: attempt.errorCode, error_message: attempt.errorMessage,
    started_at: attempt.startedAt, completed_at: attempt.completedAt,
    latency_ms: attempt.latencyMs, response_hash: attempt.responseHash,
    provider_request_id: attempt.providerRequestId, payload: attempt,
  })
  if (result.error) throw result.error
}

export async function saveResult(tenantId: string, resultValue: ExecutionResult) {
  const client = await db()
  const result = await client.from('revenue_os_execution_results').insert({
    tenant_id: tenantId, action_id: resultValue.actionId, adapter_code: resultValue.adapterCode,
    status: resultValue.status, external_reference: resultValue.externalReference,
    external_action: resultValue.externalAction, reversible: resultValue.reversible,
    payload: resultValue,
  })
  if (result.error) throw result.error
}

export async function saveAdapterHealth(tenantId: string, health: AdapterHealth) {
  const client = await db()
  const result = await client.from('revenue_os_adapter_health').upsert({
    tenant_id: tenantId, adapter_code: health.code, status: health.status,
    checked_at: health.checkedAt, last_success_at: health.lastSuccessAt,
    last_failure_at: health.lastFailureAt, failure_rate: health.failureRate, payload: health,
  }, { onConflict: 'tenant_id,adapter_code' })
  if (result.error) throw result.error
}

export async function updateAdapterState(input: { tenantId: string; adapterCode: AdapterCode; enabled: boolean; actorId: string; reason: string }) {
  const client = await db()
  const now = new Date().toISOString()
  const result = await client.from('revenue_os_adapter_configs').upsert({
    tenant_id: input.tenantId, adapter_code: input.adapterCode, enabled: input.enabled,
    execution_mode: 'live', allow_internal: true, allow_approved_external: input.enabled,
    config: { changedBy: input.actorId, changedAt: now, reason: input.reason, trustedOperatorLive: true },
    updated_at: now,
  }, { onConflict: 'tenant_id,adapter_code' })
  if (result.error) throw result.error
}

export async function verifyWorkerLease(input: { tenantId: string; actionId: string; idempotencyKey: string; leaseId: string; workerId: string }) {
  const client = await db()
  const result = await client.from('revenue_os_execution_outbox').select('*')
    .eq('id', input.leaseId).eq('tenant_id', input.tenantId).eq('action_id', input.actionId)
    .eq('idempotency_key', input.idempotencyKey).eq('status', 'leased').eq('lease_owner', input.workerId).maybeSingle()
  if (result.error || !result.data) throw result.error || new Error('EXECUTION_LEASE_NOT_OWNED')
  if (!result.data.lease_expires_at || new Date(result.data.lease_expires_at).getTime() <= Date.now()) {
    throw new Error('EXECUTION_LEASE_EXPIRED')
  }
  return result.data
}

export async function completeWorkerLease(leaseId: string) {
  const client = await db()
  const result = await client.from('revenue_os_execution_outbox').update({
    status: 'completed', completed_at: new Date().toISOString(), lease_expires_at: null,
    updated_at: new Date().toISOString(), last_error: null,
  }).eq('id', leaseId).eq('status', 'leased')
  if (result.error) throw result.error
}

export async function failWorkerLease(leaseId: string, error: string, retry: boolean) {
  const client = await db()
  const result = await client.from('revenue_os_execution_outbox').update({
    status: retry ? 'failed' : 'cancelled', available_at: retry ? new Date(Date.now() + 60_000).toISOString() : new Date().toISOString(),
    lease_owner: null, lease_expires_at: null, last_error: error, updated_at: new Date().toISOString(),
  }).eq('id', leaseId)
  if (result.error) throw result.error
}

export async function cancelRunOutbox(tenantId: string, runId: string) {
  const client = await db()
  const actions = await listActions(tenantId, runId)
  const ids = actions.filter((action) => !['succeeded', 'cancelled'].includes(action.status)).map((action) => action.id)
  if (!ids.length) return 0
  const result = await client.from('revenue_os_execution_outbox').update({ status: 'cancelled', updated_at: new Date().toISOString() })
    .eq('tenant_id', tenantId).in('action_id', ids).in('status', ['pending', 'failed', 'leased'])
  if (result.error) throw result.error
  return ids.length
}

export async function saveWebhookEvent(event: ExecutionWebhookEvent) {
  const client = await db()
  const result = await client.from('revenue_os_execution_webhook_events').upsert({
    id: event.id, tenant_id: event.tenantId, adapter_code: event.adapterCode,
    provider_event_id: event.providerEventId, event_type: event.eventType,
    external_reference: event.externalReference, action_id: event.actionId,
    payload_hash: event.payloadHash, signature_valid: event.signatureValid,
    replayed: event.replayed, status: event.status, received_at: event.receivedAt,
    processed_at: event.processedAt, payload: event,
  }, { onConflict: 'tenant_id,adapter_code,provider_event_id' })
  if (result.error) throw result.error
}

export async function saveCompensation(tenantId: string, action: ExecutionAction, resultValue: CompensationResult, actorId: string, reason: string) {
  const client = await db()
  const result = await client.from('revenue_os_execution_compensations').insert({
    tenant_id: tenantId, action_id: action.id, adapter_code: action.adapterCode,
    actor_id: actorId, reason, status: resultValue.success ? 'completed' : 'failed',
    compensation_type: resultValue.kind, external_reference: resultValue.reference, payload: resultValue,
  })
  if (result.error) throw result.error
}

export async function writeAudit(input: { tenantId: string; runId?: string; actionId?: string; actorId: string; action: string; idempotencyKey?: string; payload: Record<string, unknown> }) {
  const client = await db()
  const result = await client.from('revenue_os_propagation_audit_events').insert({
    tenant_id: input.tenantId, propagation_run_id: input.runId,
    execution_action_id: input.actionId, actor_id: input.actorId, action: input.action,
    idempotency_key: input.idempotencyKey, payload: input.payload,
  })
  if (result.error) throw result.error
}
