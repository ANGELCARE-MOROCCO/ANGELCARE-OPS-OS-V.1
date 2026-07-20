import { NextRequest, NextResponse } from 'next/server'
import { authenticateExtensionRequest } from '@/lib/browser-extension/runtime'
import { authorizePartnerWorkspaceHydration } from '@/lib/browser-extension/b2b-partner-lifecycle/authorization'
import { hydrateB2BPartnerWorkspace } from '@/lib/browser-extension/b2b-partner-lifecycle/workspace'
import { writeExtensionAudit } from '@/lib/browser-extension/audit'

export async function POST(req: NextRequest) {
  const auth = await authenticateExtensionRequest(req)
  if (!auth.ok) return auth.response
  const body = await req.json().catch(() => ({}))
  if (!body.partnerId && !body.prospectId) return NextResponse.json({ ok: false, error: 'PARTNER_OR_PROSPECT_ID_REQUIRED' }, { status: 400 })
  const decision = await authorizePartnerWorkspaceHydration(auth.db, auth.context.user.id)
  if (!decision.ok) return NextResponse.json({ ok: false, error: decision.error }, { status: decision.status })
  try {
    const workspace = await hydrateB2BPartnerWorkspace({ db: auth.db, actor: auth.context.user, access: decision.access, partnerId: body.partnerId || null, prospectId: body.prospectId || null, activeIds: body.activeIds || {} })
    await writeExtensionAudit(auth.db, { actor: auth.context.user, deviceId: auth.context.device.id, eventType: 'partner_360_hydrated', moduleKey: 'revenue_b2b', commandKey: 'b2b.partner.workspace.hydrate', targetType: 'partner', targetId: workspace.partner?.id || null, result: 'ok', metadata: { prospectId: body.prospectId || null, refreshedAt: workspace.refreshedAt } })
    return NextResponse.json({ ok: true, workspace })
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: String(error?.message || 'PARTNER_360_HYDRATION_FAILED'), details: error?.details || null }, { status: Number(error?.status || 500) })
  }
}
