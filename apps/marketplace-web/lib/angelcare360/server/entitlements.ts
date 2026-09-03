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

const LEGACY_DEMO_SWITCH = 'SANILA_ALLOW_DEV_LEGACY_ENTITLEMENTS'
const ACCESS_UNAVAILABLE = 'La vérification de votre accès est temporairement indisponible. Réessayez dans quelques instants.'

function legacyDemoAccessAllowed() {
  if (!['development', 'test'].includes(String(process.env.NODE_ENV))) return false
  return ['1', 'true', 'yes', 'enabled'].includes(String(process.env[LEGACY_DEMO_SWITCH] || '').trim().toLowerCase())
}

function closedState(
  state: Angelcare360RuntimeEntitlements['state'],
  warning: string,
  details: Partial<Angelcare360RuntimeEntitlements> = {},
): Angelcare360RuntimeEntitlements {
  return {
    ...EMPTY,
    ...details,
    state,
    enforced: !legacyDemoAccessAllowed(),
    warning,
  }
}

type Row = Record<string, unknown>
function str(value: unknown) { return typeof value === 'string' ? value : value == null ? null : String(value) }
function num(value: unknown) { const parsed = Number(value); return Number.isFinite(parsed) ? parsed : null }
function row(value: unknown): Row { return value && typeof value === 'object' && !Array.isArray(value) ? value as Row : {} }
function publicRestrictionReason(type: string, state: string) {
  const normalized = state.toLowerCase()
  if (/config|provision|pending/.test(normalized)) return 'Une configuration doit être finalisée avant d’utiliser cette capacité.'
  if (/suspend|locked|cancel|expired|archived/.test(normalized)) return 'Cette capacité est temporairement indisponible pour votre établissement.'
  if (/provider|dependency/.test(normalized)) return 'Un service associé doit être configuré avant d’utiliser cette capacité.'
  if (/capacity|limit|quota/.test(normalized)) return 'La capacité prévue par votre offre est atteinte.'
  return type === 'module' ? 'Ce module n’est pas inclus ou actif dans votre offre.' : 'Cette capacité n’est pas incluse ou active dans votre offre.'
}
function restrictionRows(items: Row[], type: string) {
  const enabledStates = new Set(['enabled', 'active'])
  return {
    enabled: items.filter((item) => item.item_type === type && enabledStates.has(String(item.effective_state))).map((item) => String(item.item_key)),
    restricted: items.filter((item) => item.item_type === type && !enabledStates.has(String(item.effective_state))).map((item) => ({ key: String(item.item_key), state: String(item.effective_state), reason: publicRestrictionReason(type, String(item.effective_state)) })),
  }
}

