import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}))
    const action = typeof body?.action === 'string' ? body.action : 'unknown'
    const entityId = typeof body?.entityId === 'string' ? body.entityId : null

    return NextResponse.json(
      {
        ok: true,
        action,
        entityId,
        mode: 'ui_action_acknowledged',
        message: 'Action received by CareLink Ops. Bind this endpoint to live database workflow for persistent backend changes.',
        recordedAt: new Date(0).toISOString(),
      },
      { headers: { 'Cache-Control': 'no-store' } },
    )
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : 'Unknown action error' },
      { status: 500, headers: { 'Cache-Control': 'no-store' } },
    )
  }
}
