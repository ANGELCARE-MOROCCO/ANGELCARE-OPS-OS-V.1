import { NextRequest, NextResponse } from 'next/server'
import { authenticateExtensionRequest } from '@/lib/browser-extension/runtime'
import { authorizeB2BIntelligenceCommand } from '@/lib/browser-extension/b2b-intelligence/authorization'
import { searchScannerAccounts } from '@/lib/browser-extension/b2b-scanner/service'
import { writeExtensionAudit } from '@/lib/browser-extension/audit'

export async function POST(req: NextRequest) {
  const auth = await authenticateExtensionRequest(req)
  if (!auth.ok) return auth.response
  const body = await req.json().catch(() => ({}))
  const decision = await authorizeB2BIntelligenceCommand(auth.db, auth.context.user.id, { commandKey: 'b2b.account.search', sourceAdapter: null })
  if (!decision.ok) return NextResponse.json({ ok: false, error: decision.error }, { status: decision.status })
  try {
    const accounts = await searchScannerAccounts({ db: auth.db, actor: auth.context.user, access: decision.access, query: body.query, city: body.city, sector: body.sector, status: body.status, limit: body.limit })
    await writeExtensionAudit(auth.db, { actor: auth.context.user, deviceId: auth.context.device.id, eventType: 'scanner_account_search', moduleKey: 'revenue_b2b', commandKey: 'b2b.account.search', result: 'ok', metadata: { queryProvided: Boolean(body.query), resultCount: accounts.results.length, totalAuthorized: accounts.totalAuthorized } })
    return NextResponse.json({ ok: true, accounts })
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: String(error?.message || 'SCANNER_ACCOUNT_SEARCH_FAILED') }, { status: Number(error?.status || 500) })
  }
}
