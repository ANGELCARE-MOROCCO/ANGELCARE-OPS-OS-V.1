import { NextResponse } from 'next/server'
import {
  preparePortalInvitation,
  prepareSchoolUserInvitation,
  resendPortalInvitation,
  revokePortalInvitation,
} from '@/lib/angelcare360/server/portal-invitations'
import { Angelcare360AccessError } from '@/lib/angelcare360/server/context'
import type { Angelcare360PortalKind } from '@/types/angelcare360/role-portals'

export const dynamic = 'force-dynamic'

const PORTAL_KINDS = new Set<Angelcare360PortalKind>([
  'teacher',
  'parent',
  'staff',
  'student',
])

function isPortalKind(value: string): value is Angelcare360PortalKind {
  return PORTAL_KINDS.has(value as Angelcare360PortalKind)
}

function text(value: unknown) {
  return String(value ?? '').trim()
}

export async function POST(request: Request) {
  try {
    const body = await request.json() as Record<string, unknown>
    const operation = text(body.operation) || 'prepare'

    if (operation === 'revoke') {
      const result = await revokePortalInvitation(text(body.invitationId))
      return NextResponse.json({ ok: true, data: result })
    }

    if (operation === 'resend') {
      const result = await resendPortalInvitation(text(body.invitationId))
      return NextResponse.json({ ok: true, data: result })
    }

    if (text(body.kind) === 'school_user') {
      const result = await prepareSchoolUserInvitation({
        email: text(body.email),
        fullName: text(body.fullName) || null,
        roleId: text(body.roleId),
        personId: text(body.personId) || null,
        reason: text(body.reason) || null,
      })

      return NextResponse.json({ ok: true, data: result })
    }

    const kind = text(body.kind)

    if (!isPortalKind(kind)) {
      return NextResponse.json(
        { ok: false, error: 'Type de portail invalide.' },
        { status: 422 },
      )
    }

    const result = await preparePortalInvitation({
      kind,
      personId: text(body.personId),
      email: text(body.email) || null,
      roleId: text(body.roleId) || null,
      reason: text(body.reason) || null,
    })

    return NextResponse.json({ ok: true, data: result })
  } catch (error) {
    const status =
      error instanceof Angelcare360AccessError
        ? error.status
        : 500

    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : 'Action impossible.',
      },
      { status },
    )
  }
}
