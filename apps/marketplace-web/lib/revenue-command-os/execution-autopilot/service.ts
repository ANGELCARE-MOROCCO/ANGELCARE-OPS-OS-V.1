import { adapterRegistry } from './registry'
import { effectiveRevenueOsAdapterConfig } from './channel-policy'
import { hashPayload, stableId } from './crypto'
import { mapTaskToAction } from './mapping'
import { canQueue, validateExecutionPolicy } from './policies'
import {
  cancelRunOutbox, enqueueAction, findRunByIdempotency, listActions, listPropagationPackages, listRuns,
  loadAction, loadCompilationBlueprintForPropagation, loadPropagationPackage, loadRun, saveActions,
  saveAdapterHealth, saveAttempt, saveCompensation, saveResult, saveRun, updateAction,
  updateAdapterState, writeAudit,
} from './repository'
import type {
  ActivatePropagationInput, AdapterCode, CompensationResult, ExecutionAction, ExecutionActor,
  ExecutionAttempt, ExecutionDashboard, ExecutionResult, PreparePropagationInput,
  PropagationPreparation, PropagationRun, PropagationValidation,
} from './types'

async function reconcileRun(tenantId: string, runId: string) {
  const run = await loadRun(tenantId, runId)
  const actions = await listActions(tenantId, runId)
  run.preparedActions = actions.length
  run.queuedActions = actions.filter((action) => ['queued', 'leased', 'executing', 'retry_scheduled'].includes(action.status)).length
  run.succeededActions = actions.filter((action) => action.status === 'succeeded').length
  run.failedActions = actions.filter((action) => ['failed', 'dead_letter'].includes(action.status)).length
  run.externalActionsExecuted = actions.filter((action) => action.status === 'succeeded' && action.controls.externalAction).length
  const terminal = actions.length > 0 && actions.every((action) => ['succeeded', 'failed', 'dead_letter', 'cancelled', 'compensated', 'suppressed'].includes(action.status))
  if (terminal && run.status !== 'cancelled') {
    run.status = run.failedActions ? 'failed' : 'completed'
    run.completedAt = new Date().toISOString()
  }
  await saveRun(run)
  return run
}

export async function validatePropagationPackage(tenantId: string, packageId: string): Promise<PropagationValidation> {
  const pkg = await loadPropagationPackage(tenantId, packageId)
  const warnings: string[] = []
  const blueprint = await loadCompilationBlueprintForPropagation(tenantId, pkg.compilationRunId)
  if (!blueprint.tasks?.length) warnings.push('Aucune tâche compilée; le run restera vide jusqu’à création de tâches.')
  if (blueprint.conflicts?.some((item: any) => item.status === 'open')) warnings.push('Des contradictions ouvertes sont visibles mais ne bloquent pas l’exécution.')
  if (blueprint.approvalGates?.length) warnings.push('Les anciens gates sont conservés comme historique non bloquant.')
  const adapters = await adapterRegistry().health()
  for (const health of adapters) if (health.enabled && !health.configured) warnings.push(`${health.code}: configuration technique manquante`)
  return { valid: true, status: warnings.length ? 'partially_ready' : 'ready', blockers: [], warnings, adapters, package: pkg, blueprint }
}

