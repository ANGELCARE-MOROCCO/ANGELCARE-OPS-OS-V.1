import { NextResponse } from 'next/server'
import { patchMission } from '@/lib/missions/repository'
import { recordMissionEvent } from '@/lib/missions/events'
export const dynamic = 'force-dynamic'
export async function POST(request: Request, context: { params: Promise<{ id: string }> }) { try { const { id } = await context.params; const body = await request.json().catch(() => ({})); const data = await patchMission(Number(id), { status: 'incident', lifecycle_stage: 'incident', risk_level: body.severity || 'elevated', incident_at: new Date().toISOString() }); await recordMissionEvent({ missionId: Number(id), eventType: 'incident_declared', content: body.note || 'Incident declared', metadata: body, source: 'mission_api' }); return NextResponse.json({ ok: true, data }) } catch (error) { return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : 'Incident declaration failed' }, { status: 500 }) } }
