import { NextResponse } from 'next/server'
import { INTERVENTION_SEED_STATE } from '@/lib/interventions/seed'
import { PHASE6_CARE_COMPLIANCE_CONTROLS, PHASE6_CARE_PACKS, PHASE6_PATIENT_SAFETY_GATES, PHASE6_SHIFT_COMMANDS, buildPhase6CareContinuity, buildPhase6ConsentExposure, buildPhase6CriticalCareQueue, buildPhase6RoleScenarioCoverage } from '@/lib/interventions/phase6-care-command'

export async function GET() {
  const state = INTERVENTION_SEED_STATE
  return NextResponse.json({
    ok: true,
    live: true,
    phase: 'mega-phase6-care-command',
    generatedAt: new Date().toISOString(),
    careContinuity: buildPhase6CareContinuity(state),
    consentExposure: buildPhase6ConsentExposure(state),
    criticalCareQueue: buildPhase6CriticalCareQueue(state),
    roleScenarioCoverage: buildPhase6RoleScenarioCoverage(state),
    safetyGates: PHASE6_PATIENT_SAFETY_GATES,
    carePacks: PHASE6_CARE_PACKS,
    complianceControls: PHASE6_CARE_COMPLIANCE_CONTROLS,
    shiftCommands: PHASE6_SHIFT_COMMANDS,
  })
}
