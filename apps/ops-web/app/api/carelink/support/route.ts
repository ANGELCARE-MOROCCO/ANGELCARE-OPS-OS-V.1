import { NextResponse } from 'next/server'
import { loadCarelinkMobileWorkspace } from '@/lib/carelink/mobile-adapter'
import { recordMissionEvent } from '@/lib/missions/events'
import { createNotification } from '@/lib/carelink/mobile-persistence'
import { carelinkMobileErrorResponse, requireCareLinkMobileAgent, requireCareLinkMobileMissionAccess } from '@/lib/carelink/mobile-auth'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const workspace = await loadCarelinkMobileWorkspace()
    return NextResponse.json({ ok: true, data: workspace.support })
  } catch (error) {
    return carelinkMobileErrorResponse(error, 'Load CareLink support failed')
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({})) as { missionId?: number; note?: string; category?: string; details?: Record<string, unknown> }
    if (body.missionId) {
      const session = await requireCareLinkMobileMissionAccess(Number(body.missionId), 'can_view_missions')
      await recordMissionEvent({
        missionId: Number(body.missionId),
        eventType: 'support_request_created',
        content: body.note || 'Demande de support créée depuis CareLink mobile',
        metadata: { category: body.category || null, details: body.details || null },
        source: 'carelink_mobile',
      })
      await createNotification({
        type: 'support',
        title: 'Demande de support',
        body: body.note || 'Une demande de support a été créée.',
        priority: 'high',
        missionId: Number(body.missionId),
        caregiverId: session.caregiverId,
        linkedEntityType: 'mission',
        linkedEntityId: String(body.missionId),
        metadata: { category: body.category || null, details: body.details || null },
      }).catch(() => null)
    } else {
      await requireCareLinkMobileAgent('can_view_missions')
    }
    return NextResponse.json({ ok: true, data: { created: true, ...body } })
  } catch (error) {
    return carelinkMobileErrorResponse(error, 'Support request failed')
  }
}
