export const ANGELCARE_WORKLOAD_CLASSES = [
  'interactive',
  'mutation',
  'provider',
  'heavy',
  'ai',
  'worker',
  'background',
] as const

export type AngelCareWorkloadClass =
  (typeof ANGELCARE_WORKLOAD_CLASSES)[number]

export type AngelCareGovernorClassConfig = {
  limit: number
  maxWaitMs: number
  leaseTtlMs: number
  failClosedWhenRedisConfigured: boolean
}

export type AngelCareGovernorConfig = {
  enabled: boolean
  burstCapacity: number
  burstRefillPerSecond: number
  classes: Record<
    AngelCareWorkloadClass,
    AngelCareGovernorClassConfig
  >
}

export type AngelCareGovernorPermit = {
  source: 'redis' | 'local'
  waitedMs: number
  renew: () => Promise<boolean>
  release: () => Promise<boolean>
}

export type AngelCareGovernorAcquireResult =
  | {
      status: 'acquired'
      permit: AngelCareGovernorPermit
    }
  | {
      status: 'busy'
      retryAfterMs: number
      waitedMs: number
    }
  | {
      status: 'unavailable'
      waitedMs: number
    }
