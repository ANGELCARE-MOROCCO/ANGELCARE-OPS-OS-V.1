import { NextResponse } from "next/server"

const EMPTY_OPERATIONS = {
  recruitment: [],
  onboarding: [],
  training: [],
  goals: [],
  incentives: [],
  missions: [],
  territories: [],
  reports: [],
  audit: [],
  settings: {},
}

export async function GET() {
  return NextResponse.json({
    ok: true,
    source: "ambassador-operations-compat",
    data: EMPTY_OPERATIONS,
    operations: EMPTY_OPERATIONS,
    loadedAt: new Date().toISOString(),
  })
}

export async function POST(request: Request) {
  const payload = await request.json().catch(() => ({}))

  return NextResponse.json({
    ok: true,
    source: "ambassador-operations-compat",
    payload,
    data: EMPTY_OPERATIONS,
    loadedAt: new Date().toISOString(),
  })
}
