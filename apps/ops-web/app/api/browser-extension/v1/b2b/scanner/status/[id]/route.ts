import { NextRequest, NextResponse } from 'next/server'
import { authenticateExtensionRequest } from '@/lib/browser-extension/runtime'
import { authorizeB2BIntelligenceCommand } from '@/lib/browser-extension/b2b-intelligence/authorization'
import { readScannerSession } from '@/lib/browser-extension/b2b-scanner/service'

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await authenticateExtensionRequest(req)
  if (!auth.ok) return auth.response
  const decision = await authorizeB2BIntelligenceCommand(auth.db, auth.context.user.id, { commandKey: 'b2b.account.recognize', sourceAdapter: null })
  if (!decision.ok) return NextResponse.json({ ok: false, error: decision.error }, { status: decision.status })
  try {
    const { id } = await params
    return NextResponse.json({ ok: true, scan: await readScannerSession({ db: auth.db, actor: auth.context.user, sessionId: id }) })
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: String(error?.message || 'SCANNER_SESSION_READ_FAILED') }, { status: Number(error?.status || 500) })
  }
}
