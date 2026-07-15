import { NextResponse } from 'next/server'
import { deleteMission, updateMission } from '../../../../../../../lib/carelink/ops-dispatch-repository'

export const dynamic = 'force-dynamic'

type RouteContext = { params: Promise<{ id: string }> | { id: string } }

async function getId(context: RouteContext) {
  const params = await context.params
  return String(params.id)
}

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const id = await getId(context)
    const body = await request.json()
    const result = await updateMission(id, body || {})
    return NextResponse.json(result, { status: result.ok ? 200 : 400, headers: { 'Cache-Control': 'no-store' } })
  } catch (error) {
    return NextResponse.json(
      { ok: false, action: 'update_mission', message: 'Invalid mission update request.', error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 400, headers: { 'Cache-Control': 'no-store' } },
    )
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  try {
    const id = await getId(context)
    const result = await deleteMission(id)
    return NextResponse.json(result, { status: result.ok ? 200 : 400, headers: { 'Cache-Control': 'no-store' } })
  } catch (error) {
    return NextResponse.json(
      { ok: false, action: 'delete_mission', message: 'Invalid mission delete request.', error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 400, headers: { 'Cache-Control': 'no-store' } },
    )
  }
}
