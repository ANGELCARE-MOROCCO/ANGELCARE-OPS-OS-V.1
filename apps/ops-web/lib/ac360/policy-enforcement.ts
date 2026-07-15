
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/getUser'
import { getAc360CurrentContext, requireAc360Admin } from './runtime'
import type { Ac360GuardResult } from './guard'

export type Ac360PolicySafetyInput = {
  orgId?: string
  actionKey: string
  featureKey?: string | null
  meterKey?: string | null
  routePath?: string | null
  httpMethod?: string | null
  quantity?: number
  metadata?: Record<string, unknown>
}

export type Ac360PolicySafetyResult = {
  ok: boolean
  allowed: boolean
  decision: string
  reason: string
  guardStage?: string
  failsafe?: string
  policyLockKey?: string | null
  overrideAllowed?: boolean
  overrideRequestId?: string | null
  event?: unknown
  raw?: unknown
}

export const AC360_PHASE1E_POLICY_DOCTRINE = [
  'Resolve organization and actor context',
  'Verify action registry and route wiring',
  'Apply active policy locks and fail-closed rules',
  'Check active restrictions and approved overrides',
  'Pass to subscription / entitlement / usage / credits guard',
  'Record blocked UX events, guard decisions and audit logs',
  'Preserve data after cancellation and enforce read-only access',
]

export const AC360_PHASE1E_ROUTE_COVERAGE = [
  { routePath: '/api/ac360/addons', method: 'POST', actionKey: 'addon.activate', module: 'angelcare_360', phase: 'phase_1d' },
  { routePath: '/api/ac360/addons', method: 'DELETE', actionKey: 'addon.cancel', module: 'angelcare_360', phase: 'phase_1d' },
  { routePath: '/api/ac360/credits/topup', method: 'POST', actionKey: 'credits.topup', module: 'angelcare_360', phase: 'phase_1d' },
  { routePath: '/api/ac360/invoices/generate', method: 'POST', actionKey: 'invoice.generate', module: 'angelcare_360', phase: 'phase_1d' },
  { routePath: '/api/ac360/lifecycle/reconcile', method: 'POST', actionKey: 'lifecycle.reconcile', module: 'angelcare_360', phase: 'phase_1d' },
  { routePath: '/api/ac360/capacity/snapshot', method: 'POST', actionKey: 'capacity.measure', module: 'angelcare_360', phase: 'phase_1d' },
  { routePath: '/api/email-os/compose/send', method: 'POST', actionKey: 'communication.email_send', module: 'email_os', phase: 'phase_1d' },
  { routePath: '/api/email-os/ai-assist', method: 'POST', actionKey: 'ai.message_generate', module: 'email_os', phase: 'phase_1d' },
  { routePath: '/api/email-os/compose/attachments', method: 'POST', actionKey: 'document.attachment_register', module: 'email_os', phase: 'phase_1d' },
  { routePath: '/api/capital-command-center/tasks', method: 'POST', actionKey: 'operations.task_create', module: 'capital_command_center', phase: 'phase_1d' },
  { routePath: '/api/capital-command-center/tasks/import', method: 'POST', actionKey: 'operations.task_import', module: 'capital_command_center', phase: 'phase_1d' },
  { routePath: '/api/tasks', method: 'PATCH', actionKey: 'operations.task_update', module: 'revenue_tasks', phase: 'phase_1d' },
  { routePath: '/api/ac360/policy/preflight', method: 'POST', actionKey: 'policy.preflight', module: 'angelcare_360', phase: 'phase_1e' },
  { routePath: '/api/ac360/policy/override', method: 'POST', actionKey: 'policy.override_request', module: 'angelcare_360', phase: 'phase_1e' },
  { routePath: '/api/ac360/policy/override', method: 'PATCH', actionKey: 'policy.override_decide', module: 'angelcare_360', phase: 'phase_1e' },
  { routePath: '/api/ac360/policy/events', method: 'POST', actionKey: 'policy.event.record', module: 'angelcare_360', phase: 'phase_1e' },
  { routePath: '/api/ac360/policy-center', method: 'POST', actionKey: 'policy.safety_reconcile', module: 'angelcare_360', phase: 'phase_1e' },
  { routePath: '/api/ac360/route-coverage/scan', method: 'POST', actionKey: 'route_coverage.scan', module: 'angelcare_360', phase: 'phase_1e' },
] as const

