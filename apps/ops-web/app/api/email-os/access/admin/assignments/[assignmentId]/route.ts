import { NextResponse } from 'next/server'
import { getCurrentAppUser } from '@/lib/auth/session'
import { getMailboxAccessAssignmentById, getUserEmailOSAdminProfile, updateMailboxAssignment, type EmailOSMailboxAssignmentStatus } from '@/lib/email-os-core/access-governance'

function clean(value: unknown) {
  return String(value ?? '').trim()
}

function normalizeAssignmentStatus(value: unknown): EmailOSMailboxAssignmentStatus | undefined {
  const status = clean(value)
  if (status === 'active' || status === 'suspended' || status === 'revoked') return status
  return undefined
}

export async function GET(_request: Request, { params }: { params: Promise<{ assignmentId: string }> }) {
  const actor = await getCurrentAppUser()
  if (!actor) {
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 })
  }

  const admin = await getUserEmailOSAdminProfile(actor.id)
  if (!admin.isAdmin) {
    return NextResponse.json({ ok: false, error: 'Admin permission required.' }, { status: 403 })
  }

  try {
    const { assignmentId } = await params
    const assignment = await getMailboxAccessAssignmentById(clean(assignmentId))
    if (!assignment) {
      return NextResponse.json({ ok: false, error: 'Mailbox assignment not found.' }, { status: 404 })
    }
    return NextResponse.json({ ok: true, data: assignment })
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : 'Failed to load assignment' }, { status: 500 })
  }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ assignmentId: string }> }) {
  const actor = await getCurrentAppUser()
  if (!actor) {
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 })
  }

  const admin = await getUserEmailOSAdminProfile(actor.id)
  if (!admin.isAdmin) {
    return NextResponse.json({ ok: false, error: 'Admin permission required.' }, { status: 403 })
  }

  try {
    const { assignmentId } = await params
    const body = await request.json().catch(() => ({}))
    const assignment = await updateMailboxAssignment({
      actorUserId: actor.id,
      assignmentId: clean(assignmentId),
      role: body.role ? clean(body.role) : undefined,
      permissions: {
        can_read: body.canRead,
        can_send: body.canSend,
        can_reply: body.canReply,
        can_archive: body.canArchive,
        can_delete: body.canDelete,
        can_manage_templates: body.canManageTemplates,
        can_view_logs: body.canViewLogs,
        can_manage_mailbox_settings: body.canManageMailboxSettings,
      },
      status: normalizeAssignmentStatus(body.status),
      notes: body.notes !== undefined ? clean(body.notes) : undefined,
      request,
    })
    return NextResponse.json({ ok: true, data: assignment })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to update assignment'
    return NextResponse.json({ ok: false, error: message }, { status: 500 })
  }
}
