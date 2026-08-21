import { createHash } from 'node:crypto'
import { getCustomerPlatformConfig } from '@/lib/runtime/customer-platform/config'
import { recordCustomerPlatformFinished } from '@/lib/runtime/customer-platform/metrics'
import { acquireCustomerPlatformPermit } from '@/lib/runtime/customer-platform/semaphore'
import type { CustomerPlatformWorkloadClass } from '@/lib/runtime/customer-platform/types'

type AnyHandler = (...args: any[]) => any
export type CustomerPlatformRouteInput = {
  workloadClass: CustomerPlatformWorkloadClass
  operation: string
}

function hash(value: string) { return createHash('sha256').update(value).digest('hex').slice(0, 32) }

function requestScope(value: unknown) {
  if (!(value instanceof Request)) return null
  const url = new URL(value.url)
  for (const key of ['tenantId', 'tenant_id', 'schoolId', 'school_id']) {
    const found = url.searchParams.get(key)
    if (found) return `tenant:${hash(found)}`
  }
  const scopedHeader =
    value.headers.get('x-angelcare-tenant-id') ||
    value.headers.get('x-tenant-id') ||
    value.headers.get('x-angelcare-school-id') ||
    value.headers.get('x-school-id')
  if (scopedHeader) return `tenant:${hash(scopedHeader)}`
  const cookie = value.headers.get('cookie') || ''
  const session = cookie.match(/(?:app_session|angelcare_session|opsos_session|sb-access-token)=([^;]+)/i)?.[1]
  if (session) return `session:${hash(session)}`
  const forwarded = value.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
  return forwarded ? `client:${hash(forwarded)}` : null
}

function saturationResponse(
  workloadClass: CustomerPlatformWorkloadClass,
  operation: string,
  result: { status: 'busy'; retryAfterMs: number; waitedMs: number } | { status: 'unavailable'; waitedMs: number },
) {
  const unavailable = result.status === 'unavailable'
  const retryAfterMs = result.status === 'busy' ? result.retryAfterMs : 1_000
  return Response.json(
    {
      ok: false,
      error: unavailable
        ? 'Execution capacity coordination is temporarily unavailable.'
        : 'This operation is temporarily at capacity.',
      code: unavailable ? 'CUSTOMER_PLATFORM_GOVERNOR_UNAVAILABLE' : 'CUSTOMER_PLATFORM_GOVERNOR_SATURATED',
      workloadClass,
      retryAfterMs,
    },
    {
      status: unavailable ? 503 : 429,
      headers: {
        'cache-control': 'no-store',
        'retry-after': String(Math.max(1, Math.ceil(retryAfterMs / 1_000))),
        'x-angelcare-customer-governor': 'active',
        'x-angelcare-customer-governor-class': workloadClass,
        'x-angelcare-customer-governor-operation': operation.slice(0, 120),
      },
    },
  )
}

export function governCustomerPlatformRoute<T extends AnyHandler>(input: CustomerPlatformRouteInput, handler: T): T {
  const wrapped = async (...args: any[]) => {
    const config = getCustomerPlatformConfig()
    if (!config.enabled) return handler(...args)
    const acquired = await acquireCustomerPlatformPermit(input.workloadClass, requestScope(args[0]))
    if (acquired.status !== 'acquired') return saturationResponse(input.workloadClass, input.operation, acquired)
    const startedAt = Date.now()
    const ttl = config.classes[input.workloadClass].leaseTtlMs
    let failed = false
    const heartbeat = setInterval(() => { void acquired.permit.renew().catch(() => false) }, Math.max(1_000, Math.floor(ttl / 3)))
    try {
      return await handler(...args)
    } catch (error) {
      failed = true
      throw error
    } finally {
      clearInterval(heartbeat)
      await acquired.permit.release().catch(() => false)
      recordCustomerPlatformFinished(input.workloadClass, Date.now() - startedAt, failed)
    }
  }
  return wrapped as T
}
