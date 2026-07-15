import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/getUser'
import { buildAc360IdempotencyKey, runAc360WiredAction } from './action-wiring'
import { resolveAc360SchoolOpsContext } from './school-ops'

export type Ac360Phase2RuntimeQaPayload = Record<string, unknown>

type Phase2SWiringKey =
  | 'ac360.phase2s.runtime_qa.run'
  | 'ac360.phase2s.coverage.refresh'
  | 'ac360.phase2s.integrity.run'
  | 'ac360.phase2s.pre_ui_gate.evaluate'
  | 'ac360.phase2s.pre_ui_gate.decide'
  | 'ac360.phase2s.hardening_event.record'
  | 'ac360.phase2s.alert.resolve'

function cleanMetadata(value: unknown) {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : {}
}

function text(value: unknown, fallback = '') {
  const normalized = String(value ?? '').trim()
  return normalized || fallback
}

async function currentActorId() {
  const user = await getCurrentUser().catch(() => null) as any
  return user?.id || null
}

async function executePhase2SRpc(
  wiringKey: Phase2SWiringKey,
  body: Ac360Phase2RuntimeQaPayload,
  rpcName: string,
  rpcArgs: Record<string, unknown>,
  metadata: Record<string, unknown> = {},
  quantity = 1,
) {
  const resolved = await resolveAc360SchoolOpsContext(String(body.orgId || body.org_id || '') || undefined)
  if (!resolved.ok) return resolved

  const idSeed = body.idempotencyKey || body.idempotency_key || `${resolved.orgId}:${wiringKey}:${body.runId || body.run_id || body.gateKey || body.gate_key || body.alertId || body.alert_id || Date.now()}`

  const guarded = await runAc360WiredAction(wiringKey as any, async () => {
    const db = await createClient()
    const { data, error } = await db.rpc(rpcName, { ...rpcArgs, p_org_id: resolved.orgId } as any)
    if (error) return { ok: false, status: 500, error: error.message || `AC360 Phase 2S RPC failed: ${rpcName}` }
    return { ok: true, status: 200, data }
  }, {
    orgId: resolved.orgId,
    quantity: Math.max(1, Math.ceil(quantity || 1)),
    idempotencyKey: buildAc360IdempotencyKey(wiringKey, idSeed),
    metadata: {
      source: 'lib.ac360.phase2-runtime-qa',
      phase: 'phase_2s_runtime_qa_pre_ui_gate',
      uiBuildAllowed: false,
      backendOnly: true,
      rpcName,
      ...metadata,
    },
  })

  if (!guarded.ok) {
    return { ok: false, status: 402, error: guarded.error || guarded.guard.reason || 'AC360 guard blocked Phase 2S action.', ac360: { guard: guarded.guard, blocked: true } }
  }

  return { ...(guarded.data as any), ac360: { guard: guarded.guard, usage: guarded.usage } }
}

export async function getAc360Phase2RuntimeQaDashboard(orgId?: string) {
  const resolved = await resolveAc360SchoolOpsContext(orgId)
  if (!resolved.ok) return resolved
  const db = await createClient()
  const { data, error } = await db.rpc('ac360_phase2_runtime_dashboard', { p_org_id: resolved.orgId } as any)
  if (error) return { ok: false as const, status: 500, error: error.message || 'Unable to load AC360 Phase 2 runtime QA dashboard.' }
  return { ok: true as const, context: resolved.context, dashboard: data }
}

export async function runAc360Phase2RuntimeQa(body: Ac360Phase2RuntimeQaPayload) {
  const actorId = await currentActorId()
  return executePhase2SRpc('ac360.phase2s.runtime_qa.run', body, 'ac360_run_phase2_runtime_qa', {
    p_actor_app_user_id: actorId,
    p_metadata: cleanMetadata(body.metadata || body.metadata_json),
  }, { phase2SAction: 'runtime_qa.run' })
}

export async function refreshAc360Phase2Coverage(body: Ac360Phase2RuntimeQaPayload) {
  const actorId = await currentActorId()
  return executePhase2SRpc('ac360.phase2s.coverage.refresh', body, 'ac360_refresh_phase2_coverage_matrix', {
    p_actor_app_user_id: actorId,
    p_metadata: cleanMetadata(body.metadata || body.metadata_json),
  }, { phase2SAction: 'coverage.refresh' })
}

export async function runAc360Phase2Integrity(body: Ac360Phase2RuntimeQaPayload) {
  const actorId = await currentActorId()
  return executePhase2SRpc('ac360.phase2s.integrity.run', body, 'ac360_run_phase2_integrity', {
    p_actor_app_user_id: actorId,
    p_metadata: cleanMetadata(body.metadata || body.metadata_json),
  }, { phase2SAction: 'integrity.run' })
}

export async function evaluateAc360Phase2PreUiGate(body: Ac360Phase2RuntimeQaPayload) {
  const actorId = await currentActorId()
  return executePhase2SRpc('ac360.phase2s.pre_ui_gate.evaluate', body, 'ac360_evaluate_phase2_pre_ui_gate', {
    p_actor_app_user_id: actorId,
    p_metadata: cleanMetadata(body.metadata || body.metadata_json),
  }, { phase2SAction: 'pre_ui_gate.evaluate' })
}

export async function decideAc360Phase2PreUiGate(body: Ac360Phase2RuntimeQaPayload) {
  const actorId = await currentActorId()
  return executePhase2SRpc('ac360.phase2s.pre_ui_gate.decide', body, 'ac360_decide_phase2_pre_ui_gate', {
    p_decision: text(body.decision, 'locked'),
    p_reason: body.reason || body.decisionReason || body.decision_reason || null,
    p_actor_app_user_id: actorId,
    p_metadata: cleanMetadata(body.metadata || body.metadata_json),
  }, { phase2SAction: 'pre_ui_gate.decide' })
}

export async function recordAc360Phase2HardeningEvent(body: Ac360Phase2RuntimeQaPayload) {
  const actorId = await currentActorId()
  return executePhase2SRpc('ac360.phase2s.hardening_event.record', body, 'ac360_record_phase2_hardening_event', {
    p_event_type: text(body.eventType || body.event_type, 'hardening'),
    p_title: text(body.title, 'Phase 2 hardening event'),
    p_message: body.message || null,
    p_severity: text(body.severity, 'medium'),
    p_module_key: body.moduleKey || body.module_key || null,
    p_action_key: body.actionKey || body.action_key || null,
    p_actor_app_user_id: actorId,
    p_metadata: cleanMetadata(body.metadata || body.metadata_json || body.evidence || body.evidence_json),
  }, { phase2SAction: 'hardening_event.record' })
}

export async function resolveAc360Phase2RuntimeAlert(body: Ac360Phase2RuntimeQaPayload) {
  const actorId = await currentActorId()
  return executePhase2SRpc('ac360.phase2s.alert.resolve', body, 'ac360_resolve_phase2_runtime_alert', {
    p_alert_id: body.alertId || body.alert_id || null,
    p_alert_key: body.alertKey || body.alert_key || null,
    p_actor_app_user_id: actorId,
    p_metadata: cleanMetadata(body.metadata || body.metadata_json),
  }, { phase2SAction: 'alert.resolve' })
}
