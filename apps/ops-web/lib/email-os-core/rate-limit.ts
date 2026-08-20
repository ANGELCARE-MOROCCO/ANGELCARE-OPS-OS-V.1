import {
  getAngelCareRedisClient,
  withAngelCareRedisDeadline,
} from '@/lib/runtime/redis/server'

type Bucket = {
  count: number
  resetAt: number
}

type RateLimitResult = {
  ok: boolean
  remaining: number
  resetAt: number
}

/*
 * Local safety fallback.
 *
 * Redis is the production distributed authority when configured.
 * This map deliberately remains available so a temporary Redis outage
 * does not turn Email OS into a complete sending outage.
 *
 * In degraded mode the limiter becomes process-local rather than
 * distributed, which is still safer than bypassing rate limiting.
 */
const buckets = new Map<string, Bucket>()

const RATE_LIMIT_SCRIPT = `
local current = redis.call('INCR', KEYS[1])

if current == 1 then
  redis.call('PEXPIRE', KEYS[1], ARGV[1])
end

local ttl = redis.call('PTTL', KEYS[1])

return { current, ttl }
`

function checkMemoryRateLimit(
  key: string,
  limit: number,
  windowMs: number,
): RateLimitResult {

  const now = Date.now()
  const existing = buckets.get(key)

  if (
    !existing ||
    existing.resetAt < now
  ) {
    buckets.set(
      key,
      {
        count: 1,
        resetAt: now + windowMs,
      },
    )

    return {
      ok: true,
      remaining: limit - 1,
      resetAt: now + windowMs,
    }
  }

  if (existing.count >= limit) {
    return {
      ok: false,
      remaining: 0,
      resetAt: existing.resetAt,
    }
  }

  existing.count += 1

  return {
    ok: true,
    remaining:
      limit - existing.count,
    resetAt: existing.resetAt,
  }
}

async function checkRedisRateLimit(
  key: string,
  limit: number,
  windowMs: number,
): Promise<RateLimitResult | null> {

  const redis =
    await getAngelCareRedisClient()
      .catch(() => null)

  if (!redis) {
    return null
  }

  try {
    const redisKey =
      `angelcare:saas-ops:email-os:rate-limit:${key}`

    const result =
      await withAngelCareRedisDeadline(
        redis.eval(
          RATE_LIMIT_SCRIPT,
          {
            keys: [redisKey],
            arguments: [
              String(windowMs),
            ],
          },
        ),
      )

    if (
      !Array.isArray(result) ||
      result.length < 2
    ) {
      return null
    }

    const count =
      Number(result[0])

    const ttl =
      Number(result[1])

    if (
      !Number.isFinite(count) ||
      count < 1
    ) {
      return null
    }

    const effectiveTtl =
      Number.isFinite(ttl) &&
      ttl > 0
        ? ttl
        : windowMs

    return {
      ok: count <= limit,
      remaining:
        Math.max(
          0,
          limit - count,
        ),
      resetAt:
        Date.now() +
        effectiveTtl,
    }
  } catch {
    return null
  }
}

export async function checkEmailOSRateLimit(
  key: string,
  limit = 60,
  windowMs = 60_000,
): Promise<RateLimitResult> {

  /*
   * Redis is authoritative whenever it is reachable.
   *
   * No REDIS_URL or transient Redis failure:
   * fall back to the existing process-local limiter rather than
   * failing open or taking Email OS offline.
   */
  const distributed =
    await checkRedisRateLimit(
      key,
      limit,
      windowMs,
    )

  if (distributed) {
    return distributed
  }

  return checkMemoryRateLimit(
    key,
    limit,
    windowMs,
  )
}
