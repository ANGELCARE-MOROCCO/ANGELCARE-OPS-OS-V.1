import { NextRequest, NextResponse } from 'next/server'
import { dispatchDueEmailCommandMessages } from '@/lib/angelcare360/operator/email-command'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

function authorized(request: NextRequest) {
  const expected = String(process.env.EMAIL_COMMAND_WORKER_TOKEN || process.env.EMAIL_OS_SYNC_TOKEN || '')
  if (!expected) return false
  const provided = request.headers.get('x-email-command-worker-token') || request.headers.get('authorization')?.replace(/^Bearer\s+/i, '') || ''
  return provided.length === expected.length && provided === expected
}

export async function POST(request: NextRequest) {
  if (!authorized(request)) return NextResponse.json({ ok: false, error: 'Email Command worker token invalide.' }, { status: 401 })
  const body = await request.json().catch(() => ({}))
  const result = await dispatchDueEmailCommandMessages(Number(body?.limit || 100))
  return NextResponse.json(result, { status: result.ok ? 200 : 207 })
}
