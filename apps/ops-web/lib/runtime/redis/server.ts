import { createClient } from 'redis'

const REDIS_CONNECT_TIMEOUT_MS = 1_200
const REDIS_COMMAND_TIMEOUT_MS = 1_000

type AngelCareRedisClient = ReturnType<typeof createClient>

type AngelCareRedisGlobal = typeof globalThis & {
  __angelcareRedisClient?: AngelCareRedisClient
  __angelcareRedisConnectPromise?: Promise<AngelCareRedisClient>
}

function redisUrl() {
  return String(process.env.REDIS_URL || '').trim()
}

export function isAngelCareRedisConfigured() {
  return Boolean(redisUrl())
}

function createAngelCareRedisClient(url: string) {
  const client = createClient({
    url,
    socket: {
      connectTimeout: REDIS_CONNECT_TIMEOUT_MS,

      reconnectStrategy(retries) {
        if (retries >= 3) return false

        return Math.min(
          100 * 2 ** retries,
          500,
        )
      },
    },
  })

  /*
   * node-redis requires an error listener.
   *
   * Operational reporting belongs to the AngelCare host guard and
   * application observability layer. Never log REDIS_URL or credentials.
   */
  client.on('error', () => undefined)

  return client
}

export async function getAngelCareRedisClient():
  Promise<AngelCareRedisClient | null> {

  if (typeof window !== 'undefined') {
    throw new Error('ANGELCARE_REDIS_SERVER_ONLY')
  }

  const url = redisUrl()

  if (!url) {
    return null
  }

  const state = globalThis as AngelCareRedisGlobal

  if (!state.__angelcareRedisClient) {
    state.__angelcareRedisClient =
      createAngelCareRedisClient(url)
  }

  const client = state.__angelcareRedisClient

  if (client.isReady) {
    return client
  }

  if (!state.__angelcareRedisConnectPromise) {
    state.__angelcareRedisConnectPromise = (
      async () => {
        if (!client.isOpen) {
          await client.connect()
        }

        if (!client.isReady) {
          throw new Error('ANGELCARE_REDIS_NOT_READY')
        }

        return client
      }
    )()
      .catch((error) => {
        /*
         * If connection establishment completely closed the client,
         * permit the next request to construct a fresh client.
         */
        if (
          !client.isOpen &&
          state.__angelcareRedisClient === client
        ) {
          state.__angelcareRedisClient = undefined
        }

        throw error
      })
      .finally(() => {
        state.__angelcareRedisConnectPromise = undefined
      })
  }

  return state.__angelcareRedisConnectPromise
}

export async function withAngelCareRedisDeadline<T>(
  operation: PromiseLike<T>,
  timeoutMs = REDIS_COMMAND_TIMEOUT_MS,
): Promise<T> {

  let timer:
    | ReturnType<typeof setTimeout>
    | undefined

  try {
    return await Promise.race([
      Promise.resolve(operation),

      new Promise<T>((_, reject) => {
        timer = setTimeout(
          () => reject(
            new Error('ANGELCARE_REDIS_COMMAND_TIMEOUT'),
          ),
          timeoutMs,
        )
      }),
    ])
  } finally {
    if (timer) {
      clearTimeout(timer)
    }
  }
}

export async function probeAngelCareRedis() {
  const client =
    await getAngelCareRedisClient()

  if (!client) {
    return {
      configured: false,
      ok: false,
    }
  }

  const response =
    await withAngelCareRedisDeadline(
      client.ping(),
    )

  return {
    configured: true,
    ok: response === 'PONG',
  }
}
