import { NextResponse } from "next/server"

function emptyAmbassadorSnapshot() {
  return {
    records: [],
    ambassadors: [],
    archivedRecords: [],
    goals: [],
    missions: [],
    incentives: [],
    onboarding: [],
    recruitment: [],
    territories: [],
    training: [],
    audit: [],
    reports: [],
    settings: {},
    stats: {},
    kpis: {
      totalAmbassadors: 0,
      activeAmbassadors: 0,
      suspendedAmbassadors: 0,
      territoryCoverage: 0,
      assignedTerritories: 0,
      missionsAssigned: 0,
      missionsCompleted: 0,
      onboardingCompletion: 0,
      recruitmentPipeline: 0,
      trainingCompletion: 0,
      certificationValidity: 0,
      kpiCompletion: 0,
      incentivesPaid: 0,
      incentivesPending: 0,
    },
    activity: [],
    updatedAt: new Date().toISOString(),
  }
}

export async function GET() {
  const snapshot = emptyAmbassadorSnapshot()

  return NextResponse.json({
    ok: true,
    source: "ambassador-runtime-compat",
    snapshot,
    data: snapshot,
  })
}

export async function POST(request: Request) {
  const payload = await request.json().catch(() => ({}))
  const snapshot = emptyAmbassadorSnapshot()

  return NextResponse.json({
    ok: true,
    source: "ambassador-runtime-compat",
    action: "create",
    payload,
    record: {
      id: payload?.id || `amb_${Date.now()}`,
      ...payload,
      created_at: new Date().toISOString(),
    },
    snapshot,
    data: snapshot,
  })
}
