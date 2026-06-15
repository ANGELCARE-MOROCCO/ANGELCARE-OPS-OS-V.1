import { NextResponse } from 'next/server'
import { loadCarelinkMobileWorkspace } from '@/lib/carelink/mobile-adapter'
import { recordMissionEvent } from '@/lib/missions/events'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const workspace = await loadCarelinkMobileWorkspace()
    return NextResponse.json({
      ok: true,
      data: {
        status: workspace.readiness.status === 'blocked' ? 'unavailable' : 'available',
        blocks: workspace.schedule.map((item) => ({ day: item.date, missions: item.missions.length })),
        readiness: workspace.readiness,
        stats: workspace.stats,
      },
    })
  } catch (error) {
    return NextResponse.json({ ok: false, data: { status: 'unavailable', blocks: [] }, error: error instanceof Error ? error.message : 'Load availability failed' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({})) as { missionId?: number; note?: string; availability?: string }
    if (body.missionId) {
      await recordMissionEvent({
        missionId: Number(body.missionId),
        eventType: 'availability_updated',
        content: body.note || 'Disponibilité mise à jour depuis CareLink mobile',
        metadata: { availability: body.availability || null },
        source: 'carelink_mobile',
      })
    }
    return NextResponse.json({ ok: true, data: { saved: true, ...body } })
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : 'Availability update failed' }, { status: 500 })
  }
}
