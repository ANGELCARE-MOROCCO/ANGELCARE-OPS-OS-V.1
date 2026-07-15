import { NextResponse } from 'next/server'
import { markDispatchMessageRead } from '@/lib/carelink/mobile-persistence'
import { recordMissionEvent } from '@/lib/missions/events'
import { carelinkMobileErrorResponse, requireCareLinkMobileLinkedRowAccess, requireCareLinkMobileMissionAccess } from '@/lib/carelink/mobile-auth'

export const dynamic = 'force-dynamic'

export async function POST(_request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params
    const body = await _request.json().catch(() => ({})) as { missionId?: number; note?: string }
    await requireCareLinkMobileLinkedRowAccess('carelink_dispatch_messages', id, 'can_view_missions')
    if (body.missionId) await requireCareLinkMobileMissionAccess(Number(body.missionId), 'can_view_missions')
    const data = await markDispatchMessageRead(id)
    if (body.missionId) {
      await recordMissionEvent({
        missionId: Number(body.missionId),
        eventType: 'message_read',
        content: body.note || `Message ${id} marqué comme lu depuis CareLink mobile`,
        metadata: { message_id: id },
        source: 'carelink_mobile',
      })
    }
    return NextResponse.json({ ok: true, data })
  } catch (error) {
    return carelinkMobileErrorResponse(error, 'Mark message read failed')
  }
}
