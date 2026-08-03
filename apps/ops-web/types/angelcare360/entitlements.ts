export type Angelcare360RuntimeEntitlementState =
  | 'legacy_unconfigured'
  | 'active'
  | 'partial'
  | 'suspended'
  | 'unavailable'

export type Angelcare360RuntimeRestriction = {
  key: string
  state: string
  reason?: string | null
}

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
  restrictedModules: Angelcare360RuntimeRestriction[]
  enabledCapabilities: string[]
  restrictedCapabilities: Angelcare360RuntimeRestriction[]
  enabledFeatures: string[]
  restrictedFeatures: Angelcare360RuntimeRestriction[]
  enabledServices: string[]
  restrictedServices: Angelcare360RuntimeRestriction[]
  enabledOperations: string[]
  restrictedOperations: Angelcare360RuntimeRestriction[]
  limits: Array<{
    key: string
    label: string
    allowed: number | null
    current: number | null
    reserved: number | null
    unit: string | null
    state: 'available' | 'warning' | 'reached' | 'paused' | 'unknown'
    source: string | null
  }>
  provisioning: Array<{
    itemType: string
    itemKey: string
    state: string
    lastVerifiedAt: string | null
    reason: string | null
  }>
  warning: string | null
}
