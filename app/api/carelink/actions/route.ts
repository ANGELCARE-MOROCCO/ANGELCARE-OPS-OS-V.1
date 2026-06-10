import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}))
    const action = typeof body?.action === 'string' ? body.action : 'unknown_action'
    const entityId = typeof body?.entityId === 'string' ? body.entityId : null

    return NextResponse.json({
      ok: true,
      action,
      entityId,
      status: 'recorded',
      audit: {
        event: `carelink.ops.${action}`,
        entityId,
        createdAt: new Date().toISOString(),
      },
      message: 'CareLink Ops action recorded. Connect this route to Supabase repository persistence when live tables are ready.',
    })
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : 'Unknown CareLink Ops action error',
      },
      { status: 500 },
    )
  }
}
