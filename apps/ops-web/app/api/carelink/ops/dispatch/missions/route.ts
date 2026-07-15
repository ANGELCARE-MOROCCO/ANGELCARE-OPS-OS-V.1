import { NextResponse } from 'next/server'
import { createMission, getCareLinkOpsDispatchPayload } from '../../../../../../lib/carelink/ops-dispatch-repository'

export const dynamic = 'force-dynamic'

export async function GET() {
  const payload = await getCareLinkOpsDispatchPayload()
  return NextResponse.json({ ok: true, missions: payload.missions }, { headers: { 'Cache-Control': 'no-store' } })
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const result = await createMission(body || {})
    return NextResponse.json(result, { status: result.ok ? 200 : 400, headers: { 'Cache-Control': 'no-store' } })
  } catch (error) {
    return NextResponse.json(
      { ok: false, action: 'create_mission', message: 'Invalid mission create request.', error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 400, headers: { 'Cache-Control': 'no-store' } },
    )
  }
}
