import { NextResponse } from 'next/server'
import { patchMission } from '@/lib/missions/repository'
import { completeMissionChecklist } from '@/lib/carelink/mobile-persistence'

export const dynamic = 'force-dynamic'

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params
    const body = await request.json().catch(() => ({})) as { note?: string; checklist?: unknown; itemIds?: string[] }
    const missionId = Number(id)
    const checklist = await completeMissionChecklist(missionId, { itemIds: Array.isArray(body.itemIds) ? body.itemIds.map(String) : [], notes: body.note || undefined })
    const mission = await patchMission(missionId, {
      report_status: 'pending',
      validation_status: 'ready',
      updated_at: new Date().toISOString(),
    })
    return NextResponse.json({ ok: true, data: { mission, checklist } })
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : 'Checklist completion failed' }, { status: 500 })
  }
}
