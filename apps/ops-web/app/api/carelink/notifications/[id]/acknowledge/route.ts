import { NextResponse } from 'next/server'
import { acknowledgeNotification } from '@/lib/carelink/mobile-persistence'
import { carelinkMobileErrorResponse, requireCareLinkMobileLinkedRowAccess, requireCareLinkMobileMissionAccess } from '@/lib/carelink/mobile-auth'

export const dynamic = 'force-dynamic'

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params
    const body = await request.json().catch(() => ({})) as { missionId?: number; note?: string }
    await requireCareLinkMobileLinkedRowAccess('carelink_notifications', id, 'can_view_missions')
    if (body.missionId) await requireCareLinkMobileMissionAccess(Number(body.missionId), 'can_view_missions')
    const data = await acknowledgeNotification(id, body.missionId ? Number(body.missionId) : null, body.note || null)
    return NextResponse.json({ ok: true, acknowledged: true, data })
  } catch (error) {
    return carelinkMobileErrorResponse(error, 'Notification acknowledgement failed')
  }
}
