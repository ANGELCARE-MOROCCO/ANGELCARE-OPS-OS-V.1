export type Angelcare360RuntimeEntitlementState =
  | 'legacy_unconfigured'
  | 'active'
  | 'partial'
  | 'suspended'
  | 'unavailable'

export interface Angelcare360RuntimeEntitlements {
  state: Angelcare360RuntimeEntitlementState
  enforced: boolean
  schoolId: string | null
  tenantId: string | null
  tenantSlug: string | null
  tenantStatus: string | null
  subscriptionId: string | null
  subscriptionStatus: string | null
  packageVersionId: string | null
  packageVersionName: string | null
  packageVersionCode: string | null
  snapshotId: string | null
  snapshotVersion: number | null
  compiledAt: string | null
  enabledModules: string[]
  restrictedModules: Array<{ key: string; state: string; reason?: string | null }>
  enabledFeatures: string[]
  restrictedFeatures: Array<{ key: string; state: string; reason?: string | null }>
  limits: Array<{ key: string; label: string; allowed: number | null; unit: string | null }>
  warning: string | null
}
