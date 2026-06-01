import { NextResponse } from 'next/server'
import { getInterventionsState } from '@/lib/interventions/repository'
import { buildProductionReadiness, buildSlaPressureRows, PAGE_CONTROL_ROOMS, PHASE3_EXECUTION_LAYERS } from '@/lib/interventions/phase3-execution'

export async function GET() {
  const state = await getInterventionsState()
  return NextResponse.json({
    ok: true,
    generatedAt: new Date().toISOString(),
    syncMode: state.syncMode,
    readiness: buildProductionReadiness(state),
    slaPressure: buildSlaPressureRows(state),
    executionLayers: PHASE3_EXECUTION_LAYERS,
    controlRooms: PAGE_CONTROL_ROOMS,
  })
}
