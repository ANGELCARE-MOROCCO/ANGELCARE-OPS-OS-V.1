import { NextResponse } from 'next/server'
import { runCareLinkDispatchWorkspaceAction } from '../../../../../../lib/carelink/ops-dispatch-workspace-crud'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}))
    const result = await runCareLinkDispatchWorkspaceAction(body)
    return NextResponse.json(result, {
      status: result.ok ? 200 : 400,
      headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' },
    })
  } catch (error) {
    return NextResponse.json(
      { ok: false, action: 'workspace_action', message: 'Workspace action failed.', error: error instanceof Error ? error.message : 'Unknown CareLink Ops action error' },
      { status: 500, headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' } },
    )
  }
}
