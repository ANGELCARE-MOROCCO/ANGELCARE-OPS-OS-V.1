import { randomUUID } from 'node:crypto'

import {
  getAngelCareRedisClient,
  withAngelCareRedisDeadline,
} from '@/lib/runtime/redis/server'

const LEASE_OPERATION_TIMEOUT_MS = 500

const RENEW_SCRIPT = `
if redis.call('GET', KEYS[1]) == ARGV[1] then
  return redis.call('PEXPIRE', KEYS[1], ARGV[2])
end

return 0
`

const RELEASE_SCRIPT = `
if redis.call('GET', KEYS[1]) == ARGV[1] then
  return redis.call('DEL', KEYS[1])
end

return 0
`

export type AngelCareRedisLease = {
  renew: () => Promise<boolean>
  release: () => Promise<boolean>
}

export type AngelCareRedisLeaseResult =
  | {
      status: 'acquired'
      lease: AngelCareRedisLease
    }
  | {
      status: 'busy'
    }
  | {
      status: 'unavailable'
    }

async function leaseClient() {
  try {
    return await withAngelCareRedisDeadline(
      getAngelCareRedisClient(),
      LEASE_OPERATION_TIMEOUT_MS,
    )
  } catch {
    return null
  }
}

export async function acquireAngelCareRedisLease(
  input: {
    key: string
    ttlMs: number
  },
): Promise<AngelCareRedisLeaseResult> {

  const redis = await leaseClient()

  if (!redis) {
    return {
      status: 'unavailable',
    }
  }

  const ttlMs =
    Math.max(
      1_000,
      Math.floor(input.ttlMs),
    )

  const token = randomUUID()

  try {
    const acquired =
      await withAngelCareRedisDeadline(
        redis.set(
          input.key,
          token,
          {
            NX: true,
            PX: ttlMs,
          },
        ),
        LEASE_OPERATION_TIMEOUT_MS,
      )

    if (acquired !== 'OK') {
      return {
        status: 'busy',
      }
    }
  } catch {
    return {
      status: 'unavailable',
    }
  }

  let released = false

  return {
    status: 'acquired',

    lease: {
      async renew() {
        if (released) {
          return false
        }

        try {
          const result =
            await withAngelCareRedisDeadline(
              redis.eval(
                RENEW_SCRIPT,
                {
                  keys: [
                    input.key,
                  ],
                  arguments: [
                    token,
                    String(ttlMs),
                  ],
                },
              ),
              LEASE_OPERATION_TIMEOUT_MS,
            )

          return Number(result) === 1
        } catch {
          return false
        }
      },

      async release() {
        if (released) {
          return false
        }

        released = true

        try {
          const result =
            await withAngelCareRedisDeadline(
              redis.eval(
                RELEASE_SCRIPT,
                {
                  keys: [
                    input.key,
                  ],
                  arguments: [
                    token,
                  ],
                },
              ),
              LEASE_OPERATION_TIMEOUT_MS,
            )

          return Number(result) === 1
        } catch {
          return false
        }
      },
    },
  }
}
