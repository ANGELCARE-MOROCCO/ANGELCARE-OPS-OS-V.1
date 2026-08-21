import { getCustomerPlatformConfig } from '@/lib/runtime/customer-platform/config'
import type { CustomerPlatformWorkloadClass } from '@/lib/runtime/customer-platform/types'

type Bucket = { tokens: number; updatedAt: number; lastSeen: number }
type IngressGlobal = typeof globalThis & {
  __angelcareCustomerIngressBuckets?: Map<string, Bucket>
  __angelcareCustomerIngressOps?: number
}

const HEAVY = ['/report', '/reports', '/export', '/import', '/scan', '/bulk', '/analytics', '/reconcile', '/backup', '/pdf', '/document']
const PROVIDER = ['/payments/webhooks/', '/webhook', '/whatsapp', '/email', '/smtp', '/bridge', '/external-provider']
const CRITICAL = ['/transport', '/attendance', '/presence', '/incident', '/safety', '/security']
const AI = ['/ai/', '/gemini', '/copilot', '/generation']

function hash(value: string) {
  let h = 2166136261
  for (let index = 0; index < value.length; index += 1) {
    h ^= value.charCodeAt(index)
    h = Math.imul(h, 16777619)
  }
  return (h >>> 0).toString(16)
}

export function classifyCustomerPlatformWorkload(pathname: string, method: string): CustomerPlatformWorkloadClass {
  const value = pathname.toLowerCase()
  const upper = method.toUpperCase()
  if (AI.some((fragment) => value.includes(fragment))) return 'ai'
  if (CRITICAL.some((fragment) => value.includes(fragment))) return 'critical'
  if (PROVIDER.some((fragment) => value.includes(fragment))) return 'provider'
  if (HEAVY.some((fragment) => value.includes(fragment))) return 'heavy'
  if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(upper)) return 'mutation'
  if (value.startsWith('/angelcare-marketplace') || value.startsWith('/api/angelcare-marketplace')) return 'public'
  return 'interactive'
}

function protectedPath(pathname: string) {
  if (
    pathname === '/api/angelcare-marketplace/foundation/health' ||
    pathname === '/api/angelcare-marketplace/foundation/readiness' ||
    pathname.startsWith('/api/health/') ||
    pathname.startsWith('/_next/') ||
    pathname === '/favicon.ico'
  ) return false
  return (
    pathname.startsWith('/api/') ||
    pathname.startsWith('/angelcare-marketplace') ||
    pathname.startsWith('/angelcare-360-command-center')
  )
}

function fingerprint(request: Request) {
  const forwarded = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || ''
  const real = request.headers.get('x-real-ip')?.trim() || ''
  const cookie = request.headers.get('cookie') || ''
  const agent = request.headers.get('user-agent') || ''
  return hash(`${forwarded}|${real}|${cookie.slice(0, 512)}|${agent.slice(0, 120)}`)
}

function bucketMap() {
  const state = globalThis as IngressGlobal
  if (!state.__angelcareCustomerIngressBuckets) state.__angelcareCustomerIngressBuckets = new Map()
  state.__angelcareCustomerIngressOps = (state.__angelcareCustomerIngressOps || 0) + 1
  if (state.__angelcareCustomerIngressOps % 500 === 0) {
    const cutoff = Date.now() - 10 * 60_000
    for (const [key, value] of state.__angelcareCustomerIngressBuckets) {
      if (value.lastSeen < cutoff) state.__angelcareCustomerIngressBuckets.delete(key)
    }
    while (state.__angelcareCustomerIngressBuckets.size > 4_096) {
      const first = state.__angelcareCustomerIngressBuckets.keys().next().value
      if (!first) break
      state.__angelcareCustomerIngressBuckets.delete(first)
    }
  }
  return state.__angelcareCustomerIngressBuckets
}

function consume(key: string, capacity: number, refillPerSecond: number) {
  const now = Date.now()
  const buckets = bucketMap()
  const state = buckets.get(key) || { tokens: capacity, updatedAt: now, lastSeen: now }
  const elapsed = Math.max(0, now - state.updatedAt)
  state.tokens = Math.min(capacity, state.tokens + elapsed * (refillPerSecond / 1_000))
  state.updatedAt = now
  state.lastSeen = now
  buckets.set(key, state)
  if (state.tokens >= 1) {
    state.tokens -= 1
    return { allowed: true, retryAfterMs: 0 }
  }
  const retryAfterMs = Math.max(50, Math.ceil((1 - state.tokens) / (refillPerSecond / 1_000)))
  return { allowed: false, retryAfterMs }
}

export function admitCustomerPlatformIngress(request: Request) {
  const url = new URL(request.url)
  const config = getCustomerPlatformConfig()
  if (!config.enabled || !protectedPath(url.pathname)) {
    return { allowed: true, retryAfterMs: 0, workloadClass: 'interactive' as CustomerPlatformWorkloadClass }
  }
  const workloadClass = classifyCustomerPlatformWorkload(url.pathname, request.method)
  const declaredLength = Number(request.headers.get('content-length') || 0)
  if (Number.isFinite(declaredLength) && declaredLength > config.maxJsonBodyBytes) {
    return {
      allowed: false,
      retryAfterMs: 0,
      workloadClass,
      status: 413,
      code: 'CUSTOMER_PLATFORM_PAYLOAD_TOO_LARGE',
    }
  }
  const classConfig = config.classes[workloadClass]
  const global = consume(`global:${workloadClass}`, classConfig.burstCapacity, classConfig.burstRefillPerSecond)
  if (!global.allowed) return { ...global, workloadClass, status: 429, code: 'CUSTOMER_PLATFORM_INGRESS_SATURATED' }
  const client = consume(
    `client:${workloadClass}:${fingerprint(request)}`,
    Math.max(2, Math.ceil(classConfig.burstCapacity / 2)),
    Math.max(1, Math.ceil(classConfig.burstRefillPerSecond / 2)),
  )
  return client.allowed
    ? { ...client, workloadClass, status: 200, code: 'CUSTOMER_PLATFORM_INGRESS_OK' }
    : { ...client, workloadClass, status: 429, code: 'CUSTOMER_PLATFORM_INGRESS_SATURATED' }
}
