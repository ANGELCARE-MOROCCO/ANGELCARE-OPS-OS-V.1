import { NextResponse } from 'next/server'
import { patchMission } from '@/lib/missions/repository'
import { recordMissionEvent } from '@/lib/missions/events'
export const dynamic = 'force-dynamic'
export async function POST(request: Request, context: { params: Promise<{ id: string }> }) { try { const { id } = await context.params; const body = await request.json().catch(() => ({})); const data = await patchMission(Number(id), { status: 'cancelled', lifecycle_stage: 'cancelled', cancelled_at: new Date().toISOString() }); await recordMissionEvent({ missionId: Number(id), eventType: 'mission_cancelled', content: body.reason || 'Mission cancelled', metadata: body, source: 'mission_api' }); return NextResponse.json({ ok: true, data }) } catch (error) { return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : 'Cancellation failed' }, { status: 500 }) } }
