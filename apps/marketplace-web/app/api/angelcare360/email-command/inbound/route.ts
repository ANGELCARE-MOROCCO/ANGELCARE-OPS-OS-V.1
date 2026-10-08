import { NextRequest, NextResponse } from 'next/server'
import { ingestInboundEmail } from '@/lib/angelcare360/operator/email-command'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

function authorized(request: NextRequest) {
  const expected = String(process.env.EMAIL_OS_SYNC_TOKEN || process.env.EMAIL_OS_BRIDGE_TOKEN || '')
  if (!expected) return false
  const provided = request.headers.get('x-email-os-sync-token') || request.headers.get('authorization')?.replace(/^Bearer\s+/i, '') || ''
  return provided.length === expected.length && provided === expected
}

export async function POST(request: NextRequest) {
  if (!authorized(request)) return NextResponse.json({ ok: false, error: 'Email OS sync token invalide.' }, { status: 401 })
  const body = await request.json().catch(() => null)
  if (!body) return NextResponse.json({ ok: false, error: 'Payload inbound invalide.' }, { status: 422 })
  const messages = Array.isArray(body.messages) ? body.messages : [body]
  const outcomes = []
  for (const message of messages.slice(0, 250)) outcomes.push(await ingestInboundEmail(message))
  return NextResponse.json({ ok: outcomes.every((item) => item.ok), outcomes }, { status: outcomes.every((item) => item.ok) ? 200 : 207 })
}
