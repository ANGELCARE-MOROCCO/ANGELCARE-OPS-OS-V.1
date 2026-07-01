import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/getUser'
import { buildAc360IdempotencyKey, runAc360WiredAction } from './action-wiring'
import { resolveAc360SchoolOpsContext } from './school-ops'

export type Ac360Phase2TBuildPayload = Record<string, unknown>

type Phase2TWiringKey =
  | 'ac360.phase2t.typescript_hardening.run'
  | 'ac360.phase2t.api_contract_sweep.run'
  | 'ac360.phase2t.deployment_readiness.evaluate'
  | 'ac360.phase2t.deployment_repair.record'
  | 'ac360.phase2t.alert.resolve'

function cleanMetadata(value: unknown) {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : {}
}

function text(value: unknown, fallback = '') {
  const normalized = String(value ?? '').trim()
  return normalized || fallback
}

function bool(value: unknown, fallback = false) {
  if (typeof value === 'boolean') return value
  if (value === 'true') return true
  if (value === 'false') return false
  return fallback
}

async function currentActorId() {
  const user = await getCurrentUser().catch(() => null) as any
  return user?.id || null
}

async function executePhase2TRpc(
  wiringKey: Phase2TWiringKey,
  body: Ac360Phase2TBuildPayload,
  rpcName: string,
  rpcArgs: Record<string, unknown>,
  metadata: Record<string, unknown> = {},
  quantity = 1,
) {
  const resolved = await resolveAc360SchoolOpsContext(String(body.orgId || body.org_id || '') || undefined)
  if (!resolved.ok) return resolved

  const idSeed = body.idempotencyKey || body.idempotency_key || `${resolved.orgId}:${wiringKey}:${body.runId || body.run_id || body.sweepId || body.sweep_id || body.readinessRunId || body.readiness_run_id || body.repairKey || body.repair_key || Date.now()}`

  const guarded = await runAc360WiredAction(wiringKey as any, async () => {
    const db = await createClient()
    const { data, error } = await db.rpc(rpcName, { ...rpcArgs, p_org_id: resolved.orgId } as any)
    if (error) return { ok: false, status: 500, error: error.message || `AC360 Phase 2T RPC failed: ${rpcName}` }
    return { ok: true, status: 200, data }
  }, {
    orgId: resolved.orgId,
    quantity: Math.max(1, Math.ceil(quantity || 1)),
    idempotencyKey: buildAc360IdempotencyKey(wiringKey, idSeed),
    metadata: {
      source: 'lib.ac360.phase2-build-hardening',
      phase: 'phase_2t_typescript_api_contract_deployment_readiness',
      uiBuildAllowed: false,
      backendOnly: true,
      rpcName,
      ...metadata,
    },
  })

  if (!guarded.ok) {
    return { ok: false, status: 402, error: guarded.error || guarded.guard.reason || 'AC360 guard blocked Phase 2T action.', ac360: { guard: guarded.guard, blocked: true } }
  }

  return { ...(guarded.data as any), ac360: { guard: guarded.guard, usage: guarded.usage } }
}

export async function getAc360Phase2TBuildHardeningDashboard(orgId?: string) {
  const resolved = await resolveAc360SchoolOpsContext(orgId)
  if (!resolved.ok) return resolved
  const db = await createClient()
  const { data, error } = await db.rpc('ac360_phase2t_build_hardening_dashboard', { p_org_id: resolved.orgId } as any)
  if (error) return { ok: false as const, status: 500, error: error.message || 'Unable to load AC360 Phase 2T build hardening dashboard.' }
  return { ok: true as const, context: resolved.context, dashboard: data }
}

export async function runAc360Phase2TTypescriptHardening(body: Ac360Phase2TBuildPayload) {
  const actorId = await currentActorId()
  return executePhase2TRpc('ac360.phase2t.typescript_hardening.run', body, 'ac360_run_phase2t_typescript_hardening', {
    p_actor_app_user_id: actorId,
    p_metadata: cleanMetadata(body.metadata || body.metadata_json),
  }, { phase2TAction: 'typescript_hardening.run' })
}

export async function runAc360Phase2TApiContractSweep(body: Ac360Phase2TBuildPayload) {
  const actorId = await currentActorId()
  return executePhase2TRpc('ac360.phase2t.api_contract_sweep.run', body, 'ac360_run_phase2t_api_contract_sweep', {
    p_actor_app_user_id: actorId,
    p_metadata: cleanMetadata(body.metadata || body.metadata_json),
  }, { phase2TAction: 'api_contract_sweep.run' })
}

export async function evaluateAc360Phase2TDeploymentReadiness(body: Ac360Phase2TBuildPayload) {
  const actorId = await currentActorId()
  return executePhase2TRpc('ac360.phase2t.deployment_readiness.evaluate', body, 'ac360_evaluate_phase2t_deployment_readiness', {
    p_actor_app_user_id: actorId,
    p_metadata: cleanMetadata(body.metadata || body.metadata_json),
  }, { phase2TAction: 'deployment_readiness.evaluate' })
}

export async function recordAc360Phase2TDeploymentRepair(body: Ac360Phase2TBuildPayload) {
  const actorId = await currentActorId()
  return executePhase2TRpc('ac360.phase2t.deployment_repair.record', body, 'ac360_record_phase2t_deployment_repair', {
    p_repair_type: text(body.repairType || body.repair_type, 'typescript'),
    p_title: text(body.title, 'Phase 2T repair'),
    p_description: body.description || body.message || null,
    p_affected_file: body.affectedFile || body.affected_file || null,
    p_affected_route: body.affectedRoute || body.affected_route || null,
    p_affected_action_key: body.affectedActionKey || body.affected_action_key || null,
    p_verified: bool(body.verified, false),
    p_actor_app_user_id: actorId,
    p_metadata: cleanMetadata(body.metadata || body.metadata_json || body.evidence || body.evidence_json),
  }, { phase2TAction: 'deployment_repair.record' })
}

export async function resolveAc360Phase2TAlert(body: Ac360Phase2TBuildPayload) {
  const actorId = await currentActorId()
  return executePhase2TRpc('ac360.phase2t.alert.resolve', body, 'ac360_resolve_phase2t_alert', {
    p_alert_id: body.alertId || body.alert_id || null,
    p_alert_key: body.alertKey || body.alert_key || null,
    p_actor_app_user_id: actorId,
    p_metadata: cleanMetadata(body.metadata || body.metadata_json),
  }, { phase2TAction: 'alert.resolve' })
}
