export const phase4Data = {
  health: [],
  assignments: [],
  compliance: [],
  payouts: [],
  regional: [],
}

export function getAmbassadorPhase4Snapshot() {
  return {
    ok: true,
    source: "phase4-compat",
    data: phase4Data,
    health: [],
    assignments: [],
    compliance: [],
    payouts: [],
    regional: [],
  }
}

export async function loadPhase4OperationsSnapshot() {
  return getAmbassadorPhase4Snapshot()
}

export default phase4Data
