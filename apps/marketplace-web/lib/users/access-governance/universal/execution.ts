import 'server-only'

import { createHash } from 'node:crypto'
import type { createAccessGovernanceAdminClient } from '../admin-client'
import type { GovernanceUserRow } from '../types'
import {
  actorIdentity,
  assertSafeRpcName,
  canApproveUniversalAuthorizationPlan,
  canExecuteUniversalAuthorizationPlan,
  createCorrelationId,
} from './security'

type AdminClient = ReturnType<typeof createAccessGovernanceAdminClient>

function planFingerprint(row: Record<string, unknown>) {
  return createHash('sha256').update(JSON.stringify({
    id: row.id,
    planKey: row.plan_key,
    sourceScanId: row.source_scan_id,
    findingKeys: row.finding_keys,
    simulation: row.simulation,
    executionEligible: row.execution_eligible,
    blockedReasons: row.blocked_reasons,
    expiresAt: row.expires_at,
    updatedAt: row.updated_at,
  })).digest('hex')
}

export async function approveUniversalPlan(
  client: AdminClient,
  actor: GovernanceUserRow,
  planId: string,
  comment: string | null,
) {
  if (!canApproveUniversalAuthorizationPlan(actor)) throw new Error('Plan approval requires sovereign authorization.')
  const { data: plan, error } = await client.from('access_reconciliation_plans').select('*').eq('id', planId).maybeSingle()
  if (error) throw new Error(`Unable to load reconciliation plan: ${error.message}`)
  if (!plan) throw new Error('Reconciliation plan was not found.')
  if (!plan.execution_eligible) throw new Error(`Plan is not execution eligible: ${(plan.blocked_reasons ?? []).join('; ')}`)
  if (!['draft', 'review_required'].includes(String(plan.status))) throw new Error('Only draft or review-required plans can be approved.')
  if (plan.expires_at && new Date(String(plan.expires_at)).getTime() <= Date.now()) throw new Error('Reconciliation plan has expired.')

  const actorInfo = actorIdentity(actor)
  const fingerprint = planFingerprint(plan)
  const now = new Date().toISOString()
  const { error: approvalError } = await client.from('access_plan_approvals').insert({
    plan_id: planId,
    decision: 'approved',
    actor_user_id: actorInfo.id,
    actor_email: actorInfo.email,
    comment,
    plan_fingerprint: fingerprint,
    metadata: {},
  })
  if (approvalError) throw new Error(`Unable to store plan approval: ${approvalError.message}`)
  const { data: updated, error: updateError } = await client.from('access_reconciliation_plans').update({
    status: 'approved',
    approved_at: now,
    approved_by: actorInfo.id,
    updated_at: now,
  }).eq('id', planId).select('*').single()
  if (updateError) throw new Error(`Unable to approve reconciliation plan: ${updateError.message}`)
  return { plan: updated, fingerprint }
}

export async function executeUniversalPlan(client: AdminClient, actor: GovernanceUserRow, planId: string) {
  if (!canExecuteUniversalAuthorizationPlan(actor)) throw new Error('Plan execution requires sovereign authorization.')
  const actorInfo = actorIdentity(actor)
  const correlationId = createCorrelationId('authorization-execution')

  const { data: operations, error: operationError } = await client.from('access_plan_operations').select('mutation_rpc,verification_rpc,rollback_rpc').eq('plan_id', planId)
  if (operationError) throw new Error(`Unable to preflight plan operations: ${operationError.message}`)
  for (const operation of operations ?? []) {
    for (const candidate of [operation.mutation_rpc, operation.verification_rpc, operation.rollback_rpc]) {
      if (candidate) assertSafeRpcName(String(candidate))
    }
  }

  const { data, error } = await client.rpc('access_governance_execute_plan', {
    p_plan_id: planId,
    p_actor_id: actorInfo.id,
    p_actor_email: actorInfo.email,
    p_correlation_id: correlationId,
  })
  if (error) {
    await client.from('access_command_events').insert({
      event_type: 'authorization_plan_failed',
      actor_user_id: actorInfo.id,
      actor_email: actorInfo.email,
      correlation_id: correlationId,
      plan_id: planId,
      summary: 'Authorization reconciliation plan failed before transactional completion.',
      payload: { error: error.message },
    })
    throw new Error(`Authorization reconciliation execution failed: ${error.message}`)
  }
  if (!data || typeof data !== 'object' || Array.isArray(data) || data.ok !== true) {
    const detail = data && typeof data === 'object' && !Array.isArray(data) && typeof data.error === 'string'
      ? data.error
      : 'Execution did not return a verified success result.'
    throw new Error(`Authorization reconciliation execution failed: ${detail}`)
  }
  return { result: data, correlationId }
}

export async function executeUniversalRollback(client: AdminClient, actor: GovernanceUserRow, packageId: string) {
  if (!canExecuteUniversalAuthorizationPlan(actor)) throw new Error('Rollback execution requires sovereign authorization.')
  const actorInfo = actorIdentity(actor)
  const correlationId = createCorrelationId('authorization-rollback')
  const { data, error } = await client.rpc('access_governance_execute_rollback', {
    p_package_id: packageId,
    p_actor_id: actorInfo.id,
    p_actor_email: actorInfo.email,
    p_correlation_id: correlationId,
  })
  if (error) throw new Error(`Authorization rollback failed: ${error.message}`)
  if (!data || typeof data !== 'object' || Array.isArray(data) || data.ok !== true) {
    const detail = data && typeof data === 'object' && !Array.isArray(data) && typeof data.error === 'string'
      ? data.error
      : 'Rollback did not return a verified success result.'
    throw new Error(`Authorization rollback failed: ${detail}`)
  }
  return { result: data, correlationId }
}

export async function loadUniversalExecutions(client: AdminClient, limit = 100) {
  const { data: executions, error } = await client.from('access_execution_runs').select('*').order('started_at', { ascending: false }).limit(limit)
  if (error) throw new Error(`Unable to load authorization executions: ${error.message}`)
  const executionIds = (executions ?? []).map((row: Record<string, unknown>) => String(row.id))
  if (!executionIds.length) return { executions: [], rollbackPackages: [] }
  const { data: rollbackPackages, error: rollbackError } = await client.from('access_rollback_packages').select('*').in('execution_id', executionIds).order('created_at', { ascending: false })
  if (rollbackError) throw new Error(`Unable to load rollback packages: ${rollbackError.message}`)
  return { executions: executions ?? [], rollbackPackages: rollbackPackages ?? [] }
}

export async function loadUniversalExecution(client: AdminClient, executionId: string) {
  const [runResult, checkpointsResult, verificationResult] = await Promise.all([
    client.from('access_execution_runs').select('*').eq('id', executionId).maybeSingle(),
    client.from('access_execution_checkpoints').select('*').eq('execution_id', executionId).order('sequence_number', { ascending: true }),
    client.from('access_verification_results').select('*').eq('execution_id', executionId).order('verified_at', { ascending: true }),
  ])
  if (runResult.error) throw new Error(`Unable to load execution run: ${runResult.error.message}`)
  if (checkpointsResult.error) throw new Error(`Unable to load execution checkpoints: ${checkpointsResult.error.message}`)
  if (verificationResult.error) throw new Error(`Unable to load execution verification: ${verificationResult.error.message}`)
  if (!runResult.data) throw new Error('Execution run was not found.')
  return {
    execution: runResult.data,
    checkpoints: checkpointsResult.data ?? [],
    verifications: verificationResult.data ?? [],
  }
}
