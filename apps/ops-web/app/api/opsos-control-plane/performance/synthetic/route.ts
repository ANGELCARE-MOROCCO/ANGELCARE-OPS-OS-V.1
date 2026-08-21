import {
  authorizeGovernorSyntheticRequest,
} from '@/lib/runtime/governor/access'
import {
  recordGovernorFinished,
} from '@/lib/runtime/governor/metrics'
import {
  acquireAngelCareGovernorPermit,
} from '@/lib/runtime/governor/semaphore'
import type {
  AngelCareWorkloadClass,
} from '@/lib/runtime/governor/types'
import {
  ANGELCARE_WORKLOAD_CLASSES,
} from '@/lib/runtime/governor/types'

export const dynamic = 'force-dynamic'
export const revalidate = 0
export const runtime = 'nodejs'

function delay(ms: number) {
  return new Promise<void>(
    (resolve) => setTimeout(resolve, ms),
  )
}

function asClass(
  value: unknown,
): AngelCareWorkloadClass {
  const normalized = String(value || '')
    .trim()
    .toLowerCase()

  return ANGELCARE_WORKLOAD_CLASSES.includes(
    normalized as AngelCareWorkloadClass,
  )
    ? normalized as AngelCareWorkloadClass
    : 'interactive'
}

function boundedDelay(value: unknown) {
  const parsed = Number(value)

  if (!Number.isFinite(parsed)) return 100

  return Math.max(
    0,
    Math.min(
      3_000,
      Math.floor(parsed),
    ),
  )
}

export async function POST(request: Request) {
  if (!authorizeGovernorSyntheticRequest(request)) {
    return Response.json(
      {
        ok: false,
        error:
          'Synthetic governor test authorization required.',
        code:
          'OPS_GOVERNOR_TEST_UNAUTHORIZED',
      },
      {
        status: 401,
        headers: {
          'cache-control': 'no-store',
        },
      },
    )
  }

  const body = await request
    .json()
    .catch(() => ({})) as Record<string, unknown>

  const workloadClass = asClass(
    body.workloadClass,
  )

  const delayMs = boundedDelay(
    body.delayMs,
  )

  const operation =
    `synthetic:${workloadClass}`

  const acquired =
    await acquireAngelCareGovernorPermit(
      workloadClass,
      operation,
    )

  if (acquired.status !== 'acquired') {
    const unavailable =
      acquired.status === 'unavailable'

    const retryAfterMs =
      acquired.status === 'busy'
        ? acquired.retryAfterMs
        : 1_000

    return Response.json(
      {
        ok: false,
        code: unavailable
          ? 'ANGELCARE_GOVERNOR_UNAVAILABLE'
          : 'ANGELCARE_GOVERNOR_SATURATED',
        workloadClass,
        retryAfterMs,
      },
      {
        status: unavailable
          ? 503
          : 429,
        headers: {
          'cache-control': 'no-store',
          'retry-after': String(
            Math.max(
              1,
              Math.ceil(
                retryAfterMs / 1_000,
              ),
            ),
          ),
        },
      },
    )
  }

  const startedAt = Date.now()
  let failed = false

  try {
    await delay(delayMs)

    return Response.json(
      {
        ok: true,
        workloadClass,
        delayMs,
        waitedMs:
          acquired.permit.waitedMs,
        source:
          acquired.permit.source,
        elapsedMs:
          Date.now() - startedAt,
        businessDataMutated: false,
      },
      {
        headers: {
          'cache-control': 'no-store',
        },
      },
    )
  } catch (error) {
    failed = true
    throw error
  } finally {
    await acquired.permit
      .release()
      .catch(() => false)

    recordGovernorFinished(
      workloadClass,
      operation,
      Date.now() - startedAt,
      failed,
    )
  }
}
