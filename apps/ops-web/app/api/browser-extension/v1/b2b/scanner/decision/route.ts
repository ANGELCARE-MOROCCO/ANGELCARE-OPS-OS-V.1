import { NextRequest, NextResponse } from 'next/server'
import { authenticateExtensionRequest } from '@/lib/browser-extension/runtime'
import { authorizeB2BIntelligenceCommand } from '@/lib/browser-extension/b2b-intelligence/authorization'
import { recordScannerDecision } from '@/lib/browser-extension/b2b-scanner/service'
import { writeExtensionAudit } from '@/lib/browser-extension/audit'

export async function POST(req: NextRequest) {
  const auth = await authenticateExtensionRequest(req)
  if (!auth.ok) return auth.response
  const body = await req.json().catch(() => ({}))
  if (!body.sessionId || !body.decisionType) return NextResponse.json({ ok: false, error: 'SCANNER_DECISION_REQUIRED' }, { status: 400 })
  const decision = await authorizeB2BIntelligenceCommand(auth.db, auth.context.user.id, { commandKey: 'b2b.account.recognize', sourceAdapter: null })
  if (!decision.ok) return NextResponse.json({ ok: false, error: decision.error }, { status: decision.status })
  try {
    const row = await recordScannerDecision({ db: auth.db, actor: auth.context.user, sessionId: String(body.sessionId), decisionType: String(body.decisionType), targetType: body.targetType || null, targetId: body.targetId || null, payload: body.payload || {} })
    await writeExtensionAudit(auth.db, { actor: auth.context.user, deviceId: auth.context.device.id, eventType: 'scanner_user_decision', moduleKey: 'revenue_b2b', commandKey: 'b2b.scanner.decision', targetType: body.targetType || 'scan_session', targetId: body.targetId || body.sessionId, metadata: { decisionType: body.decisionType, scanSessionId: body.sessionId } })
    return NextResponse.json({ ok: true, decision: row })
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: String(error?.message || 'SCANNER_DECISION_FAILED') }, { status: Number(error?.status || 500) })
  }
}
