import { NextResponse } from 'next/server'
import { getCurrentAppUser } from '@/lib/auth/session'
import { createEmailOSCoreDb } from '@/lib/email-os-core/db'
import { auditMailboxAccessEvent, getMailboxAccessAssignmentById, getUserEmailOSAdminProfile } from '@/lib/email-os-core/access-governance'

function clean(value: unknown) {
  return String(value ?? '').trim()
}

export async function POST(request: Request) {
  const actor = await getCurrentAppUser()
  if (!actor) {
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 })
  }

  const admin = await getUserEmailOSAdminProfile(actor.id)
  if (!admin.isAdmin) {
    return NextResponse.json({ ok: false, error: 'Admin permission required.' }, { status: 403 })
  }

  try {
    const body = await request.json().catch(() => ({}))
    const assignmentId = clean(body.assignmentId)
    const assignment = await getMailboxAccessAssignmentById(assignmentId)

    if (!assignment) {
      return NextResponse.json({ ok: false, error: 'Mailbox assignment not found.' }, { status: 404 })
    }

    const db = createEmailOSCoreDb()
    const now = new Date().toISOString()
    const { data: activeSessions } = await db
      .from('email_os_mailbox_access_sessions')
      .select('*')
      .eq('assignment_id', assignmentId)
      .eq('status', 'active')

    for (const session of activeSessions || []) {
      await db.from('email_os_mailbox_access_sessions').update({
        status: 'revoked',
        revoked_at: now,
        revoked_by: actor.id,
        revoked_reason: clean(body.reason) || 'force logout',
        updated_at: now,
      }).eq('id', session.id).then(() => null, () => null)

      await auditMailboxAccessEvent({
        actor_user_id: actor.id,
        target_user_id: assignment.user_id,
        mailbox_id: assignment.mailbox_id,
        assignment_id: assignmentId,
        session_id: session.id,
        event_type: 'mailbox_session_revoked',
        event_result: 'success',
        request,
        metadata_json: { reason: clean(body.reason) || 'force logout' },
      }).catch(() => null)
    }

    return NextResponse.json({ ok: true, data: { assignmentId, revokedSessions: activeSessions?.length || 0 } })
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : 'Failed to force logout mailbox access' }, { status: 500 })
  }
}
