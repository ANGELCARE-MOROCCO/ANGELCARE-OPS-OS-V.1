import { timingSafeEqual } from 'node:crypto'

import { getCurrentAppUser } from '@/lib/auth/session'

const ELEVATED_ROLES = new Set([
  'ceo',
  'owner',
  'admin',
  'super_admin',
  'direction',
  'operations',
  'operations_director',
])

function clean(value: unknown) {
  return String(value || '')
    .trim()
}

function lower(value: unknown) {
  return clean(value).toLowerCase()
}

function safeEqual(
  left: string,
  right: string,
) {
  const a = Buffer.from(left)
  const b = Buffer.from(right)

  return (
    a.length === b.length &&
    timingSafeEqual(a, b)
  )
}

export async function requirePerformanceOperator() {
  const user = await getCurrentAppUser()

  if (!user?.id) {
    return {
      ok: false as const,
      response: Response.json(
        {
          ok: false,
          error: 'Unauthorized',
        },
        {
          status: 401,
          headers: {
            'cache-control': 'no-store',
          },
        },
      ),
    }
  }

  const role = lower(
    (user as any).role_key ||
      (user as any).role,
  )

  const permissions = Array.isArray(
    (user as any).permissions,
  )
    ? (user as any).permissions.map(String)
    : []

  if (
    ELEVATED_ROLES.has(role) ||
    permissions.includes('*') ||
    permissions.includes(
      'opsos.performance.view',
    )
  ) {
    return {
      ok: true as const,
      user,
    }
  }

  return {
    ok: false as const,
    response: Response.json(
      {
        ok: false,
        error:
          'OpsOS performance access denied.',
      },
      {
        status: 403,
        headers: {
          'cache-control': 'no-store',
        },
      },
    ),
  }
}

export function authorizeGovernorSyntheticRequest(
  request: Request,
) {
  const expected = clean(
    process.env.OPS_GOVERNOR_TEST_SECRET,
  )

  const supplied = clean(
    request.headers.get(
      'x-angelcare-governor-test-secret',
    ),
  )

  if (
    expected &&
    supplied &&
    safeEqual(expected, supplied)
  ) {
    return true
  }

  return (
    process.env.NODE_ENV !== 'production' &&
    !expected
  )
}
