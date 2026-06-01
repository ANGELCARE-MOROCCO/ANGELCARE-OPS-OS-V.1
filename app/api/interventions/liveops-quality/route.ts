import { NextResponse } from 'next/server'
import { INTERVENTION_SEED_STATE } from '@/lib/interventions/seed'
import { PHASE8_ADOPTION_ROLLOUTS, PHASE8_LIVEOPS_COMMANDS, PHASE8_NOTIFICATION_RUNBOOKS, PHASE8_QUALITY_GATES, buildPhase8LiveOpsQueue, buildPhase8PatientExperience, buildPhase8QualityScore, buildPhase8RunbookCoverage, buildPhase8StaffAdoption } from '@/lib/interventions/phase8-quality-liveops'

export async function GET() {
  const state = INTERVENTION_SEED_STATE
  return NextResponse.json({
    ok: true,
    live: true,
    module: 'AngelCare Intervention & Dispatch OS',
    phase: 'mega-phase-8-quality-liveops-adoption',
    generatedAt: new Date().toISOString(),
    qualityScore: buildPhase8QualityScore(state),
    liveOpsQueue: buildPhase8LiveOpsQueue(state),
    staffAdoption: buildPhase8StaffAdoption(state),
    patientExperience: buildPhase8PatientExperience(state),
    runbookCoverage: buildPhase8RunbookCoverage(state),
    notificationRunbooks: PHASE8_NOTIFICATION_RUNBOOKS,
    qualityGates: PHASE8_QUALITY_GATES,
    adoptionRollouts: PHASE8_ADOPTION_ROLLOUTS,
    pageCommands: PHASE8_LIVEOPS_COMMANDS,
  })
}
