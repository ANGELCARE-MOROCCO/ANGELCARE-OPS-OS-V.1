import { NextResponse } from 'next/server'
import { getMissionDossier } from '@/lib/missions/repository'
import { carelinkMobileErrorResponse, requireCareLinkMobileMissionAccess } from '@/lib/carelink/mobile-auth'

export const dynamic = 'force-dynamic'

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params
    const missionId = Number(id)
    await requireCareLinkMobileMissionAccess(missionId, 'can_view_missions')
    const data = await getMissionDossier(missionId)
    if (!data) return NextResponse.json({ ok: false, error: 'Mission not found' }, { status: 404 })
    return NextResponse.json({ ok: true, data }, { headers: { 'Cache-Control': 'no-store' } })
  } catch (error) {
    return carelinkMobileErrorResponse(error, 'Mission loading failed')
  }
}
