import { NextResponse } from 'next/server'

import { getMissingSupabaseServerEnv } from '@/lib/supabase/env'
import { createServiceClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'
export const revalidate = 0
export const runtime = 'nodejs'

const TIMEOUT_MS = 5000

type CheckState = {
  ok: boolean
  status: 'ready' | 'unavailable'
}

type Checks = {
  configuration: CheckState
  supabaseAuth: CheckState
  supabaseDatabase: CheckState
}

function state(ok: boolean): CheckState {
  return {
    ok,
    status: ok ? 'ready' : 'unavailable',
  }
}

function readinessResponse(checks: Checks) {
  const ok =
    checks.configuration.ok &&
    checks.supabaseAuth.ok &&
    checks.supabaseDatabase.ok

  return NextResponse.json(
    {
      ok,
      status: ok ? 'ready' : 'not_ready',
      service: 'angelcare-saas-ops',
      timestamp: new Date().toISOString(),
      checks,
    },
    {
      status: ok ? 200 : 503,
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
        'X-AngelCare-Health': 'ready',
      },
    },
  )
}

async function withTimeout<T>(
  operation: PromiseLike<T>,
  timeoutMs: number,
): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined

  try {
    return await Promise.race([
      operation,
      new Promise<T>((_, reject) => {
        timer = setTimeout(
          () => reject(new Error('READINESS_TIMEOUT')),
          timeoutMs,
        )
      }),
    ])
  } finally {
    if (timer) clearTimeout(timer)
  }
}

async function probeSupabase() {
  const supabase = await createServiceClient()

  const [authResult, databaseResult] = await Promise.allSettled([
    withTimeout(
      supabase.auth.admin.listUsers({
        page: 1,
        perPage: 1,
      }),
      TIMEOUT_MS,
    ),

    withTimeout(
      supabase
        .from('revenue_os_signal_sources')
        .select('id')
        .limit(1),
      TIMEOUT_MS,
    ),
  ])

  const authOk =
    authResult.status === 'fulfilled' &&
    !authResult.value.error

  const databaseOk =
    databaseResult.status === 'fulfilled' &&
    !databaseResult.value.error

  return {
    authOk,
    databaseOk,
  }
}

export async function GET() {
  const missing = getMissingSupabaseServerEnv()

  const configuration = state(missing.length === 0)

  if (!configuration.ok) {
    return readinessResponse({
      configuration,
      supabaseAuth: state(false),
      supabaseDatabase: state(false),
    })
  }

  try {
    const { authOk, databaseOk } = await probeSupabase()

    return readinessResponse({
      configuration,
      supabaseAuth: state(authOk),
      supabaseDatabase: state(databaseOk),
    })
  } catch {
    return readinessResponse({
      configuration,
      supabaseAuth: state(false),
      supabaseDatabase: state(false),
    })
  }
}
