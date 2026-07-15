import { NextResponse } from 'next/server'
import { getCareLinkOpsDispatchPayload } from '../../../../../../lib/carelink/ops-dispatch-repository'
import { runCareLinkDispatchWorkspaceAction } from '../../../../../../lib/carelink/ops-dispatch-workspace-crud'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET() {
  const payload = await getCareLinkOpsDispatchPayload()
  return NextResponse.json({ ok: true, source: payload.source, generatedAt: payload.generatedAt, data: payload.communications }, { headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' } })
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}))
  const result = await runCareLinkDispatchWorkspaceAction({ action: 'create_communication', payload: body })
  return NextResponse.json(result, { status: result.ok ? 200 : 400, headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' } })
}
