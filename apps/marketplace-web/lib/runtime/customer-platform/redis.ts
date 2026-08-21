import { createClient } from 'redis'

type Client = ReturnType<typeof createClient>
type RedisGlobal = typeof globalThis & {
  __angelcareCustomerRedisClient?: Client
  __angelcareCustomerRedisPromise?: Promise<Client | null>
}

export function customerPlatformRedisUrl() {
  return (process.env.CUSTOMER_PLATFORM_REDIS_URL || process.env.REDIS_URL || '').trim()
}

export function isCustomerPlatformRedisConfigured() {
  return Boolean(customerPlatformRedisUrl())
}

export async function withCustomerPlatformRedisDeadline<T>(promise: Promise<T>, timeoutMs = 500): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | null = null
  try {
    return await Promise.race([
      promise,
      new Promise<T>((_, reject) => {
        timer = setTimeout(() => reject(new Error('CUSTOMER_PLATFORM_REDIS_TIMEOUT')), timeoutMs)
      }),
    ])
  } finally {
    if (timer) clearTimeout(timer)
  }
}

export async function getCustomerPlatformRedisClient(): Promise<Client | null> {
  const url = customerPlatformRedisUrl()
  if (!url) return null
  const state = globalThis as RedisGlobal
  if (state.__angelcareCustomerRedisClient?.isReady) return state.__angelcareCustomerRedisClient
  if (state.__angelcareCustomerRedisClient && !state.__angelcareCustomerRedisClient.isReady) {
    try { state.__angelcareCustomerRedisClient.destroy() } catch {}
    state.__angelcareCustomerRedisClient = undefined
  }
  if (!state.__angelcareCustomerRedisPromise) {
    state.__angelcareCustomerRedisPromise = (async () => {
      const client = createClient({ url, socket: { connectTimeout: 1_500, reconnectStrategy: false } })
      client.on('error', () => undefined)
      try {
        await withCustomerPlatformRedisDeadline(client.connect(), 2_000)
        state.__angelcareCustomerRedisClient = client
        return client
      } catch {
        try { client.destroy() } catch {}
        return null
      } finally {
        state.__angelcareCustomerRedisPromise = undefined
      }
    })()
  }
  return state.__angelcareCustomerRedisPromise
}
