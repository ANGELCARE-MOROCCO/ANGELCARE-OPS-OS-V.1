import { NextRequest, NextResponse } from 'next/server'
import { authenticateExtensionRequest } from '@/lib/browser-extension/runtime'
import { authorizeB2BIntelligenceCommand } from '@/lib/browser-extension/b2b-intelligence/authorization'
import { runDeepScanner } from '@/lib/browser-extension/b2b-scanner/service'
import { writeExtensionAudit } from '@/lib/browser-extension/audit'

export const maxDuration = 60

export async function POST(req: NextRequest) {
  const auth = await authenticateExtensionRequest(req)
  if (!auth.ok) return auth.response
  const body = await req.json().catch(() => ({}))
  const context = body?.context
  const mode = body?.mode === 'strategic' ? 'strategic' : 'deep'
  if (!context?.url || !context?.adapterId) return NextResponse.json({ ok: false, error: 'SCANNER_CONTEXT_REQUIRED' }, { status: 400 })
  const decision = await authorizeB2BIntelligenceCommand(auth.db, auth.context.user.id, { commandKey: 'b2b.context.resolve', sourceAdapter: context.adapterId })
  if (!decision.ok) return NextResponse.json({ ok: false, error: decision.error }, { status: decision.status })
  try {
    const scan = await runDeepScanner({ db: auth.db, actor: auth.context.user, device: auth.context.device, access: decision.access, context, mode })
    await writeExtensionAudit(auth.db, { actor: auth.context.user, deviceId: auth.context.device.id, eventType: 'scanner_deep_completed', moduleKey: 'revenue_b2b', commandKey: mode === 'strategic' ? 'b2b.scanner.strategic' : 'b2b.scanner.deep', targetType: 'scan_session', targetId: scan.session.id, sourceOrigin: context.origin || null, metadata: { status: scan.status, quality: scan.quality, pages: scan.pages.length, contacts: scan.contacts.length, hypotheses: scan.opportunityHypotheses.length, ai: scan.ai } })
    return NextResponse.json({ ok: true, scan })
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: String(error?.message || 'SCANNER_DEEP_FAILED'), details: error?.details || null }, { status: Number(error?.status || 500) })
  }
}
