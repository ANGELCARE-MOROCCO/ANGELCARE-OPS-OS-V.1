import { createHash, randomUUID } from 'node:crypto'
import { getCustomerPlatformConfig } from '@/lib/runtime/customer-platform/config'
import {
  getCustomerPlatformRedisClient,
  isCustomerPlatformRedisConfigured,
  withCustomerPlatformRedisDeadline,
} from '@/lib/runtime/customer-platform/redis'
import {
  recordCustomerPlatformAdmitted,
  recordCustomerPlatformBusy,
  recordCustomerPlatformUnavailable,
} from '@/lib/runtime/customer-platform/metrics'
import type {
  CustomerPlatformAcquireResult,
  CustomerPlatformPermit,
  CustomerPlatformWorkloadClass,
} from '@/lib/runtime/customer-platform/types'

const ACQUIRE_LUA = `
redis.call('ZREMRANGEBYSCORE', KEYS[1], '-inf', ARGV[1])
local count = redis.call('ZCARD', KEYS[1])
if count < tonumber(ARGV[2]) then
  redis.call('ZADD', KEYS[1], ARGV[3], ARGV[4])
  redis.call('PEXPIRE', KEYS[1], ARGV[5])
  return 1
end
return 0
`
const RENEW_LUA = `
if redis.call('ZSCORE', KEYS[1], ARGV[1]) then
  redis.call('ZADD', KEYS[1], 'XX', ARGV[2], ARGV[1])
  redis.call('PEXPIRE', KEYS[1], ARGV[3])
  return 1
end
return 0
`
const RELEASE_LUA = `return redis.call('ZREM', KEYS[1], ARGV[1])`

type LocalEntry = Map<string, number>
type SemaphoreGlobal = typeof globalThis & { __angelcareCustomerLocalSemaphores?: Map<string, LocalEntry> }

function sleep(ms: number) { return new Promise((resolve) => setTimeout(resolve, ms)) }
function digest(value: string) { return createHash('sha256').update(value).digest('hex').slice(0, 32) }
function keyFor(workloadClass: CustomerPlatformWorkloadClass, scope?: string | null) {
  return scope
    ? `angelcare:customer-platform:governor:${workloadClass}:scope:${digest(scope)}`
    : `angelcare:customer-platform:governor:${workloadClass}:global`
}

function localMap() {
  const state = globalThis as SemaphoreGlobal
  if (!state.__angelcareCustomerLocalSemaphores) state.__angelcareCustomerLocalSemaphores = new Map()
  return state.__angelcareCustomerLocalSemaphores
}

function localAcquire(key: string, limit: number, ttlMs: number): CustomerPlatformPermit | null {
  const now = Date.now()
  const map = localMap()
  const entries = map.get(key) || new Map<string, number>()
  for (const [token, expiry] of entries) if (expiry <= now) entries.delete(token)
  if (entries.size >= limit) { map.set(key, entries); return null }
  const token = randomUUID()
  entries.set(token, now + ttlMs)
  map.set(key, entries)
  return {
    source: 'local', waitedMs: 0,
    renew: async () => { if (!entries.has(token)) return false; entries.set(token, Date.now() + ttlMs); return true },
    release: async () => entries.delete(token),
  }
}

async function redisAcquire(key: string, limit: number, ttlMs: number): Promise<CustomerPlatformPermit | null | undefined> {
  const client = await getCustomerPlatformRedisClient()
  if (!client) return undefined
  const token = randomUUID()
  const now = Date.now()
  const expiry = now + ttlMs
  const acquired = Number(await withCustomerPlatformRedisDeadline(
    client.eval(ACQUIRE_LUA, { keys: [key], arguments: [String(now), String(limit), String(expiry), token, String(ttlMs)] }),
    650,
  )) === 1
  if (!acquired) return null
  return {
    source: 'redis', waitedMs: 0,
    renew: async () => Number(await withCustomerPlatformRedisDeadline(
      client.eval(RENEW_LUA, { keys: [key], arguments: [token, String(Date.now() + ttlMs), String(ttlMs)] }),
      650,
    )) === 1,
    release: async () => Number(await withCustomerPlatformRedisDeadline(
      client.eval(RELEASE_LUA, { keys: [key], arguments: [token] }),
      650,
    )) > 0,
  }
}