export async function preparePropagation(input: PreparePropagationInput): Promise<PropagationPreparation> {
  const existing = await findRunByIdempotency(input.tenantId, input.idempotencyKey)
  if (existing) {
    const actions = await listActions(input.tenantId, existing.id)
    return { run: existing, actions, counts: {} as Record<AdapterCode, number>, approvalRequired: 0, internalReady: actions.filter((a) => !a.controls.externalAction).length, externalPrepared: actions.filter((a) => a.controls.externalAction).length, reusedExisting: true }
  }
  const validation = await validatePropagationPackage(input.tenantId, input.packageId)
  if (!validation.blueprint) throw new Error('COMPILATION_BLUEPRINT_NOT_FOUND')
  const now = new Date().toISOString()
  const runId = stableId('mz14-live-run', input.tenantId, input.packageId, input.idempotencyKey)
  const actions = (validation.blueprint.tasks || []).map((task: any, index: number) => mapTaskToAction({ package: validation.package, blueprint: validation.blueprint!, task, index })).map((action) => {
    const payloadHash = hashPayload(action.payload)
    return {
      ...action, propagationRunId: runId, executionActor: input.actor, status: 'validated' as const,
      approval: { ...action.approval, class: 'trusted_operator', required: false, decisionId: action.approval.decisionId || 'trusted-operator-live', approvedBy: input.actor.id, approvedAt: now, conditions: [], payloadHash },
      controls: { ...action.controls, executionMode: 'live' as const, approvalRequired: false, payloadHash },
    }
  })
  const run: PropagationRun = {
    id: runId, tenantId: input.tenantId, packageId: input.packageId,
    compilationRunId: validation.package.compilationRunId, status: 'ready', executionMode: 'live',
    idempotencyKey: input.idempotencyKey, requestedBy: input.actor.id,
    sourceHash: hashPayload({ package: validation.package.id, compilation: validation.package.compilationRunId, actions: actions.map((action) => action.controls.idempotencyKey) }),
    preparedActions: actions.length, queuedActions: 0, succeededActions: 0, failedActions: 0,
    externalActionsExecuted: 0, startedAt: now,
  }
  await saveRun(run)
  await saveActions(actions)
  await writeAudit({ tenantId: input.tenantId, runId, actorId: input.actor.id, action: 'propagation.live.prepared', idempotencyKey: input.idempotencyKey, payload: { actions: actions.length, mode: 'live', warnings: validation.warnings } })
  const counts = Object.fromEntries((await adapterRegistry().health()).map((health) => [health.code, actions.filter((action) => action.adapterCode === health.code).length])) as Record<AdapterCode, number>
  return { run, actions, counts, approvalRequired: 0, internalReady: actions.filter((action) => !action.controls.externalAction).length, externalPrepared: actions.filter((action) => action.controls.externalAction).length, reusedExisting: false }
}

export async function activatePropagation(input: ActivatePropagationInput) {
  const run = await loadRun(input.tenantId, input.runId)
  if (run.status === 'cancelled') throw new Error('PROPAGATION_RUN_CANCELLED')
  const actions = await listActions(input.tenantId, input.runId)
  let queued = 0
  let failed = 0
  for (const action of actions) {
    if (action.status === 'succeeded') continue
    const adapter = adapterRegistry().resolve(action.adapterCode)
    const config = await effectiveRevenueOsAdapterConfig(action.tenantId, adapter.config)
    const validation = validateExecutionPolicy(action, config, input.actor)
    if (!validation.valid || !canQueue(action, config)) {
      action.status = 'failed'
      action.lastError = validation.blockers.join(',') || 'ADAPTER_TECHNICALLY_UNAVAILABLE'
      failed += 1
      await updateAction(action)
      continue
    }
    action.executionActor = input.actor
    action.status = 'queued'
    action.lastError = undefined
    await updateAction(action)
    await enqueueAction(action)
    queued += 1
  }
  run.status = queued ? 'active' : failed ? 'failed' : 'completed'
  run.queuedActions = queued
  run.failedActions = failed
  if (!queued) run.completedAt = new Date().toISOString()
  await saveRun(run)
  await writeAudit({ tenantId: input.tenantId, runId: input.runId, actorId: input.actor.id, action: 'propagation.live.activated', payload: { queued, failed, waitingApproval: 0 } })
  return { runId: input.runId, queued, waitingApproval: 0, blocked: 0, failed, externalActionsExecuted: 0, status: run.status }
}

