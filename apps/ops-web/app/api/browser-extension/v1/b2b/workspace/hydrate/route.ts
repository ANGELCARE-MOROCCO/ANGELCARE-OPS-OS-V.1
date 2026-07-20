import { NextRequest, NextResponse } from 'next/server'
import { authenticateExtensionRequest } from '@/lib/browser-extension/runtime'
import { authorizeB2BIntelligenceCommand } from '@/lib/browser-extension/b2b-intelligence/authorization'
import { hydrateB2BWorkspace } from '@/lib/browser-extension/b2b-workspace/service'
import { writeExtensionAudit } from '@/lib/browser-extension/audit'

export async function POST(req: NextRequest) {
  const auth = await authenticateExtensionRequest(req)
  if (!auth.ok) return auth.response
  const body = await req.json().catch(() => ({}))
  const prospectId = String(body?.prospectId || '')
  const opportunityId = body?.opportunityId ? String(body.opportunityId) : null
  if (!prospectId) return NextResponse.json({ ok: false, error: 'PROSPECT_ID_REQUIRED' }, { status: 400 })
  const decision = await authorizeB2BIntelligenceCommand(auth.db, auth.context.user.id, {
    commandKey: 'b2b.account.recognize',
    sourceAdapter: null,
  })
  if (!decision.ok) return NextResponse.json({ ok: false, error: decision.error }, { status: decision.status })
  try {
    const workspace = await hydrateB2BWorkspace({
      db: auth.db,
      actor: auth.context.user,
      access: decision.access,
      prospectId,
      opportunityId,
    })
    await writeExtensionAudit(auth.db, {
      actor: auth.context.user,
      deviceId: auth.context.device.id,
      eventType: 'b2b_workspace_hydrated',
      moduleKey: 'revenue_b2b',
      commandKey: 'b2b.workspace.hydrate',
      targetType: 'prospect',
      targetId: prospectId,
      result: 'ok',
      metadata: { opportunityId, refreshedAt: workspace.refreshedAt },
    })
    return NextResponse.json({ ok: true, workspace })
  } catch (error: any) {
    return NextResponse.json({
      ok: false,
      error: String(error?.message || 'B2B_WORKSPACE_HYDRATION_FAILED'),
    }, { status: Number(error?.status || 500) })
  }
}