async function acquireOne(
  workloadClass: CustomerPlatformWorkloadClass,
  key: string,
  limit: number,
  maxWaitMs: number,
  ttlMs: number,
  failClosed: boolean,
): Promise<CustomerPlatformAcquireResult> {
  const started = Date.now()
  const redisConfigured = isCustomerPlatformRedisConfigured()
  while (true) {
    try {
      if (redisConfigured) {
        const redisPermit = await redisAcquire(key, limit, ttlMs)
        if (redisPermit) return { status: 'acquired', permit: { ...redisPermit, waitedMs: Date.now() - started } }
        if (redisPermit === undefined && failClosed) {
          recordCustomerPlatformUnavailable(workloadClass)
          return { status: 'unavailable', waitedMs: Date.now() - started }
        }
        if (redisPermit === undefined) {
          const local = localAcquire(key, limit, ttlMs)
          if (local) return { status: 'acquired', permit: { ...local, waitedMs: Date.now() - started } }
        }
      } else {
        const local = localAcquire(key, limit, ttlMs)
        if (local) return { status: 'acquired', permit: { ...local, waitedMs: Date.now() - started } }
      }
    } catch {
      if (redisConfigured && failClosed) {
        recordCustomerPlatformUnavailable(workloadClass)
        return { status: 'unavailable', waitedMs: Date.now() - started }
      }
      const local = localAcquire(key, limit, ttlMs)
      if (local) return { status: 'acquired', permit: { ...local, waitedMs: Date.now() - started } }
    }
    const waitedMs = Date.now() - started
    if (waitedMs >= maxWaitMs) {
      recordCustomerPlatformBusy(workloadClass)
      return { status: 'busy', retryAfterMs: Math.max(250, Math.min(2_000, ttlMs / 10)), waitedMs }
    }
    await sleep(Math.min(75, Math.max(20, maxWaitMs - waitedMs)))
  }
}

export async function acquireCustomerPlatformPermit(
  workloadClass: CustomerPlatformWorkloadClass,
  scope?: string | null,
): Promise<CustomerPlatformAcquireResult> {
  const config = getCustomerPlatformConfig()
  const classConfig = config.classes[workloadClass]
  if (!config.enabled) {
    const permit: CustomerPlatformPermit = { source: 'local', waitedMs: 0, renew: async () => true, release: async () => true }
    return { status: 'acquired', permit }
  }
  const globalResult = await acquireOne(
    workloadClass,
    keyFor(workloadClass),
    classConfig.limit,
    classConfig.maxWaitMs,
    classConfig.leaseTtlMs,
    classConfig.failClosedWhenRedisConfigured,
  )
  if (globalResult.status !== 'acquired') return globalResult
  if (!scope) {
    recordCustomerPlatformAdmitted(workloadClass)
    return globalResult
  }
  const scopedResult = await acquireOne(
    workloadClass,
    keyFor(workloadClass, scope),
    classConfig.tenantLimit,
    classConfig.maxWaitMs,
    classConfig.leaseTtlMs,
    classConfig.failClosedWhenRedisConfigured,
  )
  if (scopedResult.status !== 'acquired') {
    await globalResult.permit.release().catch(() => false)
    return scopedResult
  }
  recordCustomerPlatformAdmitted(workloadClass)
  return {
    status: 'acquired',
    permit: {
      source: globalResult.permit.source === 'redis' || scopedResult.permit.source === 'redis' ? 'redis' : 'local',
      waitedMs: Math.max(globalResult.permit.waitedMs, scopedResult.permit.waitedMs),
      renew: async () => (await globalResult.permit.renew()) && (await scopedResult.permit.renew()),
      release: async () => {
        const [globalReleased, scopedReleased] = await Promise.all([
          globalResult.permit.release().catch(() => false),
          scopedResult.permit.release().catch(() => false),
        ])
        return globalReleased || scopedReleased
      },
    },
  }
}
