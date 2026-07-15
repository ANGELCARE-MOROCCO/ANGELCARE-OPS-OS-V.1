import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

const allowedStatuses = new Set([
  'unassigned',
  'assigned',
  'accepted',
  'en_route',
  'in_progress',
  'report_pending',
  'validation',
  'at_risk',
  'completed',
])

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}))
    const missionId = Number(body?.missionId)
    const status = String(body?.status || '').trim()

    if (!Number.isSafeInteger(missionId) || missionId <= 0) {
      return NextResponse.json({ ok: false, error: 'Invalid mission id.' }, { status: 400 })
    }

    if (!allowedStatuses.has(status)) {
      return NextResponse.json({ ok: false, error: 'Invalid dispatch status.' }, { status: 400 })
    }

    const supabase = await createClient()

    const patch = {
      status,
      lifecycle_stage: status,
      dispatch_status: status,
      updated_at: new Date().toISOString(),
    }

    const { data, error } = await supabase
      .from('missions')
      .update(patch)
      .eq('id', missionId)
      .select('*')
      .maybeSingle()

    if (error) throw new Error(error.message)

    return NextResponse.json(
      { ok: true, data },
      { headers: { 'Cache-Control': 'no-store' } },
    )
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : 'Dispatch action failed.' },
      { status: 500, headers: { 'Cache-Control': 'no-store' } },
    )
  }
}
