import { timingSafeEqual } from 'node:crypto'

import { getCurrentAppUser } from '@/lib/auth/session'

export type EmailOSWorkerAuthorization =
  | {
      ok: true
      source: 'secret' | 'session' | 'development'
    }
  | {
      ok: false
      response: Response
    }

function clean(value: unknown) {
  return typeof value === 'string'
    ? value.trim()
    : ''
}

function constantTimeEqual(
  left: string,
  right: string,
) {
  const leftBuffer = Buffer.from(left)
  const rightBuffer = Buffer.from(right)

  if (leftBuffer.length !== rightBuffer.length) {
    return false
  }

  return timingSafeEqual(
    leftBuffer,
    rightBuffer,
  )
}

function unauthorized(
  code: string,
  status: number,
) {
  return {
    ok: false as const,
    response: Response.json(
      {
        ok: false,
        error:
          status === 503
            ? 'Email OS worker authorization is not configured.'
            : 'Email OS worker authorization required.',
        code,
      },
      {
        status,
        headers: {
          'cache-control': 'no-store',
        },
      },
    ),
  }
}

export async function authorizeEmailOSWorkerRequest(
  request: Request,
): Promise<EmailOSWorkerAuthorization> {
  const expected = clean(
    process.env.EMAIL_OS_WORKER_SECRET,
  )

  const bearer = clean(
    request.headers.get('authorization'),
  )

  const bearerSecret = bearer
    .toLowerCase()
    .startsWith('bearer ')
      ? bearer.slice(7).trim()
      : ''

  const supplied =
    clean(
      request.headers.get(
        'x-angelcare-worker-secret',
      ),
    ) || bearerSecret

  if (
    expected &&
    supplied &&
    constantTimeEqual(
      supplied,
      expected,
    )
  ) {
    return {
      ok: true,
      source: 'secret',
    }
  }

  /*
   * Preserve authenticated internal UI / API flows such as the
   * existing queue retry alias. A public anonymous caller no longer
   * gets to activate the worker just because it knows the route.
   */
  try {
    const user = await getCurrentAppUser()

    if (user?.id) {
      return {
        ok: true,
        source: 'session',
      }
    }
  } catch {
    // Continue to the explicit production failure doctrine below.
  }

  if (
    process.env.NODE_ENV !== 'production' &&
    !expected
  ) {
    return {
      ok: true,
      source: 'development',
    }
  }

  if (!expected) {
    return unauthorized(
      'EMAIL_OS_WORKER_SECRET_MISSING',
      503,
    )
  }

  return unauthorized(
    'EMAIL_OS_WORKER_UNAUTHORIZED',
    401,
  )
}
