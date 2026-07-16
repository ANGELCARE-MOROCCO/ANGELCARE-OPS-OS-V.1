import { NextResponse } from 'next/server'
import { getCurrentAppUser } from '@/lib/auth/session'
import { EmailOSMailboxAccessError, verifyMailboxPin } from '@/lib/email-os-core/access-governance'

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
    const result = await verifyMailboxPin({
      userId: user.id,
      mailboxId: clean(body.mailboxId),
      pin: clean(body.pin),
      request,
    })

    return NextResponse.json({
      ok: true,
      data: {
        assignment: result.assignment,
        mailbox: result.mailbox,
        session: result.session,
        redirectTo: `/email-os/mailboxes/${encodeURIComponent(result.assignment.mailboxId || result.assignment.mailbox_id)}`,
      },
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to unlock mailbox'
    const status = error instanceof EmailOSMailboxAccessError ? error.status : error && typeof error === 'object' && 'status' in error ? Number((error as any).status) || 500 : 500
    const diagnostics = error instanceof EmailOSMailboxAccessError ? error.diagnostics || null : null
    if (diagnostics) {
      console.warn('[email-os/access/unlock] failed', diagnostics)
    }
    return NextResponse.json({ ok: false, error: message, diagnostics }, { status })
  }
}
