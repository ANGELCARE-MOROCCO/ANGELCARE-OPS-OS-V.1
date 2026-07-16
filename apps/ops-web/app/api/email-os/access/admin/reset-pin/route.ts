import { NextResponse } from 'next/server'
import { getCurrentAppUser } from '@/lib/auth/session'
import { getUserEmailOSAdminProfile, setMailboxAssignmentPin } from '@/lib/email-os-core/access-governance'

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
    const assignment = await setMailboxAssignmentPin({
      actorUserId: actor.id,
      assignmentId: clean(body.assignmentId),
      pin: clean(body.pin),
      reason: clean(body.reason) || null,
      revokeActiveSessions: body.revokeActiveSessions !== false,
      request,
    })

    return NextResponse.json({ ok: true, data: assignment })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to reset PIN'
    return NextResponse.json({ ok: false, error: message }, { status: message.includes('6 digits') ? 400 : 500 })
  }
}