export async function loadAngelcare360RuntimeEntitlements(input: { userId: string; schoolId: string | null }): Promise<Angelcare360RuntimeEntitlements> {
  if (!input.schoolId) return closedState('legacy_unconfigured', 'Aucun établissement actif n’est associé à cette session.')
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
    if (tenantError) return closedState('unavailable', ACCESS_UNAVAILABLE, { schoolId: input.schoolId })
    if (!tenant) return closedState('legacy_unconfigured', 'L’accès aux modules doit être activé par AngelCare.', { schoolId: input.schoolId })

    const tenantRow = tenant as Row
    const tenantId = str(tenantRow.id)
    const tenantDetails = { schoolId: input.schoolId, tenantId, tenantSlug: str(tenantRow.tenant_slug), tenantStatus: str(tenantRow.status) }
    const { data: demoConfig } = await supabase.from('sanila_demo_configs').select('id,billing_mode,safety_status,seed_version').eq('school_id', input.schoolId).eq('classification', 'master_demo').eq('active', true).maybeSingle()
    if (demoConfig?.billing_mode === 'non_billable' && demoConfig.safety_status === 'enforced') {
      const modules = [...new Set(ANGELCARE360_PRODUCT_REALITY_OPERATIONS.map((item) => item.moduleKey).filter(Boolean))] as string[]
      const capabilities = [...new Set(ANGELCARE360_PRODUCT_REALITY_OPERATIONS.map((item) => item.capabilityKey).filter(Boolean))] as string[]
      return { ...EMPTY, ...tenantDetails, state: 'active', enforced: true, enabledModules: modules, enabledCapabilities: capabilities, enabledOperations: ANGELCARE360_PRODUCT_REALITY_OPERATIONS.map((item) => item.operationKey), warning: null }
    }
    if (String(tenantRow.status) !== 'active') {
      const suspended = ['suspended', 'archived', 'cancelled'].includes(String(tenantRow.status))
      return closedState(suspended ? 'suspended' : 'partial', suspended ? 'L’accès de votre établissement est temporairement suspendu.' : 'La mise en service de votre établissement doit être finalisée.', tenantDetails)
    }
    const { data: subscription, error: subscriptionError } = await supabase
      .from('angelcare360_operator_subscriptions')
      .select('id, status, package_version_id, updated_at')
      .eq('tenant_id', tenantId)
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle()
    if (subscriptionError) return closedState('unavailable', ACCESS_UNAVAILABLE, tenantDetails)
    if (!subscription) return closedState('legacy_unconfigured', 'Aucun abonnement actif n’est associé à votre établissement.', tenantDetails)

    const subscriptionRow = row(subscription)
    const subscriptionDetails = { ...tenantDetails, subscriptionId: str(subscriptionRow.id), subscriptionStatus: str(subscriptionRow.status) }
    const subscriptionStatus = String(subscriptionRow.status)
    if (!['trial', 'active', 'past_due'].includes(subscriptionStatus)) {
      return closedState('suspended', 'Votre abonnement ne permet pas actuellement d’accéder aux modules SANILA.', subscriptionDetails)
    }
    const packageVersionId = str(subscriptionRow.package_version_id)
    if (!packageVersionId) return closedState('partial', 'Votre offre doit être finalisée avant l’activation des modules.', subscriptionDetails)
    const [{ data: packageVersion, error: packageVersionError }, { data: snapshot, error: snapshotError }] = await Promise.all([
      packageVersionId ? supabase.from('angelcare360_operator_package_versions').select('id, version_code, name, status').eq('id', packageVersionId).maybeSingle() : Promise.resolve({ data: null, error: null }),
      supabase.from('angelcare360_operator_tenant_entitlement_snapshots').select('id, subscription_id, package_version_id, snapshot_version, status, compiled_at').eq('tenant_id', tenantId).eq('subscription_id', String(subscriptionRow.id)).eq('package_version_id', packageVersionId).eq('status', 'active').order('snapshot_version', { ascending: false }).limit(1).maybeSingle(),
    ])
    const packageDetails = { ...subscriptionDetails, packageVersionId, packageVersionName: str(row(packageVersion).name), packageVersionCode: str(row(packageVersion).version_code) }
    if (packageVersionError) return closedState('unavailable', ACCESS_UNAVAILABLE, packageDetails)
    if (!packageVersion || String(row(packageVersion).status) !== 'published') return closedState('partial', 'Votre offre doit être publiée avant l’activation des modules.', packageDetails)
    if (snapshotError) return closedState('unavailable', ACCESS_UNAVAILABLE, packageDetails)
    if (!snapshot) return closedState('partial', 'L’activation de votre offre est en cours. Réessayez dans quelques instants.', packageDetails)

    const snapshotRow = snapshot as Row
    const snapshotId = str(snapshotRow.id)
    const [{ data: items, error: itemError }, { data: operationGates, error: operationGateError }, { data: provisioningRows, error: provisioningError }, { data: consumptionRows, error: consumptionError }] = await Promise.all([
      supabase.from('angelcare360_operator_tenant_entitlement_items').select('item_type, item_key, item_label, effective_state, quantity, unit, origin, reason').eq('snapshot_id', snapshotId),
      supabase.from('angelcare360_product_runtime_operation_gates').select('operation_key,state,reason,effective_from,effective_to').eq('school_id', input.schoolId).eq('status', 'active'),
      supabase.from('angelcare360_product_reality_provisioning_events').select('item_type,item_key,state,verified_at,reason').eq('school_id', input.schoolId).order('created_at', { ascending: false }),
      supabase.from('angelcare360_product_meter_consumption').select('meter_key,current_value,reserved_value,allowed_value,unit,status,source_entity_type').eq('school_id', input.schoolId),
    ])
    if (itemError || operationGateError || provisioningError || consumptionError) return closedState('unavailable', ACCESS_UNAVAILABLE, { ...packageDetails, snapshotId, snapshotVersion: num(snapshotRow.snapshot_version), compiledAt: str(snapshotRow.compiled_at) })

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
      if (!['enabled', 'active'].includes(String(gate.state))) operationRestrictions.set(String(gate.operation_key), { key: String(gate.operation_key), state: String(gate.state), reason: publicRestrictionReason('operation', String(gate.state)) })
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
    const provisioning = [...provisioningMap.values()].map((item) => ({ itemType: String(item.item_type), itemKey: String(item.item_key), state: String(item.state), lastVerifiedAt: str(item.verified_at), reason: ['verified', 'active', 'enabled'].includes(String(item.state)) ? null : publicRestrictionReason(String(item.item_type), String(item.state)) }))

    return {
      state: 'active',
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
      enabledModules: [...new Set(modules.enabled)],
      restrictedModules: modules.restricted,
      enabledCapabilities: [...new Set(capabilities.enabled)],
      restrictedCapabilities: capabilities.restricted,
      enabledFeatures: [...new Set(features.enabled)],
      restrictedFeatures: features.restricted,
      enabledServices: [...new Set(services.enabled)],
      restrictedServices: services.restricted,
      enabledOperations,
      restrictedOperations: [...operationRestrictions.values()],
      limits,
      provisioning,
      warning: null,
    }
  } catch {
    return closedState('unavailable', ACCESS_UNAVAILABLE, { schoolId: input.schoolId })
  }
}
