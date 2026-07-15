import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/getUser'
import { getAc360CurrentContext } from './runtime'

export type Ac360GuardInput = {
  orgId?: string
  actionKey: string
  quantity?: number
  idempotencyKey?: string
  metadata?: Record<string, unknown>
  currentCapacity?: number | null
}

export type Ac360GuardResult = {
  ok: boolean
  allowed: boolean
  decision: string
  reason: string
  source?: string
  guardStage?: string
  guardDecisionId?: string
  actionKey?: string
  featureKey?: string
  meterKey?: string | null
  subscriptionId?: string | null
  usageEventId?: string | null
  accessMode?: string | null
  capacity?: Record<string, unknown>
  credits?: Record<string, unknown>
  recordUsage?: boolean
  raw?: any
  error?: string
}

function asNumber(value: unknown, fallback = 1) {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

async function resolveGuardOrgId(orgId?: string) {
  const context = await getAc360CurrentContext(orgId)
  const resolvedOrgId = orgId || context.context?.org?.id
  return { context, resolvedOrgId }
}

export async function guardAc360Action(input: Ac360GuardInput, options?: { recordUsage?: boolean }): Promise<Ac360GuardResult> {
  if (!input?.actionKey) {
    return { ok: false, allowed: false, decision: 'validation_error', reason: 'actionKey is required.' }
  }

  const db = await createClient()
  const actor = (await getCurrentUser().catch(() => null)) as any
  const { context, resolvedOrgId } = await resolveGuardOrgId(input.orgId)

  if (!resolvedOrgId) {
    return {
      ok: false,
      allowed: false,
      decision: context.needsBootstrap ? 'bootstrap_required' : 'organization_required',
      reason: context.needsBootstrap ? 'AC360 tenant is not bootstrapped for this user yet.' : 'Unable to resolve AC360 organization for guard check.',
      source: 'context',
      guardStage: 'context',
    }
  }

  try {
    const { data, error } = await db.rpc('ac360_guard_action', {
      p_org_id: resolvedOrgId,
      p_action_key: input.actionKey,
      p_quantity: asNumber(input.quantity, 1),
      p_actor_app_user_id: actor?.id || null,
      p_idempotency_key: input.idempotencyKey || null,
      p_metadata: input.metadata || {},
      p_record_usage: Boolean(options?.recordUsage),
      p_current_capacity: input.currentCapacity == null ? null : Number(input.currentCapacity),
    })

    if (error) {
      return { ok: false, allowed: false, decision: 'rpc_error', reason: error.message || 'AC360 guard RPC failed.', source: 'rpc', guardStage: 'rpc', error: error.message }
    }

    return {
      ok: Boolean(data?.ok ?? true),
      allowed: Boolean(data?.allowed),
      decision: String(data?.decision || (data?.allowed ? 'allowed' : 'blocked')),
      reason: String(data?.reason || 'AC360 guard decision returned.'),
      source: data?.source || 'guard',
      guardStage: data?.guardStage || data?.guard_stage,
      guardDecisionId: data?.guardDecisionId || data?.guard_decision_id,
      actionKey: data?.actionKey || data?.action_key || input.actionKey,
      featureKey: data?.featureKey || data?.feature_key,
      meterKey: data?.meterKey || data?.meter_key || null,
      subscriptionId: data?.subscriptionId || data?.subscription_id || null,
      usageEventId: data?.usageEventId || data?.usage_event_id || null,
      accessMode: data?.accessMode || data?.access_mode || null,
      capacity: data?.capacity || {},
      credits: data?.credits || {},
      recordUsage: Boolean(data?.recordUsage || data?.record_usage),
      raw: data,
    }
  } catch (error) {
    return { ok: false, allowed: false, decision: 'exception', reason: error instanceof Error ? error.message : 'AC360 guard action failed.', source: 'exception', guardStage: 'exception' }
  }
}

export async function executeAc360GuardedAction(input: Ac360GuardInput) {
  return guardAc360Action(input, { recordUsage: true })
}

export async function measureAc360Capacity(input: { orgId?: string; capacityKey: string; currentValue?: number; sourceTable?: string; metadata?: Record<string, unknown> }) {
  const db = await createClient()
  const { context, resolvedOrgId } = await resolveGuardOrgId(input.orgId)
  if (!resolvedOrgId) {
    return { ok: false, error: context.needsBootstrap ? 'AC360 tenant bootstrap required.' : 'Unable to resolve AC360 organization.' }
  }

  const { data, error } = await db.rpc('ac360_measure_capacity', {
    p_org_id: resolvedOrgId,
    p_capacity_key: input.capacityKey,
    p_current_value: input.currentValue == null ? null : Number(input.currentValue),
    p_source_table: input.sourceTable || null,
    p_metadata: input.metadata || {},
  })

  if (error) return { ok: false, error: error.message || 'AC360 capacity measurement failed.' }
  return data || { ok: true }
}

export async function getAc360GuardrailsCenter(orgId?: string) {
  const context = await getAc360CurrentContext(orgId)
  if (!context.ok || !context.context?.org?.id) return { ...context, guardrails: null }

  const db = await createClient()
  const resolvedOrgId = context.context.org.id

  const [actions, decisions, capacities, restrictions, usage, audits, rules] = await Promise.all([
    db.from('ac360_action_registry').select('*, feature:ac360_feature_registry(*)').order('action_key', { ascending: true }).limit(120),
    db.from('ac360_guard_decisions').select('*').eq('org_id', resolvedOrgId).order('created_at', { ascending: false }).limit(80),
    db.from('ac360_capacity_snapshots').select('*').eq('org_id', resolvedOrgId).order('measured_at', { ascending: false }).limit(40),
    db.from('ac360_restrictions').select('*').eq('org_id', resolvedOrgId).eq('status', 'active').order('created_at', { ascending: false }).limit(40),
    db.from('ac360_usage_summaries').select('*').eq('org_id', resolvedOrgId).order('period_start', { ascending: false }).limit(40),
    db.from('ac360_audit_logs').select('*').eq('org_id', resolvedOrgId).ilike('event_code', 'guard.%').order('created_at', { ascending: false }).limit(50),
    db.from('ac360_automation_rules').select('*').like('rule_key', 'phase1c.guard.%').order('sort_order', { ascending: true }).limit(20),
  ] as any)

  return {
    ...context,
    guardrails: {
      actions: actions.data || [],
      decisions: decisions.data || [],
      capacities: capacities.data || [],
      restrictions: restrictions.data || [],
      usage: usage.data || [],
      audits: audits.data || [],
      rules: rules.data || [],
      errors: [actions.error, decisions.error, capacities.error, restrictions.error, usage.error, audits.error, rules.error].filter(Boolean).map((error: any) => error.message || String(error)),
    },
  }
}

export async function runAc360GuardedAction<T>(
  input: Ac360GuardInput,
  executor: () => Promise<T>,
  options?: { recordUsageAfterSuccess?: boolean; idempotencyPrefix?: string }
): Promise<{ ok: true; data: T; guard: Ac360GuardResult; usage?: Ac360GuardResult } | { ok: false; guard: Ac360GuardResult; error?: string }> {
  const baseIdempotencyKey = input.idempotencyKey || `${options?.idempotencyPrefix || 'guarded'}:${input.actionKey}:${Date.now()}`
  const preflight = await guardAc360Action({
    ...input,
    idempotencyKey: `${baseIdempotencyKey}:preflight`,
  }, { recordUsage: false })
  if (!preflight.allowed) return { ok: false, guard: preflight, error: preflight.reason }

  const data = await executor()

  if (options?.recordUsageAfterSuccess === false) {
    return { ok: true, data, guard: preflight }
  }

  const usage = await executeAc360GuardedAction({
    ...input,
    idempotencyKey: `${baseIdempotencyKey}:usage`,
  })

  if (!usage.allowed) return { ok: false, guard: usage, error: usage.reason }
  return { ok: true, data, guard: preflight, usage }
}
