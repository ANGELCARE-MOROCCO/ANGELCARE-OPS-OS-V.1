import { NextResponse } from 'next/server'
import { getSystemControlContext } from '../_shared'
import { loadLatestScanResult, loadPolicyEvents, runLocalAppScan } from '@/lib/system-control/policy'

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

    const [scan, policyEvents] = await Promise.all([
      loadLatestScanResult(context.supabase),
      loadPolicyEvents(context.supabase, 25),
    ])

    return NextResponse.json(
      {
        ok: true,
        connected: Boolean(scan),
        scan,
        policyEvents: policyEvents.events,
      },
      { headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' } },
    )
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        connected: false,
        scan: null,
        error: error instanceof Error ? error.message : 'Unable to load scan results',
      },
      {
        status: 500,
        headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' },
      },
    )
  }
}

export async function POST(request: Request) {
  try {
    const context = await getSystemControlContext()

    if (!context.authorized) {
      return NextResponse.json(
        { ok: false, error: 'System control access denied.' },
        { status: 403, headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' } },
      )
    }

    const body = await request.json().catch(() => ({})) as Record<string, unknown>
    const scanType = typeof body.scanType === 'string' && body.scanType.trim() ? String(body.scanType).trim() : 'local_app_scan'

    const result = await runLocalAppScan(context.supabase, context.actor, scanType)

    return NextResponse.json(
      {
        ok: true,
        ...result,
      },
      { headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' } },
    )
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        connected: false,
        scan: null,
        error: error instanceof Error ? error.message : 'Unable to run scan',
      },
      {
        status: 500,
        headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' },
      },
    )
  }
}