export async function executeOneAction(action: ExecutionAction, actor?: ExecutionActor) {
  if (action.status === 'succeeded') return { action, result: { success: true, payload: { idempotentReplay: true, externalReference: action.externalReference }, retryable: false, reversible: action.controls.rollbackPolicy } }
  const executionActor = actor || action.executionActor
  const adapter = adapterRegistry().resolve(action.adapterCode)
  const config = await effectiveRevenueOsAdapterConfig(action.tenantId, adapter.config)
  const validation = validateExecutionPolicy(action, config, executionActor)
  if (!validation.valid) throw new Error(validation.blockers.join(','))
  const started = Date.now()
  const attempt: ExecutionAttempt = {
    id: stableId('mz14-attempt', action.id, action.attemptCount + 1), actionId: action.id,
    tenantId: action.tenantId, attemptNumber: action.attemptCount + 1, status: 'started',
    startedAt: new Date().toISOString(),
  }
  action.status = 'executing'
  action.attemptCount += 1
  await updateAction(action)
  try {
    const prepared = await adapter.prepare(action)
    const result = await adapter.execute(prepared)
    attempt.completedAt = new Date().toISOString()
    attempt.latencyMs = Date.now() - started
    attempt.status = result.success ? 'succeeded' : result.retryable ? 'retryable' : 'non_retryable'
    attempt.errorCode = result.errorCode
    attempt.errorMessage = result.errorMessage
    attempt.providerRequestId = result.providerRequestId
    attempt.responseHash = hashPayload(result.payload)
    await saveAttempt(attempt)
    if (result.success) {
      action.status = 'succeeded'
      action.externalReference = result.externalReference
      action.lastError = undefined
      const executionResult: ExecutionResult = {
        actionId: action.id, adapterCode: action.adapterCode, status: 'executed',
        externalReference: result.externalReference, reversible: result.reversible,
        payload: result.payload, executedAt: new Date().toISOString(), externalAction: action.controls.externalAction,
      }
      await saveResult(action.tenantId, executionResult)
    } else {
      action.lastError = result.errorMessage
      action.status = result.retryable && action.attemptCount < action.controls.maximumAttempts ? 'retry_scheduled' : 'dead_letter'
    }
    await updateAction(action)
    await reconcileRun(action.tenantId, action.propagationRunId)
    return { action, result }
  } catch (error) {
    attempt.completedAt = new Date().toISOString()
    attempt.latencyMs = Date.now() - started
    attempt.status = 'failed'
    attempt.errorCode = 'EXECUTION_EXCEPTION'
    attempt.errorMessage = error instanceof Error ? error.message : String(error)
    await saveAttempt(attempt)
    action.lastError = attempt.errorMessage
    action.status = action.attemptCount < action.controls.maximumAttempts ? 'retry_scheduled' : 'dead_letter'
    await updateAction(action)
    await reconcileRun(action.tenantId, action.propagationRunId)
    throw error
  }
}

/** Legacy approve endpoint: trusted operators execute immediately, without a gate. */
export async function approveExecutionAction(input: { tenantId: string; actor: ExecutionActor; actionId: string; reason: string; validUntil?: string; conditions: string[] }) {
  const action = await loadAction(input.tenantId, input.actionId)
  action.executionActor = input.actor
  action.approval = { ...action.approval, class: 'trusted_operator', required: false, decisionId: 'trusted-operator-live', approvedBy: input.actor.id, approvedAt: new Date().toISOString(), conditions: [], payloadHash: hashPayload(action.payload) }
  action.controls = { ...action.controls, approvalRequired: false, executionMode: 'live', payloadHash: hashPayload(action.payload) }
  action.status = 'queued'
  await updateAction(action)
  await writeAudit({ tenantId: input.tenantId, runId: action.propagationRunId, actionId: action.id, actorId: input.actor.id, action: 'execution.live.requested', payload: { reason: input.reason, compatibilityEndpoint: 'approve' } })
  const execution = await executeOneAction(action, input.actor)
  return execution.action
}

/** Legacy reject endpoint becomes a direct operator cancellation. */
export async function rejectExecutionAction(input: { tenantId: string; actor: ExecutionActor; actionId: string; reason: string }) {
  const action = await loadAction(input.tenantId, input.actionId)
  action.status = 'cancelled'
  action.lastError = input.reason
  await updateAction(action)
  await writeAudit({ tenantId: input.tenantId, runId: action.propagationRunId, actionId: action.id, actorId: input.actor.id, action: 'execution.cancelled', payload: { reason: input.reason } })
  return action
}

export async function retryExecutionAction(input: { tenantId: string; actor: ExecutionActor; actionId: string; reason: string }) {
  const action = await loadAction(input.tenantId, input.actionId)
  if (action.status === 'succeeded') return action
  action.executionActor = input.actor
  action.status = 'queued'
  action.lastError = undefined
  await updateAction(action)
  await writeAudit({ tenantId: input.tenantId, runId: action.propagationRunId, actionId: action.id, actorId: input.actor.id, action: 'execution.retry.requested', payload: { reason: input.reason } })
  const execution = await executeOneAction(action, input.actor)
  return execution.action
}

