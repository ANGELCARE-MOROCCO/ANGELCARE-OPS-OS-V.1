import { NextRequest, NextResponse } from 'next/server'
import { authenticateExtensionRequest } from '@/lib/browser-extension/runtime'
import { loadProductionStatus } from '@/lib/browser-extension/production-control/service'

export async function GET(req: NextRequest) {
  const auth = await authenticateExtensionRequest(req)
  if (!auth.ok) return auth.response
  const status = await loadProductionStatus(auth.db, auth.context.device)
  return NextResponse.json({ ok: true, ...status })
}
