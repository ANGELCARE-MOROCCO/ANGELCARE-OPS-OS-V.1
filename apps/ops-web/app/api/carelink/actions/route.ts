import { NextResponse } from 'next/server'
import { carelinkMobileErrorResponse, requireCareLinkMobileAgent, requireCareLinkMobileMissionAccess } from '@/lib/carelink/mobile-auth'

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}))
    const action = typeof body?.action === 'string' ? body.action : 'unknown_action'
    const entityId = typeof body?.entityId === 'string' ? body.entityId : null
    if (body?.missionId) await requireCareLinkMobileMissionAccess(Number(body.missionId), 'can_view_missions')
    else await requireCareLinkMobileAgent('can_view_missions')

    return NextResponse.json({
      ok: true,
      action,
      entityId,
      status: 'recorded',
      audit: { event: `carelink.mobile.${action}`, entityId, createdAt: new Date().toISOString() },
      message: 'CareLink mobile action accepted by authenticated agent guard.',
    })
  } catch (error) {
    return carelinkMobileErrorResponse(error, 'Unknown CareLink mobile action error')
  }
}
