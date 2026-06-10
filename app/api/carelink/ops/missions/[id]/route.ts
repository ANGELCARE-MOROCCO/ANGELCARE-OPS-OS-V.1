import { NextResponse } from 'next/server'
import { runMissionAction } from '../../../../../../lib/carelink/ops-missions-repository'

export const dynamic = 'force-dynamic'
export const revalidate = 0

type Context = { params: Promise<{ id: string }> | { id: string } }

async function readId(context: Context) {
  const params = await context.params
  return params.id
}

export async function PATCH(request: Request, context: Context) {
  const id = await readId(context)
  const payload = await request.json()
  const result = await runMissionAction({ action: 'update_mission', missionId: id, payload })
  return NextResponse.json(result, { status: result.ok ? 200 : 400, headers: { 'Cache-Control': 'no-store' } })
}

export async function DELETE(_request: Request, context: Context) {
  const id = await readId(context)
  const result = await runMissionAction({ action: 'delete_mission', missionId: id })
  return NextResponse.json(result, { status: result.ok ? 200 : 400, headers: { 'Cache-Control': 'no-store' } })
}
