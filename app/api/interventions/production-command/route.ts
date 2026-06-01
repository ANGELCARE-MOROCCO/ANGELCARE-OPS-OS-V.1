import { NextResponse } from 'next/server'
import { INTERVENTION_SEED_STATE } from '@/lib/interventions/seed'
import { buildPhase4CommandAssurance, buildPhase4FinancialControl, buildPhase4StaffCoverage, buildPhase4WhiteOpsRows, PHASE4_PAGE_WAR_ROOMS, PHASE4_PRODUCTION_GATES, PHASE4_ROLE_HANDOFFS, PHASE4_PRINT_PACKS } from '@/lib/interventions/phase4-production'

export async function GET() {
  const state = INTERVENTION_SEED_STATE
  return NextResponse.json({
    ok: true,
    live: true,
    phase: 'mega-phase4-production-command',
    assurance: buildPhase4CommandAssurance(state),
    staffCoverage: buildPhase4StaffCoverage(state),
    finance: buildPhase4FinancialControl(state),
    gates: PHASE4_PRODUCTION_GATES,
    handoffs: PHASE4_ROLE_HANDOFFS,
    printPacks: PHASE4_PRINT_PACKS,
    pageWarRooms: PHASE4_PAGE_WAR_ROOMS,
    rows: buildPhase4WhiteOpsRows(state, 'command'),
  })
}
