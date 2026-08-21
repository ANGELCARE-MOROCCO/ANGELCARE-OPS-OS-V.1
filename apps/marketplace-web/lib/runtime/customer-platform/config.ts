import type {
  CustomerPlatformClassConfig,
  CustomerPlatformConfig,
  CustomerPlatformWorkloadClass,
} from '@/lib/runtime/customer-platform/types'

function bool(value: string | undefined, fallback: boolean) {
  if (value === undefined || value === '') return fallback
  const normalized = value.trim().toLowerCase()
  if (['1', 'true', 'yes', 'on'].includes(normalized)) return true
  if (['0', 'false', 'no', 'off'].includes(normalized)) return false
  return fallback
}

function int(value: string | undefined, fallback: number, min: number, max: number) {
  const parsed = Number(value)
  if (!Number.isFinite(parsed)) return fallback
  return Math.max(min, Math.min(max, Math.floor(parsed)))
}

const DEFAULTS: Record<CustomerPlatformWorkloadClass, CustomerPlatformClassConfig> = {
  critical: {
    limit: 24,
    tenantLimit: 12,
    maxWaitMs: 500,
    leaseTtlMs: 90_000,
    failClosedWhenRedisConfigured: false,
    burstCapacity: 100,
    burstRefillPerSecond: 60,
  },
  interactive: {
    limit: 20,
    tenantLimit: 8,
    maxWaitMs: 350,
    leaseTtlMs: 60_000,
    failClosedWhenRedisConfigured: false,
    burstCapacity: 100,
    burstRefillPerSecond: 60,
  },
  public: {
    limit: 24,
    tenantLimit: 12,
    maxWaitMs: 200,
    leaseTtlMs: 60_000,
    failClosedWhenRedisConfigured: false,
    burstCapacity: 160,
    burstRefillPerSecond: 100,
  },
  mutation: {
    limit: 10,
    tenantLimit: 4,
    maxWaitMs: 700,
    leaseTtlMs: 120_000,
    failClosedWhenRedisConfigured: false,
    burstCapacity: 60,
    burstRefillPerSecond: 30,
  },
  provider: {
    limit: 4,
    tenantLimit: 2,
    maxWaitMs: 1_000,
    leaseTtlMs: 180_000,
    failClosedWhenRedisConfigured: false,
    burstCapacity: 30,
    burstRefillPerSecond: 12,
  },
  heavy: {
    limit: 2,
    tenantLimit: 1,
    maxWaitMs: 1_500,
    leaseTtlMs: 240_000,
    failClosedWhenRedisConfigured: true,
    burstCapacity: 12,
    burstRefillPerSecond: 3,
  },
  ai: {
    limit: 1,
    tenantLimit: 1,
    maxWaitMs: 2_000,
    leaseTtlMs: 360_000,
    failClosedWhenRedisConfigured: true,
    burstCapacity: 6,
    burstRefillPerSecond: 1,
  },
  background: {
    limit: 1,
    tenantLimit: 1,
    maxWaitMs: 0,
    leaseTtlMs: 360_000,
    failClosedWhenRedisConfigured: true,
    burstCapacity: 6,
    burstRefillPerSecond: 1,
  },
}

function envClassName(workloadClass: CustomerPlatformWorkloadClass, suffix: string) {
  return `CUSTOMER_PLATFORM_${workloadClass.toUpperCase()}_${suffix}`
}

function classConfig(workloadClass: CustomerPlatformWorkloadClass): CustomerPlatformClassConfig {
  const fallback = DEFAULTS[workloadClass]
  return {
    limit: int(process.env[envClassName(workloadClass, 'MAX')], fallback.limit, 1, 256),
    tenantLimit: int(process.env[envClassName(workloadClass, 'TENANT_MAX')], fallback.tenantLimit, 1, 128),
    maxWaitMs: int(process.env[envClassName(workloadClass, 'WAIT_MS')], fallback.maxWaitMs, 0, 30_000),
    leaseTtlMs: int(process.env[envClassName(workloadClass, 'TTL_MS')], fallback.leaseTtlMs, 5_000, 900_000),
    failClosedWhenRedisConfigured: bool(
      process.env[envClassName(workloadClass, 'FAIL_CLOSED')],
      fallback.failClosedWhenRedisConfigured,
    ),
    burstCapacity: int(
      process.env[envClassName(workloadClass, 'BURST_CAPACITY')],
      fallback.burstCapacity,
      2,
      5_000,
    ),
    burstRefillPerSecond: int(
      process.env[envClassName(workloadClass, 'BURST_REFILL_PER_SEC')],
      fallback.burstRefillPerSecond,
      1,
      5_000,
    ),
  }
}

export function getCustomerPlatformConfig(): CustomerPlatformConfig {
  return {
    enabled: bool(process.env.CUSTOMER_PLATFORM_GOVERNOR_ENABLED, true),
    maxJsonBodyBytes: int(process.env.CUSTOMER_PLATFORM_MAX_JSON_BODY_BYTES, 5_242_880, 65_536, 52_428_800),
    containerMemoryMb: int(process.env.CUSTOMER_PLATFORM_CONTAINER_MEMORY_MB, 768, 128, 65_536),
    classes: {
      critical: classConfig('critical'),
      interactive: classConfig('interactive'),
      public: classConfig('public'),
      mutation: classConfig('mutation'),
      provider: classConfig('provider'),
      heavy: classConfig('heavy'),
      ai: classConfig('ai'),
      background: classConfig('background'),
    },
  }
}
