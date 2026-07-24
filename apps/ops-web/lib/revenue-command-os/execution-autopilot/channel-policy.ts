import 'server-only'

import { createServiceClient } from '@/lib/supabase/server'
import { normalizeRevenueOsChannelPolicies } from '../operational-read-model'
import type { RevenueOsChannelPolicy } from '../types'
import type { AdapterConfig } from './types'

type DbClient = Awaited<ReturnType<typeof createServiceClient>>

async function client(existing?: DbClient) {
  return existing || await createServiceClient()
}

export async function loadRevenueOsChannelPolicies(
  tenantId: string,
  existing?: DbClient,
): Promise<RevenueOsChannelPolicy[]> {
  const db = await client(existing) as any
  const [configs, registry, installation] = await Promise.all([
    db.from('revenue_os_adapter_configs').select('*').eq('tenant_id', tenantId),
    db.from('revenue_os_adapter_registry').select('*').in('adapter_code', ['email_os', 'gmail', 'whatsapp', 'calendar']),
    db.from('revenue_os_installations').select('installation_key,external_actions_enabled').eq('installation_key', 'revenue-command-os').maybeSingle(),
  ])
  if (configs.error) throw configs.error
  if (registry.error) throw registry.error
  if (installation.error) throw installation.error
  return normalizeRevenueOsChannelPolicies(configs.data || [], registry.data || [], Boolean(installation.data?.external_actions_enabled))
}

export async function updateRevenueOsWhatsappPolicy(input: {
  tenantId: string
  enabled: boolean
  actorId: string
  actorLabel: string
}): Promise<RevenueOsChannelPolicy[]> {
  const db = await client() as any
  const now = new Date().toISOString()
  const response = await db.from('revenue_os_adapter_configs').upsert({
    tenant_id: input.tenantId,
    adapter_code: 'whatsapp',
    enabled: input.enabled,
    execution_mode: 'approval_required',
    allow_internal: true,
    allow_approved_external: true,
    config: {
      userControllable: true,
      directUnapprovedExternal: false,
      changedBy: input.actorId,
      changedByLabel: input.actorLabel,
      changedAt: now,
    },
    updated_at: now,
  }, { onConflict: 'tenant_id,adapter_code' })
  if (response.error) throw response.error

  const installation = await db.from('revenue_os_installations')
    .select('metadata')
    .eq('installation_key', 'revenue-command-os')
    .maybeSingle()
  if (installation.error) throw installation.error
  const metadata = installation.data?.metadata && typeof installation.data.metadata === 'object'
    ? installation.data.metadata
    : {}
  const installationUpdate = await db.from('revenue_os_installations').update({
    external_actions_enabled: input.enabled,
    metadata: {
      ...metadata,
      allowApprovedExternalActions: input.enabled,
      whatsappEnabled: input.enabled,
      whatsappUserControllable: true,
      calendarEnabled: false,
      directGmailAdapterEnabled: false,
      channelPolicyChangedAt: now,
      channelPolicyChangedBy: input.actorId,
    },
    updated_at: now,
  }).eq('installation_key', 'revenue-command-os')
  if (installationUpdate.error) throw installationUpdate.error

  await db.from('revenue_os_propagation_audit_events').insert({
    tenant_id: input.tenantId,
    actor_id: input.actorId,
    idempotency_key: `channel-whatsapp-${input.enabled ? 'enabled' : 'disabled'}-${Date.now()}`,
    action: input.enabled ? 'channel.whatsapp.enabled' : 'channel.whatsapp.disabled',
    payload: {
      adapterCode: 'whatsapp',
      enabled: input.enabled,
      approvalRequired: true,
      directExternalActions: false,
      changedByLabel: input.actorLabel,
    },
  }).then(() => null, () => null)

  return loadRevenueOsChannelPolicies(input.tenantId, db)
}

export async function effectiveRevenueOsAdapterConfig(
  tenantId: string,
  config: AdapterConfig,
): Promise<AdapterConfig> {
  if (!['email_os', 'gmail', 'whatsapp', 'calendar'].includes(config.code)) return config

  try {
    const policies = await loadRevenueOsChannelPolicies(tenantId)
    const policy = policies.find((item) => item.code === config.code)
    if (!policy) return config
    return {
      ...config,
      enabled: policy.enabled,
      allowApprovedExternal: policy.approvalRequired && policy.enabled,
      metadata: {
        ...config.metadata,
        policyState: policy.policyState,
        policyReason: policy.reason,
        userControllable: policy.userControllable,
      },
    }
  } catch {
    if (config.code === 'email_os') return { ...config, enabled: true }
    if (config.code === 'gmail' || config.code === 'calendar') return { ...config, enabled: false, allowApprovedExternal: false }
    return { ...config, enabled: false, allowApprovedExternal: false }
  }
}