export async function compensateExecutionAction(input: { tenantId: string; actor: ExecutionActor; actionId: string; reason: string }): Promise<CompensationResult> {
  const action = await loadAction(input.tenantId, input.actionId)
  if (action.status !== 'succeeded') throw new Error('ONLY_SUCCEEDED_ACTIONS_CAN_BE_COMPENSATED')
  const adapter = adapterRegistry().resolve(action.adapterCode)
  const result = await adapter.compensate(action)
  if (result.success) {
    action.status = result.kind === 'rollback' ? 'rolled_back' : 'compensated'
    await updateAction(action)
  }
  await saveCompensation(input.tenantId, action, result, input.actor.id, input.reason)
  await writeAudit({ tenantId: input.tenantId, runId: action.propagationRunId, actionId: action.id, actorId: input.actor.id, action: result.kind === 'rollback' ? 'execution.rolled_back' : 'execution.compensated', payload: { reason: input.reason, truthfulIrreversibility: result.kind !== 'rollback' } })
  return result
}

export async function pausePropagation(input: { tenantId: string; actor: ExecutionActor; runId: string; reason?: string }) {
  const run = await loadRun(input.tenantId, input.runId)
  run.status = 'paused'
  run.pausedAt = new Date().toISOString()
  run.lastError = input.reason
  await saveRun(run)
  await writeAudit({ tenantId: input.tenantId, runId: run.id, actorId: input.actor.id, action: 'propagation.paused_by_user', payload: { reason: input.reason } })
  return run
}

export async function resumePropagation(input: { tenantId: string; actor: ExecutionActor; runId: string; reason?: string }) {
  const run = await loadRun(input.tenantId, input.runId)
  run.status = 'active'
  run.pausedAt = undefined
  run.lastError = undefined
  await saveRun(run)
  const actions = await listActions(input.tenantId, run.id)
  let queued = 0
  for (const action of actions.filter((item) => ['validated', 'retry_scheduled', 'failed'].includes(item.status))) {
    action.executionActor = input.actor
    action.status = 'queued'
    action.lastError = undefined
    await updateAction(action)
    await enqueueAction(action)
    queued += 1
  }
  await writeAudit({ tenantId: input.tenantId, runId: run.id, actorId: input.actor.id, action: 'propagation.resumed_by_user', payload: { reason: input.reason, queued } })
  return { ...run, queued }
}

export async function cancelPropagation(input: { tenantId: string; actor: ExecutionActor; runId: string; reason?: string }) {
  const run = await loadRun(input.tenantId, input.runId)
  run.status = 'cancelled'
  run.cancelledAt = new Date().toISOString()
  run.lastError = input.reason
  await saveRun(run)
  const actions = await listActions(input.tenantId, run.id)
  for (const action of actions.filter((item) => !['succeeded', 'cancelled', 'compensated', 'rolled_back'].includes(item.status))) {
    action.status = 'cancelled'
    action.lastError = input.reason
    await updateAction(action)
  }
  const cancelledOutbox = await cancelRunOutbox(input.tenantId, run.id)
  await writeAudit({ tenantId: input.tenantId, runId: run.id, actorId: input.actor.id, action: 'propagation.cancelled_by_user', payload: { reason: input.reason, cancelledOutbox } })
  return run
}

export async function controlAdapter(input: { tenantId: string; actor: ExecutionActor; adapterCode: AdapterCode; enabled: boolean; reason: string }) {
  await updateAdapterState({ tenantId: input.tenantId, adapterCode: input.adapterCode, enabled: input.enabled, actorId: input.actor.id, reason: input.reason })
  const adapter = adapterRegistry().resolve(input.adapterCode)
  const health = await adapter.health()
  await saveAdapterHealth(input.tenantId, { ...health, enabled: input.enabled, status: input.enabled ? health.status : 'suspended', message: input.enabled ? 'Adaptateur restauré par l’opérateur.' : 'Adaptateur suspendu par l’opérateur.' })
  await writeAudit({ tenantId: input.tenantId, actorId: input.actor.id, action: input.enabled ? 'adapter.restored_by_user' : 'adapter.suspended_by_user', payload: { adapterCode: input.adapterCode, reason: input.reason } })
  return { adapterCode: input.adapterCode, enabled: input.enabled, health }
}

export async function executionDashboard(tenantId: string): Promise<ExecutionDashboard> {
  const [packages, runs, actions, adapters] = await Promise.all([listPropagationPackages(tenantId), listRuns(tenantId), listActions(tenantId), adapterRegistry().health()])
  const counts = actions.reduce<Record<string, number>>((accumulator, action) => { accumulator[action.status] = (accumulator[action.status] || 0) + 1; return accumulator }, {})
  return { packages, runs, actions, adapters, counts, externalActionsExecuted: actions.filter((action) => action.status === 'succeeded' && action.controls.externalAction).length, executionMode: 'live' }
}
