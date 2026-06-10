import { NextResponse } from 'next/server'
import { recordMissionEvent } from '@/lib/missions/events'
export const dynamic = 'force-dynamic'
export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  try { const { id } = await context.params; const body = await request.json().catch(() => ({})); await recordMissionEvent({ missionId: Number(id), eventType: 'bulk_reschedule_requested', content: 'Bulk reschedule requested', metadata: body, source: 'mission_api' }); return NextResponse.json({ ok: true, status: 'recorded' }) }
  catch (error) { return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : 'Bulk reschedule failed' }, { status: 500 }) }
}