function normalizePolicyResult(data: any, fallback: Partial<Ac360PolicySafetyResult> = {}): Ac360PolicySafetyResult {
  return {
    ok: Boolean(data?.ok ?? fallback.ok ?? true),
    allowed: Boolean(data?.allowed ?? fallback.allowed ?? false),
    decision: String(data?.decision || fallback.decision || (data?.allowed ? 'policy_clear' : 'policy_locked')),
    reason: String(data?.reason || fallback.reason || 'AC360 policy safety decision returned.'),
    guardStage: data?.guard_stage || data?.guardStage || fallback.guardStage || 'policy',
    failsafe: data?.failsafe || fallback.failsafe || 'checked',
    policyLockKey: data?.policyLockKey || data?.policy_lock_key || fallback.policyLockKey || null,
    overrideAllowed: Boolean(data?.overrideAllowed ?? data?.override_allowed ?? fallback.overrideAllowed ?? false),
    overrideRequestId: data?.overrideRequestId || data?.override_request_id || fallback.overrideRequestId || null,
    event: data?.event || fallback.event,
    raw: data || fallback.raw,
  }
}

export function ac360PolicyToGuardResult(policy: Ac360PolicySafetyResult, actionKey: string): Ac360GuardResult {
  return {
    ok: policy.ok,
    allowed: policy.allowed,
    decision: policy.decision,
    reason: policy.reason,
    source: 'policy',
    guardStage: policy.guardStage || 'policy',
    actionKey,
    raw: policy.raw,
  }
}

export async function resolveAc360PolicySafety(input: Ac360PolicySafetyInput): Promise<Ac360PolicySafetyResult> {
  if (!input.actionKey) {
    return { ok: false, allowed: false, decision: 'action_required', reason: 'AC360 policy safety requires actionKey.', guardStage: 'policy_validation', failsafe: 'fail_closed' }
  }

  const db = await createClient()
  const actor = (await getCurrentUser().catch(() => null)) as any
  const context = await getAc360CurrentContext(input.orgId).catch((error) => ({ ok: false, error: error instanceof Error ? error.message : String(error), context: null })) as any
  const resolvedOrgId = input.orgId || context.context?.org?.id

  if (!resolvedOrgId) {
    return {
      ok: false,
      allowed: false,
      decision: context.needsBootstrap ? 'bootstrap_required' : 'organization_required',
      reason: context.needsBootstrap ? 'AC360 tenant must be bootstrapped before production actions.' : 'Unable to resolve organization for AC360 policy safety.',
      guardStage: 'policy_context',
      failsafe: 'fail_closed',
    }
  }

  try {
    const { data, error } = await db.rpc('ac360_resolve_policy_safety', {
      p_org_id: resolvedOrgId,
      p_action_key: input.actionKey,
      p_feature_key: input.featureKey || null,
      p_meter_key: input.meterKey || null,
      p_route_path: input.routePath || null,
      p_http_method: input.httpMethod || null,
      p_quantity: Number(input.quantity || 1),
      p_actor_app_user_id: actor?.id || null,
      p_metadata: input.metadata || {},
    })

    if (error) {
      return { ok: false, allowed: false, decision: 'policy_rpc_error', reason: error.message || 'AC360 policy RPC failed. Fail-closed.', guardStage: 'policy_rpc', failsafe: 'fail_closed' }
    }
    return normalizePolicyResult(data)
  } catch (error) {
    return { ok: false, allowed: false, decision: 'policy_exception', reason: error instanceof Error ? error.message : 'AC360 policy safety failed. Fail-closed.', guardStage: 'policy_exception', failsafe: 'fail_closed' }
  }
}

export async function recordAc360PolicyEvent(input: {
  orgId?: string
  eventKey: string
  actionKey?: string | null
  featureKey?: string | null
  meterKey?: string | null
  routePath?: string | null
  httpMethod?: string | null
  severity?: 'info' | 'warning' | 'critical'
  status?: 'open' | 'acknowledged' | 'resolved' | 'archived'
  message: string
  guardDecisionId?: string | null
  overrideRequestId?: string | null
  metadata?: Record<string, unknown>
}) {
  const db = await createClient()
  const actor = (await getCurrentUser().catch(() => null)) as any
  const context = await getAc360CurrentContext(input.orgId).catch(() => null) as any
  const resolvedOrgId = input.orgId || context?.context?.org?.id || null

  const { data, error } = await db.rpc('ac360_create_policy_event', {
    p_org_id: resolvedOrgId,
    p_actor_app_user_id: actor?.id || null,
    p_event_key: input.eventKey,
    p_action_key: input.actionKey || null,
    p_feature_key: input.featureKey || null,
    p_meter_key: input.meterKey || null,
    p_route_path: input.routePath || null,
    p_http_method: input.httpMethod || null,
    p_severity: input.severity || 'warning',
    p_status: input.status || 'open',
    p_message: input.message,
    p_guard_decision_id: input.guardDecisionId || null,
    p_override_request_id: input.overrideRequestId || null,
    p_metadata: input.metadata || {},
  })

  if (error) return { ok: false, error: error.message }
  return data || { ok: true }
}

