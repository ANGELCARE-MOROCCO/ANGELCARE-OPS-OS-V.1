import { NextResponse } from 'next/server'
import { getCurrentAppUser } from '@/lib/auth/session'
import { createEmailOSCoreDb } from '@/lib/email-os-core/db'
import {
  assignMailboxToUser,
  getUserEmailOSAdminProfile,
  getUserEmailOSMailboxAssignments,
} from '@/lib/email-os-core/access-governance'

function clean(value: unknown) {
  return String(value ?? '').trim()
}

function safeMailbox(row: any) {
  return {
    id: row?.id || null,
    name: row?.name || row?.label || row?.address || row?.email_address || row?.email || row?.id || 'Mailbox',
    address: row?.address || row?.email_address || row?.email || row?.from_email || row?.username || '',
    status: row?.status || 'active',
    owner: row?.owner || null,
    provider: row?.provider || null,
  }
}

async function loadMailboxes() {
  const db = createEmailOSCoreDb()
  const { data, error } = await db.from('email_os_core_mailboxes').select('*').order('name', { ascending: true })
  if (error) throw error
  return (data || []).map(safeMailbox)
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

    if (!userId) {
      return NextResponse.json({ ok: false, error: 'userId is required' }, { status: 400 })
    }

    const [profile, mailboxes] = await Promise.all([
      getUserEmailOSMailboxAssignments(userId),
      loadMailboxes(),
    ])

    return NextResponse.json({
      ok: true,
      data: {
        userId,
        summary: profile.summary,
        assignments: profile.assignments,
        mailboxes,
      },
    })
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : 'Failed to load mailbox assignments' },
      { status: 500 }
    )
  }
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
    const userId = clean(body.userId)
    const mailboxId = clean(body.mailboxId)
    const role = clean(body.role)

    if (!userId) {
      return NextResponse.json({ ok: false, error: 'userId is required' }, { status: 400 })
    }
    if (!mailboxId) {
      return NextResponse.json({ ok: false, error: 'mailboxId is required' }, { status: 400 })
    }
    if (!role) {
      return NextResponse.json({ ok: false, error: 'role is required' }, { status: 400 })
    }

    const permissions = {
      can_read: body.canRead,
      can_send: body.canSend,
      can_reply: body.canReply,
      can_archive: body.canArchive,
      can_delete: body.canDelete,
      can_manage_templates: body.canManageTemplates,
      can_view_logs: body.canViewLogs,
      can_manage_mailbox_settings: body.canManageMailboxSettings,
    }

    const assignment = await assignMailboxToUser({
      actorUserId: actor.id,
      targetUserId: userId,
      mailboxId,
      role,
      pin: clean(body.pin) || null,
      notes: clean(body.notes) || null,
      permissions,
      assignedBy: actor.id,
      request,
    })

    return NextResponse.json({ ok: true, data: assignment })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to assign mailbox'
    return NextResponse.json({ ok: false, error: message }, { status: message.includes('Duplicate active assignment') ? 409 : 500 })
  }
}
