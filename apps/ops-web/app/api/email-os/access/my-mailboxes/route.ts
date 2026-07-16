import { NextResponse } from 'next/server'
import { getCurrentAppUser } from '@/lib/auth/session'
import { getUserEmailOSMailboxAssignments } from '@/lib/email-os-core/access-governance'

export async function GET() {
  const user = await getCurrentAppUser()
  if (!user) {
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const result = await getUserEmailOSMailboxAssignments(user.id)
    const assignments = result.assignments.filter((assignment) => assignment.status !== 'revoked')
    return NextResponse.json({
      ok: true,
      data: {
        userId: user.id,
        summary: {
          ...result.summary,
          assigned_mailboxes_count: assignments.length,
        },
        assignments,
      },
    })
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : 'Failed to load mailboxes' }, { status: 500 })
  }
}
