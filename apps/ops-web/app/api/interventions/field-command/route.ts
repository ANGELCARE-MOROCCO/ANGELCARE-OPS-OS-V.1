import { NextResponse } from 'next/server'
import { getInterventionsState } from '@/lib/interventions/repository'
import { buildPhase5ExecutionQueues, buildPhase5ContinuityScore, PHASE5_FIELD_COMMAND_CHECKS } from '@/lib/interventions/phase5-continuity'

export async function GET() {
  const state = await getInterventionsState()
  return NextResponse.json({
    ok: true,
    live: true,
    phase: 'mega-phase5-field-command',
    continuity: buildPhase5ContinuityScore(state),
    executionQueue: buildPhase5ExecutionQueues(state),
    blockingChecks: PHASE5_FIELD_COMMAND_CHECKS.filter(check => check.severity === 'bloquant'),
  })
}
