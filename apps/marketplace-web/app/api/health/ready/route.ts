import { NextResponse } from 'next/server'

import { getMissingSupabaseServerEnv, getSupabaseEnv } from '@/lib/supabase/env'

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
  const { url, serviceRoleKey } = getSupabaseEnv()

  if (!url || !serviceRoleKey) return false

  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS)

  try {
    const endpoint = `${url.replace(/\/+$/, '')}/rest/v1/`

    const result = await fetch(endpoint, {
      method: 'GET',
      headers: {
        apikey: serviceRoleKey,
        Authorization: `Bearer ${serviceRoleKey}`,
      },
      cache: 'no-store',
      signal: controller.signal,
    })

    if (result.body) {
      await result.body.cancel().catch(() => undefined)
    }

    return result.ok
  } catch {
    return false
  } finally {
    clearTimeout(timer)
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

  const supabase: ReadinessCheck = {
    ok: supabaseOk,
    status: supabaseOk ? 'ready' : 'unavailable',
  }

  return response(supabaseOk ? 200 : 503, {
    configuration,
    supabase,
  })
}