export function buildAc360BlockedActionUx(guard?: Partial<Ac360GuardResult> | null) {
  const decision = String(guard?.decision || 'policy_locked')
  const base = {
    blocked: true,
    severity: decision.includes('restricted') || decision.includes('policy') ? 'critical' : 'warning',
    title: 'Action blocked by AngelCare 360',
    message: guard?.reason || 'This action cannot run until billing, entitlement, usage, credit or policy requirements are satisfied.',
    primaryAction: { label: 'Open Billing Center', href: '/angelcare-360/billing-center' },
    secondaryAction: { label: 'Open Policy Lock', href: '/angelcare-360/policy-lock' },
    supportHint: 'Resolve package limits, credits, restrictions or request a controlled admin override.',
  }

  if (decision.includes('credit')) return { ...base, title: 'AngelCare Credits required', primaryAction: { label: 'Top up credits', href: '/angelcare-360/billing-center' } }
  if (decision.includes('capacity')) return { ...base, title: 'Package capacity reached', primaryAction: { label: 'Add capacity or upgrade', href: '/angelcare-360/billing-center' } }
  if (decision.includes('restriction') || decision.includes('billing_restricted')) return { ...base, title: 'Account restricted', severity: 'critical' }
  if (decision.includes('unknown') || decision.includes('wiring')) return { ...base, title: 'Action wiring missing', primaryAction: { label: 'Open Action Wiring', href: '/angelcare-360/action-wiring' } }
  if (decision.includes('policy')) return { ...base, title: 'Policy safety lock active', severity: 'critical' }
  return base
}

export function ac360PolicyBlockedResponse(result: { guard?: Partial<Ac360GuardResult>; error?: string }, status = 402) {
  const guard = result.guard || {}
  const response = NextResponse.json({
    ok: false,
    error: result.error || guard.reason || 'AC360 policy blocked this action.',
    ac360: {
      blocked: true,
      decision: guard.decision || 'policy_locked',
      reason: guard.reason || result.error || 'Action blocked by AC360 policy.',
      actionKey: guard.actionKey,
      featureKey: guard.featureKey,
      meterKey: guard.meterKey,
      guardStage: guard.guardStage || 'policy',
      guardDecisionId: guard.guardDecisionId,
      credits: guard.credits,
      capacity: guard.capacity,
      ui: buildAc360BlockedActionUx(guard),
    },
  }, { status })
  response.headers.set('Cache-Control', 'no-store')
  return response
}

export async function requestAc360PolicyOverride(input: {
  orgId: string
  actionKey: string
  reason: string
  featureKey?: string
  meterKey?: string
  routePath?: string
  quantity?: number
  requestedBehavior?: string
  expiresAt?: string
  guardDecisionId?: string
  metadata?: Record<string, unknown>
}) {
  const db = await createClient()
  const actor = (await getCurrentUser().catch(() => null)) as any
  const { data, error } = await db.rpc('ac360_request_policy_override', {
    p_org_id: input.orgId,
    p_action_key: input.actionKey,
    p_reason: input.reason,
    p_actor_app_user_id: actor?.id || null,
    p_feature_key: input.featureKey || null,
    p_meter_key: input.meterKey || null,
    p_route_path: input.routePath || null,
    p_quantity: Number(input.quantity || 1),
    p_requested_behavior: input.requestedBehavior || 'single_action_override',
    p_expires_at: input.expiresAt || null,
    p_guard_decision_id: input.guardDecisionId || null,
    p_metadata: input.metadata || {},
  })
  if (error) return { ok: false, status: 500, error: error.message }
  return data || { ok: true }
}

export async function decideAc360PolicyOverride(input: { requestId: string; decision: 'approved' | 'denied' | 'cancelled'; decisionReason: string; expiresAt?: string }) {
  const gate = await requireAc360Admin()
  if (!gate.ok) return gate
  const db = await createClient()
  const { data, error } = await db.rpc('ac360_decide_policy_override', {
    p_request_id: input.requestId,
    p_decision: input.decision,
    p_decision_reason: input.decisionReason,
    p_decided_by_app_user_id: gate.user.id || null,
    p_expires_at: input.expiresAt || null,
  })
  if (error) return { ok: false, status: 500, error: error.message }
  return data || { ok: true }
}

