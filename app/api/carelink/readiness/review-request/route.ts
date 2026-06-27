import { NextResponse } from 'next/server'
import { requestDocumentReview } from '@/lib/carelink/mobile-persistence'
import { recordMissionEvent } from '@/lib/missions/events'
import { carelinkMobileErrorResponse, requireCareLinkMobileAgent, requireCareLinkMobileMissionAccess } from '@/lib/carelink/mobile-auth'

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({})) as {
      documentType?: string | null
      note?: string | null
      metadata?: Record<string, unknown>
      missionId?: number | null
    }
    const session = body.missionId
      ? await requireCareLinkMobileMissionAccess(Number(body.missionId), 'can_view_missions')
      : await requireCareLinkMobileAgent('can_view_missions')

    const document = await requestDocumentReview(session.caregiverId, { documentType: body.documentType || null, note: body.note || null, metadata: body.metadata || {} }).catch(() => null)

    if (body.missionId) {
      await recordMissionEvent({
        missionId: Number(body.missionId),
        eventType: 'profile_update_requested',
        content: body.note || 'Demande de revue readiness transmise depuis CareLink mobile',
        metadata: { document_type: body.documentType || null, ...body.metadata },
        source: 'carelink_mobile',
      })
    }

    return NextResponse.json({ ok: true, data: { document } })
  } catch (error) {
    return carelinkMobileErrorResponse(error, 'Readiness review request failed')
  }
}
