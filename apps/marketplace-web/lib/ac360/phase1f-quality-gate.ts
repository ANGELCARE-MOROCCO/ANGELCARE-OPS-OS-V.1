import { createClient } from '@/lib/supabase/server'
import { AC360_CRITICAL_FLOW, AC360_FULL_ENGINE_COUNT, AC360_PHASE1_ENGINE_COUNT } from './constants'
import { getAc360CurrentContext, requireAc360Admin } from './runtime'

export type Ac360DeploymentDecision = 'approve' | 'ready' | 'waive' | 'waived' | 'block'

function normalizeResult<T extends Record<string, unknown>>(data: T | null, fallback: T): T {
  return data && typeof data === 'object' ? data : fallback
}

export async function getAc360FoundationQualityDashboard(orgId?: string) {
  const context = await getAc360CurrentContext(orgId)
  const db = await createClient()
  const resolvedOrgId = context.context?.org?.id || orgId || null

  const { data, error } = await db.rpc('ac360_foundation_readiness_dashboard', {
    p_org_id: resolvedOrgId,
  } as any)

  const dashboard = normalizeResult((data as any) || null, {
    ok: false,
    phase: 'phase_1f_foundation_qa_gate',
    latestRun: null,
    runs: [],
    results: [],
    gates: [],
    matrix: [],
    engineCoverage: [],
    events: [],
    rules: [],
    phase2Allowed: false,
  })

  return {
    ...context,
    dashboard: {
      ...dashboard,
      doctrine: AC360_CRITICAL_FLOW,
      expectedEngineCount: AC360_FULL_ENGINE_COUNT,
      phase1EngineCount: AC360_PHASE1_ENGINE_COUNT,
      errors: error ? [error.message || String(error)] : [],
    },
  }
}

export async function runAc360FoundationQa(input: { orgId?: string; metadata?: Record<string, unknown> } = {}) {
  const gate = await requireAc360Admin()
  if (!gate.ok) return gate

  const context = await getAc360CurrentContext(input.orgId)
  const resolvedOrgId = input.orgId || context.context?.org?.id || null
  const db = await createClient()

  const { data, error } = await db.rpc('ac360_run_foundation_qa', {
    p_org_id: resolvedOrgId,
    p_actor_app_user_id: gate.user.id || null,
    p_metadata: {
      ...(input.metadata || {}),
      source: 'lib.ac360.phase1f-quality-gate.runAc360FoundationQa',
      phase: 'phase_1f_foundation_qa_gate',
    },
  } as any)

  if (error) return { ok: false, status: 500, error: error.message || 'AC360 Phase 1F QA failed.' }
  return { ok: true, data }
}

export async function evaluateAc360DeploymentGate(input: { orgId?: string; metadata?: Record<string, unknown> } = {}) {
  const gate = await requireAc360Admin()
  if (!gate.ok) return gate

  const context = await getAc360CurrentContext(input.orgId)
  const resolvedOrgId = input.orgId || context.context?.org?.id || null
  const db = await createClient()

  const { data, error } = await db.rpc('ac360_evaluate_deployment_gate', {
    p_org_id: resolvedOrgId,
    p_actor_app_user_id: gate.user.id || null,
    p_metadata: {
      ...(input.metadata || {}),
      source: 'lib.ac360.phase1f-quality-gate.evaluateAc360DeploymentGate',
      phase: 'phase_1f_foundation_qa_gate',
    },
  } as any)

  if (error) return { ok: false, status: 500, error: error.message || 'AC360 deployment gate evaluation failed.' }
  return { ok: true, data }
}

export async function decideAc360DeploymentGate(input: { gateKey: string; decision: Ac360DeploymentDecision; reason?: string; metadata?: Record<string, unknown> }) {
  const gate = await requireAc360Admin()
  if (!gate.ok) return gate

  const db = await createClient()
  const { data, error } = await db.rpc('ac360_decide_deployment_gate', {
    p_gate_key: input.gateKey,
    p_decision: input.decision,
    p_reason: input.reason || null,
    p_actor_app_user_id: gate.user.id || null,
    p_metadata: {
      ...(input.metadata || {}),
      source: 'lib.ac360.phase1f-quality-gate.decideAc360DeploymentGate',
      phase: 'phase_1f_foundation_qa_gate',
    },
  } as any)

  if (error) return { ok: false, status: 500, error: error.message || 'AC360 deployment gate decision failed.' }
  return { ok: true, data }
}

export async function getAc360ReadinessMatrix(orgId?: string) {
  const dashboard = await getAc360FoundationQualityDashboard(orgId)
  return {
    ok: dashboard.dashboard?.ok !== false,
    context: dashboard.context,
    matrix: dashboard.dashboard?.matrix || [],
    engineCoverage: dashboard.dashboard?.engineCoverage || [],
    gates: dashboard.dashboard?.gates || [],
    latestRun: dashboard.dashboard?.latestRun || null,
    phase2Allowed: Boolean(dashboard.dashboard?.phase2Allowed),
    errors: dashboard.dashboard?.errors || [],
  }
}
