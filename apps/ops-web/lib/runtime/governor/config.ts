import type {
  AngelCareGovernorClassConfig,
  AngelCareGovernorConfig,
  AngelCareWorkloadClass,
} from '@/lib/runtime/governor/types'

function asBool(
  value: string | undefined,
  fallback: boolean,
) {
  if (value === undefined || value === '') return fallback

  const normalized = value.trim().toLowerCase()

  if (['1', 'true', 'yes', 'on'].includes(normalized)) {
    return true
  }

  if (['0', 'false', 'no', 'off'].includes(normalized)) {
    return false
  }

  return fallback
}

function asInt(
  value: string | undefined,
  fallback: number,
  min: number,
  max: number,
) {
  const parsed = Number(value)

  if (!Number.isFinite(parsed)) return fallback

  return Math.max(
    min,
    Math.min(
      max,
      Math.floor(parsed),
    ),
  )
}

function envName(
  workloadClass: AngelCareWorkloadClass,
  suffix: string,
) {
  return `OPS_GOVERNOR_${workloadClass.toUpperCase()}_${suffix}`
}

const DEFAULTS: Record<
  AngelCareWorkloadClass,
  AngelCareGovernorClassConfig
> = {
  interactive: {
    limit: 24,
    maxWaitMs: 250,
    leaseTtlMs: 60_000,
    failClosedWhenRedisConfigured: false,
  },

  mutation: {
    limit: 8,
    maxWaitMs: 600,
    leaseTtlMs: 90_000,
    failClosedWhenRedisConfigured: false,
  },

  provider: {
    limit: 3,
    maxWaitMs: 1_000,
    leaseTtlMs: 120_000,
    failClosedWhenRedisConfigured: false,
  },

  heavy: {
    limit: 2,
    maxWaitMs: 1_500,
    leaseTtlMs: 180_000,
    failClosedWhenRedisConfigured: true,
  },

  ai: {
    limit: 1,
    maxWaitMs: 2_000,
    leaseTtlMs: 300_000,
    failClosedWhenRedisConfigured: true,
  },

  worker: {
    limit: 1,
    maxWaitMs: 0,
    leaseTtlMs: 300_000,
    failClosedWhenRedisConfigured: true,
  },

  background: {
    limit: 1,
    maxWaitMs: 0,
    leaseTtlMs: 300_000,
    failClosedWhenRedisConfigured: true,
  },
}

function classConfig(
  workloadClass: AngelCareWorkloadClass,
): AngelCareGovernorClassConfig {
  const fallback = DEFAULTS[workloadClass]

  return {
    limit: asInt(
      process.env[
        envName(
          workloadClass,
          'MAX',
        )
      ],
      fallback.limit,
      1,
      256,
    ),

    maxWaitMs: asInt(
      process.env[
        envName(
          workloadClass,
          'WAIT_MS',
        )
      ],
      fallback.maxWaitMs,
      0,
      30_000,
    ),

    leaseTtlMs: asInt(
      process.env[
        envName(
          workloadClass,
          'TTL_MS',
        )
      ],
      fallback.leaseTtlMs,
      5_000,
      900_000,
    ),

    failClosedWhenRedisConfigured:
      asBool(
        process.env[
          envName(
            workloadClass,
            'FAIL_CLOSED',
          )
        ],
        fallback.failClosedWhenRedisConfigured,
      ),
  }
}

export function getAngelCareGovernorConfig(): AngelCareGovernorConfig {
  return {
    enabled: asBool(
      process.env.OPS_GOVERNOR_ENABLED,
      true,
    ),

    burstCapacity: asInt(
      process.env.OPS_GOVERNOR_GLOBAL_BURST_CAPACITY,
      120,
      20,
      2_000,
    ),

    burstRefillPerSecond: asInt(
      process.env.OPS_GOVERNOR_GLOBAL_BURST_REFILL_PER_SEC,
      80,
      10,
      2_000,
    ),

    classes: {
      interactive: classConfig('interactive'),
      mutation: classConfig('mutation'),
      provider: classConfig('provider'),
      heavy: classConfig('heavy'),
      ai: classConfig('ai'),
      worker: classConfig('worker'),
      background: classConfig('background'),
    },
  }
}
