import { NextResponse } from 'next/server'
import { carelinkMobileErrorResponse, requireCareLinkMobileMissionAccess } from '@/lib/carelink/mobile-auth'
import { executeCareLinkMobileMissionAction, parseCareLinkMobileActionBody } from '@/lib/carelink/mobile-action-engine'
import { evaluateCareLinkCompletionGates, firstCareLinkCompletionBlocker } from '@/lib/carelink/mobile-completion-gates'

export const dynamic = 'force-dynamic'

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params
    const missionId = Number(id)
    const session = await requireCareLinkMobileMissionAccess(missionId, 'can_submit_reports')
    const body = await parseCareLinkMobileActionBody(request)
    const gates = await evaluateCareLinkCompletionGates({
      missionId,
      caregiverId: session.caregiverId,
      mission: session.mission,
    })

    if (!gates.allowed) {
      const blocker = firstCareLinkCompletionBlocker(gates)
      return NextResponse.json(
        {
          ok: false,
          error: blocker?.message || 'Mission completion is blocked by CareLink readiness gates.',
          code: blocker?.code || 'carelink_completion_gate_blocked',
          gates,
        },
        { status: 409 },
      )
    }

    const result = await executeCareLinkMobileMissionAction({
      request,
      missionId,
      action: 'complete',
      body,
    })
    return NextResponse.json({ ok: true, ...result })
  } catch (error) {
    return carelinkMobileErrorResponse(error, 'Completion failed')
  }
}
