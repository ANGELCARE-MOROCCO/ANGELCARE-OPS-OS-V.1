import { NextRequest, NextResponse } from 'next/server'
import { requireExtensionAdminApi } from '@/lib/browser-extension/runtime'
import { executeProductionAdminAction, loadProductionControl } from '@/lib/browser-extension/production-control/service'
import { writeExtensionAudit } from '@/lib/browser-extension/audit'
import { PRODUCTION_ADMIN_ACTIONS } from '@/lib/browser-extension/production-control/contract'

export async function GET() {
  const auth = await requireExtensionAdminApi()
  if (!auth.ok) return auth.response
  return NextResponse.json({ ok: true, data: await loadProductionControl(auth.db) })
}

export async function POST(req: NextRequest) {
  const auth = await requireExtensionAdminApi()
  if (!auth.ok) return auth.response
  const body = await req.json().catch(() => ({}))
  const action = String(body.action || '')
  if (!(PRODUCTION_ADMIN_ACTIONS as readonly string[]).includes(action)) return NextResponse.json({ ok: false, error: 'Unsupported production action.' }, { status: 400 })
  try {
    const result = await executeProductionAdminAction(auth.db, auth.user, action, body.payload || {})
    await writeExtensionAudit(auth.db, { actor: auth.user, eventType: 'production_admin_action', moduleKey: 'revenue_b2b', commandKey: `production.${action}`, targetType: body.payload?.targetType || null, targetId: body.payload?.id || body.payload?.deviceId || body.payload?.version || null, result: 'ok', severity: action.includes('kill_switch') || action.includes('rollback') || action === 'device.revoke' ? 'warning' : 'info', metadata: { action, payload: { ...body.payload, reason: body.payload?.reason || null } } })
    return NextResponse.json({ ok: true, result })
  } catch (error: any) {
    const status = Number(error?.status || 500)
    await writeExtensionAudit(auth.db, { actor: auth.user, eventType: 'production_admin_action_failed', moduleKey: 'revenue_b2b', commandKey: `production.${action}`, result: 'error', severity: 'error', metadata: { action, error: String(error?.message || error) } })
    return NextResponse.json({ ok: false, error: String(error?.message || 'PRODUCTION_ACTION_FAILED') }, { status })
  }
}
