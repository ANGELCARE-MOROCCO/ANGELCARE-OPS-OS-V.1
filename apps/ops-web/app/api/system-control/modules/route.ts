import { NextResponse } from 'next/server'
import { getSystemControlContext } from '../_shared'
import { getRegisteredModules } from '@/lib/system-control/policy'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET() {
  try {
    const context = await getSystemControlContext()

    if (!context.authorized) {
      return NextResponse.json(
        { ok: false, error: 'System control access denied.' },
        { status: 403, headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' } },
      )
    }

    const catalog = await getRegisteredModules(context.supabase)

    return NextResponse.json(
      {
        ok: true,
        connected: catalog.connected,
        modules: catalog.modules.map(({ module, policy }) => ({
          ...module,
          policy,
        })),
      },
      { headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' } },
    )
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        connected: false,
        modules: [],
        error: error instanceof Error ? error.message : 'Unable to load runtime modules',
      },
      {
        status: 500,
        headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' },
      },
    )
  }
}

