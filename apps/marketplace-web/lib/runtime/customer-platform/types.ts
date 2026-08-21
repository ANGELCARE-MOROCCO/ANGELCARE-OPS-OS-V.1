export const CUSTOMER_PLATFORM_WORKLOAD_CLASSES = [
  'critical',
  'interactive',
  'public',
  'mutation',
  'provider',
  'heavy',
  'ai',
  'background',
] as const

export type CustomerPlatformWorkloadClass =
  (typeof CUSTOMER_PLATFORM_WORKLOAD_CLASSES)[number]

export type CustomerPlatformClassConfig = {
  limit: number
  tenantLimit: number
  maxWaitMs: number
  leaseTtlMs: number
  failClosedWhenRedisConfigured: boolean
  burstCapacity: number
  burstRefillPerSecond: number
}

export type CustomerPlatformConfig = {
  enabled: boolean
  maxJsonBodyBytes: number
  containerMemoryMb: number
  classes: Record<CustomerPlatformWorkloadClass, CustomerPlatformClassConfig>
}

export type CustomerPlatformPermit = {
  source: 'redis' | 'local'
  waitedMs: number
  renew: () => Promise<boolean>
  release: () => Promise<boolean>
}

export type CustomerPlatformAcquireResult =
  | { status: 'acquired'; permit: CustomerPlatformPermit }
  | { status: 'busy'; retryAfterMs: number; waitedMs: number }
  | { status: 'unavailable'; waitedMs: number }
