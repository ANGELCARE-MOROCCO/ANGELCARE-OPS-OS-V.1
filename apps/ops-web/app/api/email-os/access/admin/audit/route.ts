import { NextResponse } from 'next/server'
import { getCurrentAppUser } from '@/lib/auth/session'
import { getMailboxAccessAudit, getUserEmailOSAdminProfile } from '@/lib/email-os-core/access-governance'

function clean(value: unknown) {
  return String(value ?? '').trim()
}

export async function GET(request: Request) {
  const actor = await getCurrentAppUser()
  if (!actor) {
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 })
  }

  const admin = await getUserEmailOSAdminProfile(actor.id)
  if (!admin.isAdmin) {
    return NextResponse.json({ ok: false, error: 'Admin permission required.' }, { status: 403 })
  }

  try {
    const url = new URL(request.url)
    const userId = clean(url.searchParams.get('userId'))
    const mailboxId = clean(url.searchParams.get('mailboxId'))
    const limit = Number(url.searchParams.get('limit') || 100)

    if (!userId) {
      return NextResponse.json({ ok: false, error: 'userId is required' }, { status: 400 })
    }

    const data = await getMailboxAccessAudit(userId, mailboxId || null, limit)
    return NextResponse.json({ ok: true, data })
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : 'Failed to load mailbox audit' }, { status: 500 })
  }
}
