import { NextRequest, NextResponse } from 'next/server'
import { buildHRDomainLiveState } from '@/lib/hr-production/live-sync'
import { logHRActivity } from '@/lib/hr-production/repository'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    return NextResponse.json(await buildHRDomainLiveState('payroll'), { headers: { 'Cache-Control': 'no-store' } })
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: error?.message || 'Unable to load Payroll readiness state.' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}))
    const action = String(body?.action || 'payroll.review')
    const confirmed = body?.confirmed === true
    await logHRActivity({
      action: 'hr.payroll.action_requested',
      entity_type: 'hr_domain_action',
      entity_id: 'payroll',
      module: 'hr',
      source: 'Payroll readiness endpoint',
      status: confirmed ? 'accepted_for_safe_processing' : 'gated_requires_confirmation',
      severity: confirmed ? 'info' : 'warning',
      payload: { action, confirmed, body },
      reason: confirmed ? 'Confirmed domain action was routed through safe HR endpoint.' : 'Mutation was gated; call again with confirmed=true only after UI confirmation and impact review.',
    })
    const state = await buildHRDomainLiveState('payroll')
    return NextResponse.json({
      ok: true,
      endpoint: '/api/hr/payroll',
      domain: 'payroll',
      action,
      confirmed,
      mutationApplied: false,
      message: confirmed ? 'Payroll readiness action accepted for safe non-destructive processing/audit. Destructive mutation remains disabled here.' : 'Payroll readiness action requires explicit confirmation. No mutation applied.',
      state,
    }, { headers: { 'Cache-Control': 'no-store' } })
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: error?.message || 'Unable to process Payroll readiness action.' }, { status: 500 })
  }
}
