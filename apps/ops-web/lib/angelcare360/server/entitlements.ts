import { createServiceClient } from '@/lib/supabase/server'
import type { Angelcare360RuntimeEntitlements } from '@/types/angelcare360/entitlements'
import { ANGELCARE360_PRODUCT_REALITY_OPERATIONS } from '@/data/angelcare360/product-reality'

const EMPTY: Angelcare360RuntimeEntitlements = {
  state: 'legacy_unconfigured',
  enforced: false,
  schoolId: null,
  tenantId: null,
  tenantSlug: null,
  tenantStatus: null,
  subscriptionId: null,
  subscriptionStatus: null,
  packageVersionId: null,
  packageVersionName: null,
  packageVersionCode: null,
  snapshotId: null,
  snapshotVersion: null,
  compiledAt: null,
  enabledModules: [],
  restrictedModules: [],
  enabledCapabilities: [],
  restrictedCapabilities: [],
  enabledFeatures: [],
  restrictedFeatures: [],
  enabledServices: [],
  restrictedServices: [],
  enabledOperations: [],
  restrictedOperations: [],
  limits: [],
  provisioning: [],
  warning: null,
}

type Row = Record<string, unknown>
function str(value: unknown) { return typeof value === 'string' ? value : value == null ? null : String(value) }
function num(value: unknown) { const parsed = Number(value); return Number.isFinite(parsed) ? parsed : null }
function row(value: unknown): Row { return value && typeof value === 'object' && !Array.isArray(value) ? value as Row : {} }
function restrictionRows(items: Row[], type: string) {
  const enabledStates = new Set(['enabled', 'active'])
  return {
    enabled: items.filter((item) => item.item_type === type && enabledStates.has(String(item.effective_state))).map((item) => String(item.item_key)),
    restricted: items.filter((item) => item.item_type === type && !enabledStates.has(String(item.effective_state))).map((item) => ({ key: String(item.item_key), state: String(item.effective_state), reason: str(item.reason) })),
  }
}

