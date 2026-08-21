import {
  getAngelCareGovernorConfig,
} from '@/lib/runtime/governor/config'
import {
  recordGovernorFinished,
} from '@/lib/runtime/governor/metrics'
import {
  acquireAngelCareGovernorPermit,
} from '@/lib/runtime/governor/semaphore'
import type {
  AngelCareWorkloadClass,
} from '@/lib/runtime/governor/types'

type AnyRouteHandler = (
  ...args: any[]
) => any

export type GovernRouteInput = {
  workloadClass: AngelCareWorkloadClass
  operation: string
}

function saturationResponse(
  workloadClass: AngelCareWorkloadClass,
  operation: string,
  result:
    | {
        status: 'busy'
        retryAfterMs: number
        waitedMs: number
      }
    | {
        status: 'unavailable'
        waitedMs: number
      },
) {
  const unavailable =
    result.status === 'unavailable'

  const status = unavailable
    ? 503
    : 429

  const retryAfterMs =
    result.status === 'busy'
      ? result.retryAfterMs
      : 1_000

  return Response.json(
    {
      ok: false,
      error: unavailable
        ? 'Execution capacity coordination is temporarily unavailable.'
        : 'This operation is temporarily at capacity.',
      code: unavailable
        ? 'ANGELCARE_GOVERNOR_UNAVAILABLE'
        : 'ANGELCARE_GOVERNOR_SATURATED',
      workloadClass,
      retryAfterMs,
    },
    {
      status,
      headers: {
        'cache-control': 'no-store',
        'retry-after': String(
          Math.max(
            1,
            Math.ceil(retryAfterMs / 1_000),
          ),
        ),
        'x-angelcare-governor': 'active',
        'x-angelcare-governor-class': workloadClass,
        'x-angelcare-governor-operation': operation.slice(0, 120),
      },
    },
  )
}

export async function runGoverned<T>(
  input: GovernRouteInput,
  operation: () => Promise<T>,
): Promise<T> {
  const config = getAngelCareGovernorConfig()

  if (!config.enabled) {
    return operation()
  }

  const acquired =
    await acquireAngelCareGovernorPermit(
      input.workloadClass,
      input.operation,
    )

  if (acquired.status !== 'acquired') {
    const error = new Error(
      acquired.status === 'busy'
        ? 'ANGELCARE_GOVERNOR_SATURATED'
        : 'ANGELCARE_GOVERNOR_UNAVAILABLE',
    ) as Error & {
      governorResult?: typeof acquired
    }

    error.governorResult = acquired
    throw error
  }

  const startedAt = Date.now()
  const classConfig =
    config.classes[input.workloadClass]

  let failed = false
  let permitLost = false

  const heartbeat = setInterval(
    () => {
      void acquired.permit
        .renew()
        .then((ok) => {
          if (!ok) permitLost = true
        })
        .catch(() => {
          permitLost = true
        })
    },
    Math.max(
      1_000,
      Math.floor(classConfig.leaseTtlMs / 3),
    ),
  )

  try {
    const value = await operation()

    if (permitLost) {
      /*
       * Do not retroactively fail successful user work.
       * The loss is visible in runtime metrics / Redis health,
       * while no additional work is started by this invocation.
       */
    }

    return value
  } catch (error) {
    failed = true
    throw error
  } finally {
    clearInterval(heartbeat)

    await acquired.permit
      .release()
      .catch(() => false)

    recordGovernorFinished(
      input.workloadClass,
      input.operation,
      Date.now() - startedAt,
      failed,
    )
  }
}

export function governRoute<T extends AnyRouteHandler>(
  input: GovernRouteInput,
  handler: T,
): T {
  const wrapped = async (...args: any[]) => {
    const config = getAngelCareGovernorConfig()

    if (!config.enabled) {
      return handler(...args)
    }

    const acquired =
      await acquireAngelCareGovernorPermit(
        input.workloadClass,
        input.operation,
      )

    if (acquired.status !== 'acquired') {
      return saturationResponse(
        input.workloadClass,
        input.operation,
        acquired,
      )
    }

    const startedAt = Date.now()
    const classConfig =
      config.classes[input.workloadClass]

    let failed = false

    const heartbeat = setInterval(
      () => {
        void acquired.permit
          .renew()
          .catch(() => false)
      },
      Math.max(
        1_000,
        Math.floor(classConfig.leaseTtlMs / 3),
      ),
    )

    try {
      return await handler(...args)
    } catch (error) {
      failed = true
      throw error
    } finally {
      clearInterval(heartbeat)

      await acquired.permit
        .release()
        .catch(() => false)

      recordGovernorFinished(
        input.workloadClass,
        input.operation,
        Date.now() - startedAt,
        failed,
      )
    }
  }

  return wrapped as T
}
