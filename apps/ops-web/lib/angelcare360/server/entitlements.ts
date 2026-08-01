import { createClient } from '@/lib/supabase/server'
import type { Angelcare360RuntimeEntitlements } from '@/types/angelcare360/entitlements'

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
  enabledFeatures: [],
  restrictedFeatures: [],
  limits: [],
  warning: null,
}

type Row = Record<string, unknown>
function str(value: unknown) { return typeof value === 'string' ? value : value == null ? null : String(value) }
function num(value: unknown) { const parsed = Number(value); return Number.isFinite(parsed) ? parsed : null }

export async function loadAngelcare360RuntimeEntitlements(input: {
  userId: string
  schoolId: string | null
}): Promise<Angelcare360RuntimeEntitlements> {
  if (!input.schoolId) return { ...EMPTY, warning: 'Aucun établissement actif n’est résolu pour cette session.' }

  const supabase = await createClient()
  try {
    const { data: tenant, error: tenantError } = await supabase
      .from('angelcare360_operator_tenants')
      .select('id, client_id, school_id, tenant_slug, status')
      .eq('school_id', input.schoolId)
      .neq('status', 'archived')
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (tenantError) {
      return { ...EMPTY, state: 'unavailable', schoolId: input.schoolId, warning: tenantError.message }
    }
    if (!tenant) {
      return { ...EMPTY, schoolId: input.schoolId, warning: 'Cet établissement fonctionne encore en mode catalogue historique; aucun tenant Operator n’est lié.' }
    }

    const tenantRow = tenant as Row
    const tenantId = str(tenantRow.id)
    const clientId = str(tenantRow.client_id)

    const { data: subscription, error: subscriptionError } = await supabase
      .from('angelcare360_operator_subscriptions')
      .select('id, status, package_version_id, updated_at')
      .eq('tenant_id', tenantId)
      .in('status', ['trial', 'active', 'past_due', 'suspended'])
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (subscriptionError) {
      return {
        ...EMPTY,
        state: 'unavailable',
        schoolId: input.schoolId,
        tenantId,
        tenantSlug: str(tenantRow.tenant_slug),
        tenantStatus: str(tenantRow.status),
        warning: subscriptionError.message,
      }
    }

    const subscriptionRow = (subscription || {}) as Row
    const packageVersionId = str(subscriptionRow.package_version_id)

    const [{ data: packageVersion }, { data: snapshot, error: snapshotError }] = await Promise.all([
      packageVersionId
        ? supabase.from('angelcare360_operator_package_versions').select('id, version_code, name, status').eq('id', packageVersionId).maybeSingle()
        : Promise.resolve({ data: null }),
      supabase
        .from('angelcare360_operator_tenant_entitlement_snapshots')
        .select('id, subscription_id, package_version_id, snapshot_version, status, compiled_at')
        .eq('tenant_id', tenantId)
        .eq('status', 'active')
        .order('snapshot_version', { ascending: false })
        .limit(1)
        .maybeSingle(),
    ])

    if (snapshotError) {
      return {
        ...EMPTY,
        state: 'unavailable',
        schoolId: input.schoolId,
        tenantId,
        tenantSlug: str(tenantRow.tenant_slug),
        tenantStatus: str(tenantRow.status),
        subscriptionId: str(subscriptionRow.id),
        subscriptionStatus: str(subscriptionRow.status),
        packageVersionId,
        packageVersionName: str((packageVersion as Row | null)?.name),
        packageVersionCode: str((packageVersion as Row | null)?.version_code),
        warning: snapshotError.message,
      }
    }

    if (!snapshot) {
      return {
        ...EMPTY,
        schoolId: input.schoolId,
        tenantId,
        tenantSlug: str(tenantRow.tenant_slug),
        tenantStatus: str(tenantRow.status),
        subscriptionId: str(subscriptionRow.id),
        subscriptionStatus: str(subscriptionRow.status),
        packageVersionId,
        packageVersionName: str((packageVersion as Row | null)?.name),
        packageVersionCode: str((packageVersion as Row | null)?.version_code),
        warning: packageVersionId
          ? 'Le package est affecté mais les entitlements tenant ne sont pas encore compilés.'
          : 'Aucun package versionné n’est encore affecté à cet abonnement.',
      }
    }

    const snapshotRow = snapshot as Row
    const snapshotId = str(snapshotRow.id)
    const { data: items, error: itemError } = await supabase
      .from('angelcare360_operator_tenant_entitlement_items')
      .select('item_type, item_key, item_label, effective_state, quantity, unit, origin, reason')
      .eq('snapshot_id', snapshotId)

    if (itemError) {
      return {
        ...EMPTY,
        state: 'partial',
        enforced: false,
        schoolId: input.schoolId,
        tenantId,
        tenantSlug: str(tenantRow.tenant_slug),
        tenantStatus: str(tenantRow.status),
        subscriptionId: str(subscriptionRow.id),
        subscriptionStatus: str(subscriptionRow.status),
        packageVersionId: str(snapshotRow.package_version_id) || packageVersionId,
        packageVersionName: str((packageVersion as Row | null)?.name),
        packageVersionCode: str((packageVersion as Row | null)?.version_code),
        snapshotId,
        snapshotVersion: num(snapshotRow.snapshot_version),
        compiledAt: str(snapshotRow.compiled_at),
        warning: itemError.message,
      }
    }

    const itemRows = ((items || []) as Row[])
    const enabledStates = new Set(['enabled', 'active'])
    const enabledModules = itemRows
      .filter((row) => row.item_type === 'module' && enabledStates.has(String(row.effective_state)))
      .map((row) => String(row.item_key))
    const restrictedModules = itemRows
      .filter((row) => row.item_type === 'module' && !enabledStates.has(String(row.effective_state)))
      .map((row) => ({ key: String(row.item_key), state: String(row.effective_state), reason: str(row.reason) }))
    const enabledFeatures = itemRows
      .filter((row) => row.item_type === 'feature' && enabledStates.has(String(row.effective_state)))
      .map((row) => String(row.item_key))
    const restrictedFeatures = itemRows
      .filter((row) => row.item_type === 'feature' && !enabledStates.has(String(row.effective_state)))
      .map((row) => ({ key: String(row.item_key), state: String(row.effective_state), reason: str(row.reason) }))
    const limits = itemRows
      .filter((row) => row.item_type === 'meter')
      .map((row) => ({ key: String(row.item_key), label: String(row.item_label), allowed: num(row.quantity), unit: str(row.unit) }))

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
      packageVersionName: str((packageVersion as Row | null)?.name),
      packageVersionCode: str((packageVersion as Row | null)?.version_code),
      snapshotId,
      snapshotVersion: num(snapshotRow.snapshot_version),
      compiledAt: str(snapshotRow.compiled_at),
      enabledModules: suspended ? [] : [...new Set(enabledModules)],
      restrictedModules,
      enabledFeatures: suspended ? [] : [...new Set(enabledFeatures)],
      restrictedFeatures,
      limits,
      warning: suspended ? 'Le tenant ou l’abonnement est suspendu; les modules sont verrouillés.' : null,
    }
  } catch (error) {
    return {
      ...EMPTY,
      state: 'unavailable',
      schoolId: input.schoolId,
      warning: error instanceof Error ? error.message : 'Entitlements indisponibles.',
    }
  }
}
