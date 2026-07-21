import { NextRequest, NextResponse } from 'next/server'
import { authenticateExtensionRequest } from '@/lib/browser-extension/runtime'
import { authorizeB2BIntelligenceCommand } from '@/lib/browser-extension/b2b-intelligence/authorization'
import { runQuickScanner } from '@/lib/browser-extension/b2b-scanner/service'
import { writeExtensionAudit } from '@/lib/browser-extension/audit'

export async function POST(req: NextRequest) {
  const auth = await authenticateExtensionRequest(req)
  if (!auth.ok) return auth.response
  const body = await req.json().catch(() => ({}))
  const context = body?.context
  if (!context?.url || !context?.adapterId) return NextResponse.json({ ok: false, error: 'SCANNER_CONTEXT_REQUIRED' }, { status: 400 })
  const decision = await authorizeB2BIntelligenceCommand(auth.db, auth.context.user.id, { commandKey: 'b2b.context.resolve', sourceAdapter: context.adapterId })
  if (!decision.ok) return NextResponse.json({ ok: false, error: decision.error }, { status: decision.status })
  try {
    const scan = await runQuickScanner({ db: auth.db, actor: auth.context.user, device: auth.context.device, access: decision.access, context })
    await writeExtensionAudit(auth.db, { actor: auth.context.user, deviceId: auth.context.device.id, eventType: 'scanner_quick_completed', moduleKey: 'revenue_b2b', commandKey: 'b2b.scanner.quick', targetType: 'scan_session', targetId: scan.session.id, sourceOrigin: context.origin || null, metadata: { quality: scan.quality, matchCount: scan.matches.length } })
    return NextResponse.json({ ok: true, scan })
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: String(error?.message || 'SCANNER_QUICK_FAILED'), details: error?.details || null }, { status: Number(error?.status || 500) })
  }
}
