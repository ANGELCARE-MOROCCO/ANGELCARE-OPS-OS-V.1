import { randomUUID } from 'node:crypto'

import {
  getAngelCareGovernorConfig,
} from '@/lib/runtime/governor/config'
import {
  recordGovernorAdmitted,
  recordGovernorBusy,
  recordGovernorUnavailable,
} from '@/lib/runtime/governor/metrics'
import type {
  AngelCareGovernorAcquireResult,
  AngelCareGovernorPermit,
  AngelCareWorkloadClass,
} from '@/lib/runtime/governor/types'
import {
  getAngelCareRedisClient,
  isAngelCareRedisConfigured,
  withAngelCareRedisDeadline,
} from '@/lib/runtime/redis/server'

const ACQUIRE_SCRIPT = `
local now = tonumber(ARGV[1])
local ttl = tonumber(ARGV[2])
local limit = tonumber(ARGV[3])
local token = ARGV[4]

redis.call('ZREMRANGEBYSCORE', KEYS[1], '-inf', now)

local active = redis.call('ZCARD', KEYS[1])

if active >= limit then
  local oldest = redis.call('ZRANGE', KEYS[1], 0, 0, 'WITHSCORES')
  local retryAt = now + 100

  if oldest[2] then
    retryAt = tonumber(oldest[2])
  end

  return { 0, active, retryAt }
end

local expiresAt = now + ttl

redis.call('ZADD', KEYS[1], expiresAt, token)
redis.call('PEXPIRE', KEYS[1], ttl + 5000)

return { 1, active + 1, expiresAt }
`

const RENEW_SCRIPT = `
local score = redis.call('ZSCORE', KEYS[1], ARGV[1])

if not score then
  return 0
end

redis.call('ZADD', KEYS[1], ARGV[2], ARGV[1])
redis.call('PEXPIRE', KEYS[1], ARGV[3])

return 1
`

const RELEASE_SCRIPT = `
return redis.call('ZREM', KEYS[1], ARGV[1])
`

type LocalSemaphoreState = {
  active: number
}

type SemaphoreGlobal = typeof globalThis & {
  __angelcareLocalSemaphores?: Map<
    AngelCareWorkloadClass,
    LocalSemaphoreState
  >
}

function delay(ms: number) {
  return new Promise<void>(
    (resolve) => setTimeout(resolve, ms),
  )
}

function localState(
  workloadClass: AngelCareWorkloadClass,
) {
  const globalState = globalThis as SemaphoreGlobal

  if (!globalState.__angelcareLocalSemaphores) {
    globalState.__angelcareLocalSemaphores = new Map()
  }

  let state = globalState.__angelcareLocalSemaphores.get(
    workloadClass,
  )

  if (!state) {
    state = {
      active: 0,
    }

    globalState.__angelcareLocalSemaphores.set(
      workloadClass,
      state,
    )
  }

  return state
}

async function acquireLocal(
  workloadClass: AngelCareWorkloadClass,
  operation: string,
  startedAt: number,
): Promise<AngelCareGovernorAcquireResult> {
  const classConfig =
    getAngelCareGovernorConfig().classes[workloadClass]

  const state = localState(workloadClass)

  while (true) {
    if (state.active < classConfig.limit) {
      state.active += 1

      const waitedMs = Date.now() - startedAt

      recordGovernorAdmitted(
        workloadClass,
        operation,
        waitedMs,
      )

      let released = false

      const permit: AngelCareGovernorPermit = {
        source: 'local',
        waitedMs,
        async renew() {
          return !released
        },
        async release() {
          if (released) return false
          released = true
          state.active = Math.max(0, state.active - 1)
          return true
        },
      }

      return {
        status: 'acquired',
        permit,
      }
    }

    const waitedMs = Date.now() - startedAt

    if (waitedMs >= classConfig.maxWaitMs) {
      recordGovernorBusy(
        workloadClass,
        operation,
      )

      return {
        status: 'busy',
        retryAfterMs: 100,
        waitedMs,
      }
    }

    await delay(
      Math.min(
        75,
        Math.max(
          20,
          classConfig.maxWaitMs - waitedMs,
        ),
      ),
    )
  }
}