export async function scanAc360RouteCoverage() {
  const gate = await requireAc360Admin()
  if (!gate.ok) return gate
  const db = await createClient()
  const results: unknown[] = []
  for (const item of AC360_PHASE1E_ROUTE_COVERAGE) {
    const { data, error } = await db
      .from('ac360_route_coverage_audits')
      .upsert({
        route_path: item.routePath,
        http_method: item.method,
        target_module: item.module,
        expected_action_key: item.actionKey,
        coverage_status: 'covered',
        enforcement_mode: 'strict',
        last_scanned_at: new Date().toISOString(),
        metadata_json: { phase: item.phase, source: 'phase1e_static_route_coverage_scan' },
        updated_at: new Date().toISOString(),
      }, { onConflict: 'route_path,http_method' })
      .select('*')
      .maybeSingle()
    results.push({ ok: !error, routePath: item.routePath, method: item.method, error: error?.message, data })
  }
  return { ok: true, scanned: results.length, results }
}

export async function reconcileAc360PolicySafety(orgId?: string) {
  const gate = await requireAc360Admin()
  if (!gate.ok) return gate
  const context = await getAc360CurrentContext(orgId)
  const resolvedOrgId = orgId || context.context?.org?.id
  if (!resolvedOrgId) return { ok: false, status: 400, error: 'Unable to resolve AC360 organization for policy reconciliation.' }
  const db = await createClient()
  const { data, error } = await db.rpc('ac360_reconcile_policy_safety', { p_org_id: resolvedOrgId })
  if (error) return { ok: false, status: 500, error: error.message }
  return { ok: true, data }
}

export async function getAc360PolicyCenter(orgId?: string) {
  const context = await getAc360CurrentContext(orgId)
  if (!context.ok || !context.context?.org?.id) return { ...context, policy: null }

  const db = await createClient()
  const resolvedOrgId = context.context.org.id
  const [locks, events, overrides, coverage, blockedMessages, decisions, restrictions, dashboard, rules, audits] = await Promise.all([
    db.from('ac360_policy_locks').select('*').order('sort_order', { ascending: true }),
    db.from('ac360_policy_events').select('*').eq('org_id', resolvedOrgId).order('created_at', { ascending: false }).limit(80),
    db.from('ac360_policy_override_requests').select('*').eq('org_id', resolvedOrgId).order('created_at', { ascending: false }).limit(80),
    db.from('ac360_route_coverage_audits').select('*').order('target_module', { ascending: true }).order('route_path', { ascending: true }),
    db.from('ac360_blocked_action_messages').select('*').eq('status', 'active').order('decision_key', { ascending: true }),
    db.from('ac360_guard_decisions').select('*').eq('org_id', resolvedOrgId).order('created_at', { ascending: false }).limit(80),
    db.from('ac360_restrictions').select('*').eq('org_id', resolvedOrgId).eq('status', 'active').order('created_at', { ascending: false }).limit(50),
    db.from('ac360_policy_safety_dashboard').select('*').eq('org_id', resolvedOrgId).maybeSingle(),
    db.from('ac360_automation_rules').select('*').like('rule_key', 'phase1e.%').order('sort_order', { ascending: true }),
    db.from('ac360_audit_logs').select('*').eq('org_id', resolvedOrgId).in('event_code', ['policy.event.recorded','policy.override.requested','policy.override.applied','policy.safety.reconciled']).order('created_at', { ascending: false }).limit(60),
  ] as any)

  return {
    ...context,
    policy: {
      locks: locks.data || [],
      events: events.data || [],
      overrides: overrides.data || [],
      coverage: coverage.data || [],
      blockedMessages: blockedMessages.data || [],
      decisions: decisions.data || [],
      restrictions: restrictions.data || [],
      dashboard: dashboard.data || null,
      rules: rules.data || [],
      audits: audits.data || [],
      doctrine: AC360_PHASE1E_POLICY_DOCTRINE,
      routeCoverageStatic: AC360_PHASE1E_ROUTE_COVERAGE,
      errors: [locks.error, events.error, overrides.error, coverage.error, blockedMessages.error, decisions.error, restrictions.error, dashboard.error, rules.error, audits.error].filter(Boolean).map((error: any) => error.message || String(error)),
    },
  }
}
