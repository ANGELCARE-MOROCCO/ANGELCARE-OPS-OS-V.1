export type Angelcare360EntitlementDiagnosticCode =
  | 'AUTHORITY_UNAVAILABLE'
  | 'TENANT_NOT_RESOLVED'
  | 'TENANT_INACTIVE'
  | 'SUBSCRIPTION_MISSING'
  | 'SUBSCRIPTION_INACTIVE'
  | 'PACKAGE_VERSION_MISSING'
  | 'PACKAGE_VERSION_INACTIVE'
  | 'SNAPSHOT_MISSING'
  | 'SNAPSHOT_INACTIVE'
  | 'ENTITLEMENT_KEY_UNKNOWN'
  | 'ENTITLEMENT_RESTRICTED'
  | 'DEMO_CONTEXT_MISMATCH'
  | 'CONTEXT_MISMATCH'

type Row = Record<string, unknown>

export type Angelcare360EntitlementChain = {
  schoolId: string
  tenant: Row | null
  subscription: Row | null
  packageVersion: Row | null
  snapshot: Row | null
}

export function validateAngelcare360EntitlementChain(input: Angelcare360EntitlementChain): { ok: true } | { ok: false; code: Angelcare360EntitlementDiagnosticCode } {
  if (!input.tenant) return { ok: false, code: 'TENANT_NOT_RESOLVED' }
  if (String(input.tenant.school_id || '') !== input.schoolId) return { ok: false, code: 'CONTEXT_MISMATCH' }
  if (String(input.tenant.status || '') !== 'active') return { ok: false, code: 'TENANT_INACTIVE' }
  if (!input.subscription) return { ok: false, code: 'SUBSCRIPTION_MISSING' }
  if (String(input.subscription.tenant_id || '') !== String(input.tenant.id || '')) return { ok: false, code: 'CONTEXT_MISMATCH' }
  if (!['trial', 'active', 'past_due'].includes(String(input.subscription.status || ''))) return { ok: false, code: 'SUBSCRIPTION_INACTIVE' }
  if (!input.packageVersion) return { ok: false, code: 'PACKAGE_VERSION_MISSING' }
  if (String(input.subscription.package_version_id || '') !== String(input.packageVersion.id || '')) return { ok: false, code: 'CONTEXT_MISMATCH' }
  if (String(input.packageVersion.status || '') !== 'published') return { ok: false, code: 'PACKAGE_VERSION_INACTIVE' }
  if (!input.snapshot) return { ok: false, code: 'SNAPSHOT_MISSING' }
  if (
    String(input.snapshot.tenant_id || '') !== String(input.tenant.id || '')
    || String(input.snapshot.subscription_id || '') !== String(input.subscription.id || '')
    || String(input.snapshot.package_version_id || '') !== String(input.packageVersion.id || '')
  ) return { ok: false, code: 'CONTEXT_MISMATCH' }
  if (String(input.snapshot.status || '') !== 'active') return { ok: false, code: 'SNAPSHOT_INACTIVE' }
  return { ok: true }
}

const ENABLED_STATES = new Set(['enabled', 'active'])
const ITEM_TYPES = ['module', 'capability', 'feature', 'service', 'operation'] as const

export function normalizeAngelcare360SnapshotItems(
  items: Row[],
  restrictionReason: (type: string, state: string) => string = (type, state) => `${type}:${state}`,
) {
  const result = Object.fromEntries(ITEM_TYPES.map((type) => {
    const rows = items.filter((item) => String(item.item_type) === type)
    return [type, {
      enabled: [...new Set(rows.filter((item) => ENABLED_STATES.has(String(item.effective_state))).map((item) => String(item.item_key)))],
      restricted: rows.filter((item) => !ENABLED_STATES.has(String(item.effective_state))).map((item) => ({ key: String(item.item_key), state: String(item.effective_state), reason: restrictionReason(type, String(item.effective_state)) })),
    }]
  })) as Record<(typeof ITEM_TYPES)[number], { enabled: string[]; restricted: Array<{ key: string; state: string; reason: string }> }>
  return { ...result, meters: items.filter((item) => String(item.item_type) === 'meter') }
}

export function decideAngelcare360EntitlementKey(
  key: string,
  enabled: string[],
  restricted: Array<{ key: string; state: string }>,
): { allowed: true; code: null } | { allowed: false; code: 'ENTITLEMENT_KEY_UNKNOWN' | 'ENTITLEMENT_RESTRICTED' } {
  if (restricted.some((item) => item.key === key && !ENABLED_STATES.has(item.state))) return { allowed: false, code: 'ENTITLEMENT_RESTRICTED' }
  if (enabled.includes(key)) return { allowed: true, code: null }
  return { allowed: false, code: 'ENTITLEMENT_KEY_UNKNOWN' }
}
