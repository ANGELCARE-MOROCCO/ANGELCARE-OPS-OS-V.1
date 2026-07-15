import { getOperatorClient, safeList, summarizeMoney, toRecord } from './shared'
import { requireAngelcare360OperatorPermission } from './access'
import { writeOperatorAuditLog } from './audit'
import { operatorTenantCreateOrLinkSchema, operatorTenantUpdateStatusSchema } from './validation'
import type { Angelcare360OperatorTenantRecord } from '@/types/angelcare360/operator'

export async function listOperatorTenants() {
  await requireAngelcare360OperatorPermission('operator.tenants.view')
  const rows = await safeList('angelcare360_operator_tenants', '*', [], ['updated_at', { ascending: false }])
  return rows as Angelcare360OperatorTenantRecord[]
}

export async function createOrLinkOperatorTenant(input: unknown) {
  const parsed = operatorTenantCreateOrLinkSchema.safeParse(input)
  if (!parsed.success) return { ok: false, error: parsed.errors[0]?.message || 'Le tenant est invalide.' }
  const session = await requireAngelcare360OperatorPermission('operator.tenants.update')
  const supabase = await getOperatorClient()
  const payload = {
    client_id: parsed.data.clientId,
    school_id: parsed.data.schoolId || null,
    tenant_slug: parsed.data.tenantSlug,
    environment: parsed.data.environment,
    status: parsed.data.status,
    provisioning_status: parsed.data.provisioningStatus || 'pending',
    command_center_url: parsed.data.commandCenterUrl || null,
    go_live_date: parsed.data.goLiveDate || null,
    updated_at: new Date().toISOString(),
  }

  const { data: before } = await supabase.from('angelcare360_operator_tenants').select('*').eq('tenant_slug', parsed.data.tenantSlug).maybeSingle()
  const { data, error } = await supabase.from('angelcare360_operator_tenants').upsert(payload, { onConflict: 'tenant_slug' }).select('*').single()
  if (error) return { ok: false, error: error.message }
  await writeOperatorAuditLog({
    module: 'tenants',
    action: before ? 'tenant.updated' : 'tenant.created',
    entityType: 'angelcare360_operator_tenants',
    entityId: String(data.id),
    clientId: parsed.data.clientId,
    tenantId: String(data.id),
    severity: 'notice',
    beforeData: toRecord(before),
    afterData: payload,
    metadata: { operator_role: session.operatorRole },
  })
  return { ok: true, record: data as Angelcare360OperatorTenantRecord }
}

export async function updateOperatorTenantStatus(input: unknown) {
  const parsed = operatorTenantUpdateStatusSchema.safeParse(input)
  if (!parsed.success) return { ok: false, error: parsed.errors[0]?.message || 'Le tenant est invalide.' }
  const session = await requireAngelcare360OperatorPermission('operator.tenants.update')
  const supabase = await getOperatorClient()
  const { data: before } = await supabase.from('angelcare360_operator_tenants').select('*').eq('id', parsed.data.id).maybeSingle()
  const payload = {
    status: parsed.data.status,
    provisioning_status: parsed.data.provisioningStatus || (before as Record<string, unknown> | null)?.provisioning_status || 'pending',
    command_center_url: parsed.data.commandCenterUrl || (before as Record<string, unknown> | null)?.command_center_url || null,
    updated_at: new Date().toISOString(),
  }
  const { data, error } = await supabase.from('angelcare360_operator_tenants').update(payload).eq('id', parsed.data.id).select('*').single()
  if (error) return { ok: false, error: error.message }
  await writeOperatorAuditLog({
    module: 'tenants',
    action: 'tenant.status_changed',
    entityType: 'angelcare360_operator_tenants',
    entityId: String(data.id),
    clientId: String((data as Record<string, unknown>).client_id),
    tenantId: String(data.id),
    severity: 'notice',
    beforeData: toRecord(before),
    afterData: payload,
    metadata: { operator_role: session.operatorRole },
  })
  return { ok: true, record: data as Angelcare360OperatorTenantRecord }
}

export async function getOperatorTenantAccessSummary() {
  const rows = await listOperatorTenants()
  return rows.map((tenant) => ({
    ...tenant,
    access_label: tenant.status === 'active' ? 'Actif' : tenant.status === 'provisioning' ? 'En cours de mise en service' : 'Verrouillé',
  }))
}

