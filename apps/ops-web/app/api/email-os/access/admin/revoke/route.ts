import { NextResponse } from 'next/server'
import { getCurrentAppUser } from '@/lib/auth/session'
import { getUserEmailOSAdminProfile, revokeMailboxAssignment } from '@/lib/email-os-core/access-governance'

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
    const assignment = await revokeMailboxAssignment({
      actorUserId: actor.id,
      assignmentId: clean(body.assignmentId),
      reason: clean(body.reason) || null,
      revokeSessions: body.revokeSessions !== false,
      request,
    })

    return NextResponse.json({ ok: true, data: assignment })
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : 'Failed to revoke mailbox access' }, { status: 500 })
  }
}
