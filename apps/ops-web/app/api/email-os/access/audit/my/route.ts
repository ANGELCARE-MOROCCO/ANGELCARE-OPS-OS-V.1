import { NextResponse } from 'next/server'
import { getCurrentAppUser } from '@/lib/auth/session'
import { getMailboxAccessAudit } from '@/lib/email-os-core/access-governance'

function clean(value: unknown) {
  return String(value ?? '').trim()
}

export async function GET(request: Request) {
  const user = await getCurrentAppUser()
  if (!user) {
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const url = new URL(request.url)
    const mailboxId = clean(url.searchParams.get('mailboxId'))
    const limit = Number(url.searchParams.get('limit') || 100)
    const data = await getMailboxAccessAudit(user.id, mailboxId || null, limit)
    return NextResponse.json({ ok: true, data })
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : 'Failed to load audit events' }, { status: 500 })
  }
}
