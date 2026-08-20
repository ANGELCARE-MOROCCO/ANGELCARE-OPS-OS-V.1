import { NextResponse } from 'next/server'

import { getMissingSupabaseServerEnv } from '@/lib/supabase/env'
import { createServiceClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'
export const revalidate = 0
export const runtime = 'nodejs'

const TIMEOUT_MS = 3000

type ReadinessCheck = {
  ok: boolean
  status: 'ready' | 'unavailable'
}

function response(
  status: 200 | 503,
  checks: {
    configuration: ReadinessCheck
    supabase: ReadinessCheck
  },
) {
  return NextResponse.json(
    {
      ok: status === 200,
      status: status === 200 ? 'ready' : 'not_ready',
      service: 'angelcare-marketplace',
      timestamp: new Date().toISOString(),
      checks,
    },
    {
      status,
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
        'X-AngelCare-Health': 'ready',
      },
    },
  )
}

async function probeSupabase(): Promise<boolean> {
  let timer: ReturnType<typeof setTimeout> | undefined

  try {
    const probe = (async () => {
      const supabase = await createServiceClient()

      const { error } = await supabase
        .from('angelcare_marketplace_territories')
        .select('id')
        .limit(1)

      return !error
    })()

    const timeout = new Promise<boolean>((resolve) => {
      timer = setTimeout(() => resolve(false), TIMEOUT_MS)
    })

    return await Promise.race([probe, timeout])
  } catch {
    return false
  } finally {
    if (timer) clearTimeout(timer)
  }
}

export async function GET() {
  const missing = getMissingSupabaseServerEnv()

  const configuration: ReadinessCheck = {
    ok: missing.length === 0,
    status: missing.length === 0 ? 'ready' : 'unavailable',
  }

  if (!configuration.ok) {
    return response(503, {
      configuration,
      supabase: {
        ok: false,
        status: 'unavailable',
      },
    })
  }

  const supabaseOk = await probeSupabase()

  return response(supabaseOk ? 200 : 503, {
    configuration,
    supabase: {
      ok: supabaseOk,
      status: supabaseOk ? 'ready' : 'unavailable',
    },
  })
}
