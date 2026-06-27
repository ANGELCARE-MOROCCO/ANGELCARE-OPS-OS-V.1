import { NextResponse } from 'next/server'
import { carelinkMobileErrorResponse, requireCareLinkMobileMissionAccess } from '@/lib/carelink/mobile-auth'
import { patchMission } from '@/lib/missions/repository'
import { completeMissionChecklist } from '@/lib/carelink/mobile-persistence'

export const dynamic = 'force-dynamic'

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params
    const missionId = Number(id)
    const session = await requireCareLinkMobileMissionAccess(missionId, 'can_submit_reports')
    const body = await request.json().catch(() => ({})) as { note?: string; checklist?: unknown; itemIds?: string[] }
    const checklist = await completeMissionChecklist(missionId, {
      itemIds: Array.isArray(body.itemIds) ? body.itemIds.map(String) : [],
      notes: body.note || undefined,
      caregiverId: session.caregiverId,
    })
    const mission = await patchMission(missionId, {
      report_status: 'pending',
      validation_status: 'ready',
      updated_at: new Date().toISOString(),
    })
    return NextResponse.json({ ok: true, data: { mission, checklist } })
  } catch (error) {
    return carelinkMobileErrorResponse(error, 'Checklist completion failed')
  }
}
