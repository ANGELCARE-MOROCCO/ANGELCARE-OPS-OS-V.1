import {
  getAngelCareRedisClient,
  withAngelCareRedisDeadline,
} from '@/lib/runtime/redis/server'

const CACHE_OPERATION_TIMEOUT_MS = 300

export type AngelCareRedisJsonRead<T> =
  | {
      status: 'hit'
      value: T
      ttlMs: number
    }
  | {
      status: 'miss'
    }
  | {
      status: 'unavailable'
    }

async function cacheClient() {
  try {
    return await withAngelCareRedisDeadline(
      getAngelCareRedisClient(),
      CACHE_OPERATION_TIMEOUT_MS,
    )
  } catch {
    return null
  }
}

export async function readAngelCareRedisJson<T>(
  key: string,
  validate: (value: unknown) => value is T,
): Promise<AngelCareRedisJsonRead<T>> {

  const redis = await cacheClient()

  if (!redis) {
    return {
      status: 'unavailable',
    }
  }

  try {
    const [raw, ttlMs] =
      await withAngelCareRedisDeadline(
        Promise.all([
          redis.get(key),
          redis.pTTL(key),
        ]),
        CACHE_OPERATION_TIMEOUT_MS,
      )

    if (
      !raw ||
      !Number.isFinite(ttlMs) ||
      ttlMs <= 0
    ) {
      return {
        status: 'miss',
      }
    }

    let parsed: unknown

    try {
      parsed = JSON.parse(raw)
    } catch {
      await withAngelCareRedisDeadline(
        redis.del(key),
        CACHE_OPERATION_TIMEOUT_MS,
      ).catch(() => undefined)

      return {
        status: 'miss',
      }
    }

    if (!validate(parsed)) {
      await withAngelCareRedisDeadline(
        redis.del(key),
        CACHE_OPERATION_TIMEOUT_MS,
      ).catch(() => undefined)

      return {
        status: 'miss',
      }
    }

    return {
      status: 'hit',
      value: parsed,
      ttlMs,
    }
  } catch {
    return {
      status: 'unavailable',
    }
  }
}

export async function writeAngelCareRedisJson(
  input: {
    key: string
    value: unknown
    ttlMs: number
    indexKeys?: string[]
  },
): Promise<boolean> {

  const redis = await cacheClient()

  if (!redis) {
    return false
  }

  try {
    const ttlMs =
      Math.max(
        1,
        Math.floor(input.ttlMs),
      )

    const indexTtlMs =
      ttlMs + 15_000

    const indexKeys =
      Array.from(
        new Set(
          (input.indexKeys || [])
            .map((value) => value.trim())
            .filter(Boolean),
        ),
      )

    await withAngelCareRedisDeadline(
      redis.set(
        input.key,
        JSON.stringify(input.value),
        {
          PX: ttlMs,
        },
      ),
      CACHE_OPERATION_TIMEOUT_MS,
    )

    if (indexKeys.length) {
      await withAngelCareRedisDeadline(
        Promise.all(
          indexKeys.map(
            async (indexKey) => {
              await redis.sAdd(
                indexKey,
                input.key,
              )

              await redis.pExpire(
                indexKey,
                indexTtlMs,
              )
            },
          ),
        ),
        CACHE_OPERATION_TIMEOUT_MS,
      )
    }

    return true
  } catch {
    return false
  }
}

export async function invalidateAngelCareRedisJsonIndex(
  indexKey: string,
): Promise<boolean> {

  const redis = await cacheClient()

  if (!redis) {
    return false
  }

  try {
    const members =
      await withAngelCareRedisDeadline(
        redis.sMembers(indexKey),
        CACHE_OPERATION_TIMEOUT_MS,
      )

    if (members.length) {
      await withAngelCareRedisDeadline(
        Promise.all(
          members.map(
            (key) => redis.del(key),
          ),
        ),
        CACHE_OPERATION_TIMEOUT_MS,
      )
    }

    await withAngelCareRedisDeadline(
      redis.del(indexKey),
      CACHE_OPERATION_TIMEOUT_MS,
    )

    return true
  } catch {
    return false
  }
}
