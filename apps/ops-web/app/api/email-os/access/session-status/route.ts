import { NextResponse } from 'next/server'
import { getCurrentAppUser } from '@/lib/auth/session'
import { getUserEmailOSMailboxAssignments } from '@/lib/email-os-core/access-governance'

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
    if (!mailboxId) {
      return NextResponse.json({ ok: false, error: 'mailboxId is required' }, { status: 400 })
    }

    const result = await getUserEmailOSMailboxAssignments(user.id)
    const assignment = result.assignments.find((row) => row.mailbox_id === mailboxId && row.status !== 'revoked')

    if (!assignment) {
      return NextResponse.json({ ok: false, error: 'Mailbox not assigned to this user.' }, { status: 403 })
    }

    return NextResponse.json({
      ok: true,
      data: {
        mailboxId,
        summary: result.summary,
        assignment,
        session: assignment.session,
        sessionStatus: assignment.session_status,
        securityStatus: assignment.security_status,
      },
    })
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : 'Failed to load session status' }, { status: 500 })
  }
}
