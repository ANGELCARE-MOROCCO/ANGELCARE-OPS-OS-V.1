import { getOperatorClient, safeList, toRecord } from './shared'
import { requireAngelcare360OperatorPermission } from './access'
import { writeOperatorAuditLog } from './audit'
import { operatorFeatureFlagUpdateSchema, operatorUsageLimitUpdateSchema } from './validation'
import type { Angelcare360OperatorFeatureFlagRecord, Angelcare360OperatorUsageLimitRecord } from '@/types/angelcare360/operator'

export async function listOperatorFeatureFlags() {
  await requireAngelcare360OperatorPermission('operator.features.view')
  return (await safeList('angelcare360_operator_feature_flags', '*', [], ['updated_at', { ascending: false }])) as Angelcare360OperatorFeatureFlagRecord[]
}

export async function updateOperatorFeatureFlag(input: unknown) {
  const parsed = operatorFeatureFlagUpdateSchema.safeParse(input)
  if (!parsed.success) return { ok: false, error: parsed.errors[0]?.message || 'Le feature flag est invalide.' }
  const session = await requireAngelcare360OperatorPermission('operator.features.update')
  const supabase = await getOperatorClient()
  const { data: before } = await supabase.from('angelcare360_operator_feature_flags').select('*').eq('id', parsed.data.id).maybeSingle()
  const payload = {
    enabled: parsed.data.enabled,
    status: parsed.data.status,
    locked_reason: parsed.data.lockedReason || null,
    scheduled_for: parsed.data.scheduledFor || null,
    activated_at: parsed.data.enabled ? new Date().toISOString() : (before as Record<string, unknown> | null)?.activated_at || null,
    updated_at: new Date().toISOString(),
  }
  const { data, error } = await supabase.from('angelcare360_operator_feature_flags').update(payload).eq('id', parsed.data.id).select('*').single()
  if (error) return { ok: false, error: error.message }
  await writeOperatorAuditLog({
    module: 'features',
    action: 'feature_flag.updated',
    entityType: 'angelcare360_operator_feature_flags',
    entityId: String(data.id),
    clientId: String((data as Record<string, unknown>).client_id),
    tenantId: (data as Record<string, unknown>).tenant_id ? String((data as Record<string, unknown>).tenant_id) : null,
    severity: parsed.data.enabled ? 'notice' : 'warning',
    beforeData: toRecord(before),
    afterData: payload,
    metadata: { operator_role: session.operatorRole },
  })
  return { ok: true, record: data as Angelcare360OperatorFeatureFlagRecord }
}

export async function listOperatorUsageLimits() {
  await requireAngelcare360OperatorPermission('operator.usage.view')
  return (await safeList('angelcare360_operator_usage_limits', '*', [], ['updated_at', { ascending: false }])) as Angelcare360OperatorUsageLimitRecord[]
}

export async function updateOperatorUsageLimit(input: unknown) {
  const parsed = operatorUsageLimitUpdateSchema.safeParse(input)
  if (!parsed.success) return { ok: false, error: parsed.errors[0]?.message || 'La limite est invalide.' }
  const session = await requireAngelcare360OperatorPermission('operator.usage.update')
  const supabase = await getOperatorClient()
  const { data: before } = await supabase.from('angelcare360_operator_usage_limits').select('*').eq('id', parsed.data.id).maybeSingle()
  const payload = {
    allowed_value: parsed.data.allowedValue ?? (before as Record<string, unknown> | null)?.allowed_value ?? null,
    current_value: parsed.data.currentValue ?? (before as Record<string, unknown> | null)?.current_value ?? 0,
    status: parsed.data.status,
    reset_cycle: parsed.data.resetCycle || (before as Record<string, unknown> | null)?.reset_cycle || null,
    updated_at: new Date().toISOString(),
  }
  const { data, error } = await supabase.from('angelcare360_operator_usage_limits').update(payload).eq('id', parsed.data.id).select('*').single()
  if (error) return { ok: false, error: error.message }
  await writeOperatorAuditLog({
    module: 'usage',
    action: 'usage_limit.updated',
    entityType: 'angelcare360_operator_usage_limits',
    entityId: String(data.id),
    clientId: String((data as Record<string, unknown>).client_id),
    tenantId: (data as Record<string, unknown>).tenant_id ? String((data as Record<string, unknown>).tenant_id) : null,
    severity: 'notice',
    beforeData: toRecord(before),
    afterData: payload,
    metadata: { operator_role: session.operatorRole },
  })
  return { ok: true, record: data as Angelcare360OperatorUsageLimitRecord }
}

export async function getOperatorModuleEntitlements() {
  await requireAngelcare360OperatorPermission('operator.features.view')
  const [features, plans] = await Promise.all([listOperatorFeatureFlags(), safeList('angelcare360_operator_plans', '*', [], ['name', { ascending: true }])])
  return {
    features,
    plans,
  }
}