async function acquireDistributed(
  workloadClass: AngelCareWorkloadClass,
  operation: string,
  startedAt: number,
): Promise<AngelCareGovernorAcquireResult> {
  const config = getAngelCareGovernorConfig()
  const classConfig = config.classes[workloadClass]
  const token = randomUUID()
  const key = `angelcare:saas-ops:governor:semaphore:${workloadClass}`

  let redis

  try {
    redis = await getAngelCareRedisClient()
  } catch {
    redis = null
  }

  if (!redis) {
    if (classConfig.failClosedWhenRedisConfigured) {
      const waitedMs = Date.now() - startedAt

      recordGovernorUnavailable(
        workloadClass,
        operation,
      )

      return {
        status: 'unavailable',
        waitedMs,
      }
    }

    return acquireLocal(
      workloadClass,
      operation,
      startedAt,
    )
  }

  while (true) {
    const now = Date.now()

    let result: unknown

    try {
      result = await withAngelCareRedisDeadline(
        redis.eval(
          ACQUIRE_SCRIPT,
          {
            keys: [key],
            arguments: [
              String(now),
              String(classConfig.leaseTtlMs),
              String(classConfig.limit),
              token,
            ],
          },
        ),
        700,
      )
    } catch {
      if (classConfig.failClosedWhenRedisConfigured) {
        const waitedMs = Date.now() - startedAt

        recordGovernorUnavailable(
          workloadClass,
          operation,
        )

        return {
          status: 'unavailable',
          waitedMs,
        }
      }

      return acquireLocal(
        workloadClass,
        operation,
        startedAt,
      )
    }

    const values = Array.isArray(result)
      ? result.map(Number)
      : []

    if (values[0] === 1) {
      const waitedMs = Date.now() - startedAt

      recordGovernorAdmitted(
        workloadClass,
        operation,
        waitedMs,
      )

      let released = false

      const permit: AngelCareGovernorPermit = {
        source: 'redis',
        waitedMs,

        async renew() {
          if (released) return false

          try {
            const expiresAt =
              Date.now() + classConfig.leaseTtlMs

            const renewed =
              await withAngelCareRedisDeadline(
                redis.eval(
                  RENEW_SCRIPT,
                  {
                    keys: [key],
                    arguments: [
                      token,
                      String(expiresAt),
                      String(
                        classConfig.leaseTtlMs + 5_000,
                      ),
                    ],
                  },
                ),
                700,
              )

            return Number(renewed) === 1
          } catch {
            return false
          }
        },

        async release() {
          if (released) return false
          released = true

          try {
            const removed =
              await withAngelCareRedisDeadline(
                redis.eval(
                  RELEASE_SCRIPT,
                  {
                    keys: [key],
                    arguments: [token],
                  },
                ),
                700,
              )

            return Number(removed) === 1
          } catch {
            return false
          }
        },
      }

      return {
        status: 'acquired',
        permit,
      }
    }

    const waitedMs = Date.now() - startedAt

    if (waitedMs >= classConfig.maxWaitMs) {
      const retryAt = Number(values[2] || 0)
      const retryAfterMs = Math.max(
        100,
        Math.min(
          10_000,
          retryAt > now
            ? retryAt - now
            : 100,
        ),
      )

      recordGovernorBusy(
        workloadClass,
        operation,
      )

      return {
        status: 'busy',
        retryAfterMs,
        waitedMs,
      }
    }

    await delay(
      Math.min(
        100,
        Math.max(
          25,
          classConfig.maxWaitMs - waitedMs,
        ),
      ),
    )
  }
}

export async function acquireAngelCareGovernorPermit(
  workloadClass: AngelCareWorkloadClass,
  operation: string,
): Promise<AngelCareGovernorAcquireResult> {
  const config = getAngelCareGovernorConfig()
  const startedAt = Date.now()

  if (!config.enabled) {
    return acquireLocal(
      workloadClass,
      operation,
      startedAt,
    )
  }

  if (isAngelCareRedisConfigured()) {
    return acquireDistributed(
      workloadClass,
      operation,
      startedAt,
    )
  }

  return acquireLocal(
    workloadClass,
    operation,
    startedAt,
  )
}
