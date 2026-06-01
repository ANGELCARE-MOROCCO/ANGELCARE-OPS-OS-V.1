import { NextRequest, NextResponse } from 'next/server'
import { buildHRDomainLiveState } from '@/lib/hr-production/live-sync'
import { logHRActivity } from '@/lib/hr-production/repository'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    return NextResponse.json(await buildHRDomainLiveState('leave'), { headers: { 'Cache-Control': 'no-store' } })
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: error?.message || 'Unable to load Leave requests state.' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}))
    const action = String(body?.action || 'leave.review')
    const confirmed = body?.confirmed === true
    await logHRActivity({
      action: 'hr.leave.action_requested',
      entity_type: 'hr_domain_action',
      entity_id: 'leave',
      module: 'hr',
      source: 'Leave requests endpoint',
      status: confirmed ? 'accepted_for_safe_processing' : 'gated_requires_confirmation',
      severity: confirmed ? 'info' : 'warning',
      payload: { action, confirmed, body },
      reason: confirmed ? 'Confirmed domain action was routed through safe HR endpoint.' : 'Mutation was gated; call again with confirmed=true only after UI confirmation and impact review.',
    })
    const state = await buildHRDomainLiveState('leave')
    return NextResponse.json({
      ok: true,
      endpoint: '/api/hr/leave',
      domain: 'leave',
      action,
      confirmed,
      mutationApplied: false,
      message: confirmed ? 'Leave requests action accepted for safe non-destructive processing/audit. Destructive mutation remains disabled here.' : 'Leave requests action requires explicit confirmation. No mutation applied.',
      state,
    }, { headers: { 'Cache-Control': 'no-store' } })
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: error?.message || 'Unable to process Leave requests action.' }, { status: 500 })
  }
}
