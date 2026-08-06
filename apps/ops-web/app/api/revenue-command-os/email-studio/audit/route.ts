import crypto from 'node:crypto'
import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/getUser'
import { resolveRevenueOsActor } from '@/lib/revenue-command-os/access'
import { normalizeRevenueOsError } from '@/lib/revenue-command-os/errors'
import { writeRevenueOsAuditEvent } from '@/lib/revenue-command-os/repository'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) return NextResponse.json({ ok: false, error: { code: 'UNAUTHENTICATED', message: 'Authentification requise.' } }, { status: 401 })
    const body = await request.json().catch(() => ({})) as Record<string, unknown>
    const actor = await resolveRevenueOsActor('revenue_os.manage', { aliases: ['revenue_os.view'], payload: body })
    const mode = String(body.mode || 'draft')
    const subject = String(body.subject || '')
    const recipient = String(body.toEmail || '')
    const reference = String(body.externalReference || body.messageId || body.draftId || '') || crypto.randomUUID()
    const outcome = mode === 'send' ? 'success' : 'pending'
    await writeRevenueOsAuditEvent({
      action: `email_studio.${mode}`,
      actorId: actor.id,
      actorLabel: actor.displayName,
      actorType: 'user',
      resourceType: 'revenue_email_operation',
      resourceId: reference,
      outcome,
      summary: mode === 'send' ? `Email Revenue OS confié à Email OS pour ${recipient}.` : mode === 'schedule' ? `Email Revenue OS programmé pour ${recipient}.` : `Brouillon Revenue OS enregistré pour ${recipient}.`,
      metadata: {
        tenantId: actor.tenantId,
        mailboxId: body.mailboxId || null,
        mode,
        recipient,
        subject,
        relatedEntityType: body.contextType || null,
        relatedEntityReference: body.contextReference || null,
        scheduledAt: body.scheduledAt || null,
        followUpAt: body.followUpAt || null,
        emailOsReference: reference,
        bodyHash: crypto.createHash('sha256').update(String(body.bodyText || '')).digest('hex'),
      },
    })
    return NextResponse.json({ ok: true, data: { reference, mode, audited: true } }, { headers: { 'Cache-Control': 'no-store' } })
  } catch (error) {
    const normalized = normalizeRevenueOsError(error)
    return NextResponse.json({ ok: false, error: { code: normalized.code, message: normalized.message } }, { status: normalized.status || 500 })
  }
}
