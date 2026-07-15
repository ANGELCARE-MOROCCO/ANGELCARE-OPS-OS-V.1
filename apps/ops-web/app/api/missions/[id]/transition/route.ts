import { NextResponse } from 'next/server'
import { patchMission } from '@/lib/missions/repository'
import { canTransitionMission, lifecycleToLegacyStatus, normalizeLifecycle, timestampPatchForStage } from '@/lib/missions/lifecycle'
import { recordMissionEvent } from '@/lib/missions/events'
import type { MissionLifecycleStage } from '@/lib/missions/types'
export const dynamic = 'force-dynamic'
export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params
    const body = await request.json().catch(() => ({}))
    const next = normalizeLifecycle(String(body.lifecycleStage || body.transition || ''))
    const current = body.currentStage ? String(body.currentStage) : null
    if (current && !canTransitionMission(current, next)) return NextResponse.json({ ok: false, error: `Transition ${current} -> ${next} blocked` }, { status: 409 })
    const patch = { lifecycle_stage: next, status: lifecycleToLegacyStatus(next), ...timestampPatchForStage(next as MissionLifecycleStage) }
    const data = await patchMission(Number(id), patch)
    await recordMissionEvent({ missionId: Number(id), eventType: `mission_transition_${next}`, content: body.note || `Mission transitioned to ${next}`, metadata: { from: current, to: next }, source: 'mission_api' })
    return NextResponse.json({ ok: true, data })
  } catch (error) { return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : 'Transition failed' }, { status: 500 }) }
}
