import { NextResponse } from 'next/server'
import { getCurrentAppUser } from '@/lib/auth/session'
import { getMailboxAccessSummaryFromAssignments, getUserEmailOSMailboxAssignments } from '@/lib/email-os-core/access-governance'
import { normalizeEmailOSOperatorIdentity } from '@/lib/email-os-core/operator-identity'

function clean(value: unknown) {
  return String(value ?? '').trim()
}

function safeNumber(value: unknown) {
  const number = Number(value)
  return Number.isFinite(number) ? number : 0
}

function readableEmailName(value: unknown) {
  const localPart = clean(value).split('@')[0] || ''
  return localPart
    .replace(/[._-]+/g, ' ')
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => `${part.charAt(0).toUpperCase()}${part.slice(1).toLowerCase()}`)
    .join(' ')
}

export async function GET() {
  const user = await getCurrentAppUser()
  if (!user) {
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const result = await getUserEmailOSMailboxAssignments(user.id)
    const assignments = result.assignments.filter((assignment) => assignment.status !== 'revoked')
    const rawSummary = getMailboxAccessSummaryFromAssignments(assignments)
    const activeSessionsCount = safeNumber(rawSummary.activeSessionsCount)
    const lockedAssignmentsCount = safeNumber(rawSummary.lockedAssignmentsCount)
    const lastActivityAt = clean(rawSummary.lastActivityAt) || null
    const securityStatus = clean(rawSummary.securityStatus) || 'Needs PIN'
    const rawUserName = clean(user.name)
    const operatorIdentity = normalizeEmailOSOperatorIdentity(
      { ...user, name: rawUserName.includes('@') ? '' : rawUserName },
      { id: user.id, email: clean(user.email), role: clean(user.role) },
    )
    const operatorName = operatorIdentity.fullName.includes('@')
      ? readableEmailName(operatorIdentity.email) || 'AngelCare Operator'
      : operatorIdentity.fullName

    return NextResponse.json({
      ok: true,
      data: {
        userId: user.id,
        operator: {
          id: operatorIdentity.id || user.id,
          name: operatorName,
          email: operatorIdentity.email || null,
          role: operatorIdentity.role || clean(user.role) || null,
          department: operatorIdentity.department || null,
          title: operatorIdentity.title || null,
        },
        summary: {
          assigned_mailboxes_count: assignments.length,
          active_sessions_count: activeSessionsCount,
          locked_assignments_count: lockedAssignmentsCount,
          last_activity_at: lastActivityAt,
          security_status: securityStatus,
          assignedMailboxesCount: assignments.length,
          activeSessionsCount,
          lockedAssignmentsCount,
          lastActivityAt,
          securityStatus,
        },
        assignments,
      },
    })
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : 'Failed to load mailboxes' }, { status: 500 })
  }
}
