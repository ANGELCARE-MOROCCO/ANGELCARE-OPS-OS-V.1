import 'server-only'
import { createServiceClient } from '@/lib/supabase/server'
import { normalizeRevenueOsChannelPolicies } from '../operational-read-model'
import type { RevenueOsChannelPolicy } from '../types'
import type { AdapterConfig } from './types'

type DbClient = Awaited<ReturnType<typeof createServiceClient>>
async function client(existing?: DbClient) { return existing || await createServiceClient() }

export async function loadRevenueOsChannelPolicies(tenantId: string, existing?: DbClient): Promise<RevenueOsChannelPolicy[]> {
  const db = await client(existing) as any
  const [configs, registry] = await Promise.all([
    db.from('revenue_os_adapter_configs').select('*').eq('tenant_id', tenantId),
    db.from('revenue_os_adapter_registry').select('*').in('adapter_code', ['email_os', 'gmail', 'whatsapp', 'calendar']),
  ])
  if (configs.error) throw configs.error
  if (registry.error) throw registry.error
  return normalizeRevenueOsChannelPolicies(configs.data || [], registry.data || [], true)
}

export async function updateRevenueOsWhatsappPolicy(input: { tenantId: string; enabled: boolean; actorId: string; actorLabel: string }): Promise<RevenueOsChannelPolicy[]> {
  const db = await client() as any
  const now = new Date().toISOString()
  const response = await db.from('revenue_os_adapter_configs').upsert({
    tenant_id: input.tenantId, adapter_code: 'whatsapp', enabled: input.enabled,
    execution_mode: 'live', allow_internal: true, allow_approved_external: input.enabled,
    config: { userControllable: true, changedBy: input.actorId, changedByLabel: input.actorLabel, changedAt: now, trustedOperatorLive: true },
    updated_at: now,
  }, { onConflict: 'tenant_id,adapter_code' })
  if (response.error) throw response.error
  await db.from('revenue_os_propagation_audit_events').insert({
    tenant_id: input.tenantId, actor_id: input.actorId,
    idempotency_key: `channel-whatsapp-${input.enabled ? 'enabled' : 'disabled'}-${Date.now()}`,
    action: input.enabled ? 'channel.whatsapp.enabled' : 'channel.whatsapp.disabled',
    payload: { adapterCode: 'whatsapp', enabled: input.enabled, approvalRequired: false, changedByLabel: input.actorLabel },
  }).then(() => null, () => null)
  return loadRevenueOsChannelPolicies(input.tenantId, db)
}

export async function effectiveRevenueOsAdapterConfig(tenantId: string, config: AdapterConfig): Promise<AdapterConfig> {
  if (!['email_os', 'gmail', 'whatsapp', 'calendar'].includes(config.code)) return { ...config, executionMode: 'live', allowInternal: true, allowApprovedExternal: config.enabled }
  try {
    const policy = (await loadRevenueOsChannelPolicies(tenantId)).find((item) => item.code === config.code)
    if (!policy) return config
    return { ...config, executionMode: 'live', enabled: policy.enabled, allowInternal: true, allowApprovedExternal: policy.enabled, metadata: { ...config.metadata, policyState: policy.policyState, policyReason: policy.reason, userControllable: policy.userControllable, trustedOperatorLive: true } }
  } catch {
    if (config.code === 'email_os') return { ...config, executionMode: 'live', enabled: true, allowApprovedExternal: true }
    if (config.code === 'gmail' || config.code === 'calendar') return { ...config, executionMode: 'live', enabled: false, allowApprovedExternal: false }
    return { ...config, executionMode: 'live', enabled: false, allowApprovedExternal: false }
  }
}
