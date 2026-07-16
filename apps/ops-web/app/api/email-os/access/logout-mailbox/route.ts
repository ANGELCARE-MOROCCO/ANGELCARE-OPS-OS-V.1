import { NextResponse } from 'next/server'
import { getCurrentAppUser } from '@/lib/auth/session'
import { createEmailOSCoreDb } from '@/lib/email-os-core/db'
import { auditMailboxAccessEvent, getMailboxAccessAssignmentById } from '@/lib/email-os-core/access-governance'

function clean(value: unknown) {
  return String(value ?? '').trim()
}

export async function POST(request: Request) {
  const user = await getCurrentAppUser()
  if (!user) {
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json().catch(() => ({}))
    const mailboxId = clean(body.mailboxId)
    if (!mailboxId) {
      return NextResponse.json({ ok: false, error: 'mailboxId is required' }, { status: 400 })
    }

    const db = createEmailOSCoreDb()
    const { data: assignmentRow } = await db
      .from('email_os_mailbox_user_assignments')
      .select('*')
      .eq('user_id', user.id)
      .eq('mailbox_id', mailboxId)
      .eq('status', 'active')
      .maybeSingle()

    if (!assignmentRow) {
      return NextResponse.json({ ok: false, error: 'Mailbox not assigned to this user.' }, { status: 403 })
    }

    const assignment = await getMailboxAccessAssignmentById(clean(assignmentRow.id))
    const { data: sessions } = await db
      .from('email_os_mailbox_access_sessions')
      .select('*')
      .eq('assignment_id', clean(assignmentRow.id))
      .eq('user_id', user.id)
      .eq('status', 'active')

    const now = new Date().toISOString()
    for (const session of sessions || []) {
      await db.from('email_os_mailbox_access_sessions').update({
        status: 'revoked',
        revoked_at: now,
        revoked_by: user.id,
        revoked_reason: clean(body.reason) || 'user locked mailbox',
        updated_at: now,
      }).eq('id', session.id).then(() => null, () => null)

      await auditMailboxAccessEvent({
        actor_user_id: user.id,
        target_user_id: user.id,
        mailbox_id: mailboxId,
        assignment_id: assignmentRow.id,
        session_id: session.id,
        event_type: 'mailbox_session_revoked',
        event_result: 'success',
        request,
        metadata_json: { reason: clean(body.reason) || 'user locked mailbox' },
      }).catch(() => null)
    }

    return NextResponse.json({
      ok: true,
      data: {
        assignment,
        revokedSessions: sessions?.length || 0,
      },
    })
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : 'Failed to lock mailbox' }, { status: 500 })
  }
}
