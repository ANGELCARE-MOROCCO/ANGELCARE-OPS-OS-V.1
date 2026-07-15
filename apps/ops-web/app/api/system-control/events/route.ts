import { NextResponse } from 'next/server'
import { listRuntimeEvents } from '@/lib/system-control/runtime'
import { getSystemControlContext } from '../_shared'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET(request: Request) {
  try {
    const context = await getSystemControlContext()

    if (!context.authorized) {
      return NextResponse.json(
        { ok: false, error: 'System control access denied.' },
        { status: 403, headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' } },
      )
    }

    const url = new URL(request.url)
    const limit = Math.max(1, Math.min(200, Number(url.searchParams.get('limit') || 100)))
    const events = await listRuntimeEvents(context.supabase, limit)

    return NextResponse.json(
      {
        ok: true,
        data: events,
        state: context.state,
      },
      { headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' } },
    )
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : 'Unable to load runtime events',
      },
      {
        status: 500,
        headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' },
      },
    )
  }
}