export async function loadAngelcare360RuntimeEntitlements(input: { userId: string; schoolId: string | null }): Promise<Angelcare360RuntimeEntitlements> {
  if (!input.schoolId) return { ...EMPTY, warning: 'Aucun établissement actif n’est résolu pour cette session.' }
  const supabase = await createServiceClient()
  try {
    const { data: tenant, error: tenantError } = await supabase
      .from('angelcare360_operator_tenants')
      .select('id, client_id, school_id, tenant_slug, status')
      .eq('school_id', input.schoolId)
      .neq('status', 'archived')
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle()
    if (tenantError) return { ...EMPTY, state: 'unavailable', schoolId: input.schoolId, warning: tenantError.message }
    if (!tenant) return { ...EMPTY, schoolId: input.schoolId, warning: 'Cet établissement fonctionne encore en mode catalogue historique; aucun tenant Operator n’est lié.' }

    const tenantRow = tenant as Row
    const tenantId = str(tenantRow.id)
    const { data: subscription, error: subscriptionError } = await supabase
      .from('angelcare360_operator_subscriptions')
      .select('id, status, package_version_id, updated_at')
      .eq('tenant_id', tenantId)
      .in('status', ['trial', 'active', 'past_due', 'suspended'])
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle()
    if (subscriptionError) return { ...EMPTY, state: 'unavailable', schoolId: input.schoolId, tenantId, tenantSlug: str(tenantRow.tenant_slug), tenantStatus: str(tenantRow.status), warning: subscriptionError.message }

    const subscriptionRow = row(subscription)
    const packageVersionId = str(subscriptionRow.package_version_id)
    const [{ data: packageVersion }, { data: snapshot, error: snapshotError }] = await Promise.all([
      packageVersionId ? supabase.from('angelcare360_operator_package_versions').select('id, version_code, name, status').eq('id', packageVersionId).maybeSingle() : Promise.resolve({ data: null }),
      supabase.from('angelcare360_operator_tenant_entitlement_snapshots').select('id, subscription_id, package_version_id, snapshot_version, status, compiled_at').eq('tenant_id', tenantId).eq('status', 'active').order('snapshot_version', { ascending: false }).limit(1).maybeSingle(),
    ])
    if (snapshotError) return { ...EMPTY, state: 'unavailable', schoolId: input.schoolId, tenantId, tenantSlug: str(tenantRow.tenant_slug), tenantStatus: str(tenantRow.status), subscriptionId: str(subscriptionRow.id), subscriptionStatus: str(subscriptionRow.status), packageVersionId, packageVersionName: str(row(packageVersion).name), packageVersionCode: str(row(packageVersion).version_code), warning: snapshotError.message }
    if (!snapshot) return { ...EMPTY, schoolId: input.schoolId, tenantId, tenantSlug: str(tenantRow.tenant_slug), tenantStatus: str(tenantRow.status), subscriptionId: str(subscriptionRow.id), subscriptionStatus: str(subscriptionRow.status), packageVersionId, packageVersionName: str(row(packageVersion).name), packageVersionCode: str(row(packageVersion).version_code), warning: packageVersionId ? 'Le package est affecté mais les entitlements tenant ne sont pas encore compilés.' : 'Aucun package versionné n’est encore affecté à cet abonnement.' }

    const snapshotRow = snapshot as Row
    const snapshotId = str(snapshotRow.id)
    const [{ data: items, error: itemError }, { data: operationGates }, { data: provisioningRows }, { data: consumptionRows }] = await Promise.all([
      supabase.from('angelcare360_operator_tenant_entitlement_items').select('item_type, item_key, item_label, effective_state, quantity, unit, origin, reason').eq('snapshot_id', snapshotId),
      supabase.from('angelcare360_product_runtime_operation_gates').select('operation_key,state,reason,effective_from,effective_to').eq('school_id', input.schoolId).eq('status', 'active'),
      supabase.from('angelcare360_product_reality_provisioning_events').select('item_type,item_key,state,verified_at,reason').eq('school_id', input.schoolId).order('created_at', { ascending: false }),
      supabase.from('angelcare360_product_meter_consumption').select('meter_key,current_value,reserved_value,allowed_value,unit,status,source_entity_type').eq('school_id', input.schoolId),
    ])
    if (itemError) return { ...EMPTY, state: 'partial', enforced: false, schoolId: input.schoolId, tenantId, tenantSlug: str(tenantRow.tenant_slug), tenantStatus: str(tenantRow.status), subscriptionId: str(subscriptionRow.id), subscriptionStatus: str(subscriptionRow.status), packageVersionId: str(snapshotRow.package_version_id) || packageVersionId, packageVersionName: str(row(packageVersion).name), packageVersionCode: str(row(packageVersion).version_code), snapshotId, snapshotVersion: num(snapshotRow.snapshot_version), compiledAt: str(snapshotRow.compiled_at), warning: itemError.message }

    const itemRows = (items || []) as Row[]
    const modules = restrictionRows(itemRows, 'module')
    const capabilities = restrictionRows(itemRows, 'capability')
    const features = restrictionRows(itemRows, 'feature')
    const services = restrictionRows(itemRows, 'service')
    const operationRestrictions = new Map<string, { key: string; state: string; reason?: string | null }>()
    const timestamp = Date.now()
    for (const gate of (operationGates || []) as Row[]) {
      const from = str(gate.effective_from)
      const to = str(gate.effective_to)
      if ((from && Date.parse(from) > timestamp) || (to && Date.parse(to) < timestamp)) continue
      if (!['enabled', 'active'].includes(String(gate.state))) operationRestrictions.set(String(gate.operation_key), { key: String(gate.operation_key), state: String(gate.state), reason: str(gate.reason) })
    }
    const enabledOperations = ANGELCARE360_PRODUCT_REALITY_OPERATIONS.filter((definition) => {
      if (operationRestrictions.has(definition.operationKey)) return false
      if (definition.moduleKey && !modules.enabled.includes(definition.moduleKey)) return false
      if (definition.capabilityKey && capabilities.enabled.length && !capabilities.enabled.includes(definition.capabilityKey)) return false
      if (definition.featureKey && features.enabled.length && !features.enabled.includes(definition.featureKey)) return false
      return true
    }).map((definition) => definition.operationKey)
    const consumptionMap = new Map<string, Row>(((consumptionRows || []) as Row[]).map((item) => [String(item.meter_key), item]))
    const limits = itemRows.filter((item) => item.item_type === 'meter').map((item) => {
      const usage = consumptionMap.get(String(item.item_key))
      const allowed = num(item.quantity)
      const current = num(usage?.current_value)
      const state = String(usage?.status || (allowed !== null && current !== null && current >= allowed ? 'reached' : allowed !== null && current !== null && current >= allowed * 0.8 ? 'warning' : 'available')) as Angelcare360RuntimeEntitlements['limits'][number]['state']
      return { key: String(item.item_key), label: String(item.item_label), allowed, current, reserved: num(usage?.reserved_value), unit: str(item.unit || usage?.unit), state, source: str(usage?.source_entity_type || item.origin) }
    })
    const provisioningMap = new Map<string, Row>()
    for (const item of (provisioningRows || []) as Row[]) {
      const key = `${String(item.item_type)}:${String(item.item_key)}`
      if (!provisioningMap.has(key)) provisioningMap.set(key, item)
    }
    const provisioning = [...provisioningMap.values()].map((item) => ({ itemType: String(item.item_type), itemKey: String(item.item_key), state: String(item.state), lastVerifiedAt: str(item.verified_at), reason: str(item.reason) }))

    const suspended = String(tenantRow.status) === 'suspended' || String(subscriptionRow.status) === 'suspended'
    return {
      state: suspended ? 'suspended' : 'active',
      enforced: true,
      schoolId: input.schoolId,
      tenantId,
      tenantSlug: str(tenantRow.tenant_slug),
      tenantStatus: str(tenantRow.status),
      subscriptionId: str(subscriptionRow.id),
      subscriptionStatus: str(subscriptionRow.status),
      packageVersionId: str(snapshotRow.package_version_id) || packageVersionId,
      packageVersionName: str(row(packageVersion).name),
      packageVersionCode: str(row(packageVersion).version_code),
      snapshotId,
      snapshotVersion: num(snapshotRow.snapshot_version),
      compiledAt: str(snapshotRow.compiled_at),
      enabledModules: suspended ? [] : [...new Set(modules.enabled)],
      restrictedModules: modules.restricted,
      enabledCapabilities: suspended ? [] : [...new Set(capabilities.enabled)],
      restrictedCapabilities: capabilities.restricted,
      enabledFeatures: suspended ? [] : [...new Set(features.enabled)],
      restrictedFeatures: features.restricted,
      enabledServices: suspended ? [] : [...new Set(services.enabled)],
      restrictedServices: services.restricted,
      enabledOperations: suspended ? [] : enabledOperations,
      restrictedOperations: [...operationRestrictions.values()],
      limits,
      provisioning,
      warning: suspended ? 'Le tenant ou l’abonnement est suspendu; les modules sont verrouillés.' : null,
    }
  } catch (error) {
    return { ...EMPTY, state: 'unavailable', schoolId: input.schoolId, warning: error instanceof Error ? error.message : 'Entitlements indisponibles.' }
  }
}
