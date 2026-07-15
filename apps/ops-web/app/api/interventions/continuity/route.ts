import { NextResponse } from 'next/server'
import { INTERVENTION_SEED_STATE } from '@/lib/interventions/seed'
import { buildPhase5BillingExposure, buildPhase5ContinuityScore, buildPhase5EquipmentContinuity, buildPhase5ExecutionQueues, buildPhase5RoleLocks, PHASE5_ESCALATION_TIERS, PHASE5_FIELD_COMMAND_CHECKS, PHASE5_HANDOVER_PROTOCOLS, PHASE5_PRODUCTION_CONTINUITY } from '@/lib/interventions/phase5-continuity'

export async function GET() {
  const state = INTERVENTION_SEED_STATE
  return NextResponse.json({
    ok: true,
    live: true,
    phase: 'mega-phase5-production-continuity',
    continuity: buildPhase5ContinuityScore(state),
    queues: buildPhase5ExecutionQueues(state),
    roleLocks: buildPhase5RoleLocks(state),
    billing: buildPhase5BillingExposure(state),
    equipment: buildPhase5EquipmentContinuity(state),
    checks: PHASE5_FIELD_COMMAND_CHECKS,
    handovers: PHASE5_HANDOVER_PROTOCOLS,
    escalationTiers: PHASE5_ESCALATION_TIERS,
    pageContinuity: PHASE5_PRODUCTION_CONTINUITY,
  })
}
