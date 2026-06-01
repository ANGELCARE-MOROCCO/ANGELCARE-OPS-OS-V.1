import { NextResponse } from 'next/server'
import { INTERVENTION_SEED_STATE } from '@/lib/interventions/seed'
import { PHASE11_EVIDENCE_GATES, PHASE11_FIELD_EXECUTION_COMMANDS, PHASE11_FIELD_PRINT_AND_HANDOFF_PACKS, PHASE11_MOBILE_FIELD_RUNBOOKS, buildPhase11FieldProofScore, buildPhase11MobileExecutionQueue, buildPhase11OfflineFallbackControls, buildPhase11StaffMobileReadiness } from '@/lib/interventions/phase11-field-execution'

export async function GET() {
  const state = INTERVENTION_SEED_STATE
  return NextResponse.json({
    ok: true,
    live: true,
    module: 'AngelCare Intervention & Dispatch OS',
    phase: 'mega-phase-11-field-execution-proof',
    generatedAt: new Date().toISOString(),
    fieldProofScore: buildPhase11FieldProofScore(state),
    mobileExecutionQueue: buildPhase11MobileExecutionQueue(state),
    staffMobileReadiness: buildPhase11StaffMobileReadiness(state),
    offlineFallbackControls: buildPhase11OfflineFallbackControls(state),
    fieldCommands: PHASE11_FIELD_EXECUTION_COMMANDS,
    mobileRunbooks: PHASE11_MOBILE_FIELD_RUNBOOKS,
    evidenceGates: PHASE11_EVIDENCE_GATES,
    printAndHandoffPacks: PHASE11_FIELD_PRINT_AND_HANDOFF_PACKS,
  })
}
