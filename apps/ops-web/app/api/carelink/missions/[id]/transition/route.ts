import { NextResponse } from 'next/server'
import { carelinkMobileErrorResponse } from '@/lib/carelink/mobile-auth'
import { executeCareLinkMobileMissionAction, parseCareLinkMobileActionBody, type CareLinkMobileMissionAction } from '@/lib/carelink/mobile-action-engine'

export const dynamic = 'force-dynamic'

const TRANSITION_TO_ACTION: Record<string, CareLinkMobileMissionAction> = {
  agent_accepted: 'accept',
  accepted: 'accept',
  confirmed: 'confirm_readiness',
  readiness_confirmed: 'confirm_readiness',
  en_route: 'en_route',
  arrival_confirmed: 'arrive',
  arrived: 'arrive',
  checked_in: 'check_in',
  check_in: 'check_in',
  mission_started: 'start',
  in_progress: 'start',
  report_submitted: 'report_submit',
  completed: 'complete',
  incident: 'incident_report',
}

function normalize(value: unknown) {
  return String(value || '').trim().toLowerCase().replace(/-/g, '_')
}

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params
    const body = await parseCareLinkMobileActionBody(request)
    const requested = normalize(body.lifecycleStage || body.transition || body.action)
    const action = TRANSITION_TO_ACTION[requested]

    if (!action) {
      return NextResponse.json(
        { ok: false, error: 'Unsupported CareLink mobile transition.', code: 'carelink_mobile_transition_unknown', requested },
        { status: 400 },
      )
    }

    const result = await executeCareLinkMobileMissionAction({
      request,
      missionId: Number(id),
      action,
      body,
    })
    return NextResponse.json({ ok: true, ...result })
  } catch (error) {
    return carelinkMobileErrorResponse(error, 'Transition failed')
  }
}
