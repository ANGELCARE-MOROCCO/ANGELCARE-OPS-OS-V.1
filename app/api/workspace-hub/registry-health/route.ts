import { NextResponse } from 'next/server'
import { requireUser } from '@/lib/auth/session'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const user = await requireUser()
    const supabase = await createClient()

    const [routes, modules, scans] = await Promise.all([
      supabase.from('access_route_registry').select('id', { count: 'exact', head: true }),
      supabase.from('access_module_registry').select('id', { count: 'exact', head: true }),
      supabase.from('access_scan_runs').select('id', { count: 'exact', head: true }),
    ])

    return NextResponse.json({
      ok: !routes.error && !modules.error,
      user: {
        username: user.username,
        role: user.role,
      },
      registry: {
        routes: {
          count: routes.count || 0,
          error: routes.error?.message || null,
        },
        modules: {
          count: modules.count || 0,
          error: modules.error?.message || null,
        },
        scans: {
          count: scans.count || 0,
          error: scans.error?.message || null,
        },
      },
    })
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : 'Registry health check failed.',
      },
      { status: 500 },
    )
  }
}
