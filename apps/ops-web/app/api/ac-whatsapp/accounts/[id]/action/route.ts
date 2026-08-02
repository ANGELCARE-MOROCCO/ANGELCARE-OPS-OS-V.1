import { NextRequest } from 'next/server'
import {
  acContext,
  audit,
  fail,
  hasAccountCapability,
  normalizeOpenWAAccountStatus,
  ok,
} from '@/lib/ac-whatsapp/server'
import { OpenWAError, openwa } from '@/lib/ac-whatsapp/openwa-client'

const WEBHOOK_EVENTS = [
  'message.received',
  'message.sent',
  'message.ack',
  'message.failed',
  'message.revoked',
  'message.reaction',
  'message.edited',
  'session.status',
  'session.qr',
  'session.authenticated',
  'session.disconnected',
  'session.reconnect_loop',
  'call.received',
]

function alreadyRunning(cause: unknown) {
  const message = cause instanceof Error ? cause.message.toLowerCase() : String(cause || '').toLowerCase()
  return (
    (cause instanceof OpenWAError && cause.status === 400) ||
    message.includes('already started') ||
    message.includes('already starting')
  ) && (message.includes('already started') || message.includes('already starting'))
}

async function ensureWebhook(sessionId: string) {
  const url = String(process.env.AC_WHATSAPP_WEBHOOK_PUBLIC_URL || '').trim()
  const secret = String(process.env.AC_WHATSAPP_WEBHOOK_SECRET || '').trim()
  if (!url || !secret) return { configured: false, state: 'missing_environment' as const }

  const existing = await openwa.listWebhooks(sessionId)
  const match = existing.find((row: any) => String(row?.url || '') === url)
  if (match) return { configured: true, state: 'existing' as const, webhook: match }

  const webhook = await openwa.createWebhook(sessionId, {
    url,
    events: WEBHOOK_EVENTS,
    secret,
    retryCount: 5,
  })
  return { configured: true, state: 'created' as const, webhook }
}

async function recordWebhookFailure(context: any, accountId: string, sessionId: string, cause: unknown) {
  const description = cause instanceof Error ? cause.message : String(cause || 'Erreur inconnue')
  const openEvent = await context.supabase
    .from('ac_whatsapp_security_events')
    .select('id')
    .eq('account_id', accountId)
    .eq('event_type', 'webhook.registration_failed')
    .eq('status', 'open')
    .limit(1)
    .maybeSingle()

  if (openEvent.data?.id) {
    await context.supabase
      .from('ac_whatsapp_security_events')
      .update({ description, metadata: { sessionId }, severity: 'high' })
      .eq('id', openEvent.data.id)
    return
  }

  await context.supabase.from('ac_whatsapp_security_events').insert({
    severity: 'high',
    event_type: 'webhook.registration_failed',
    title: 'Webhook OpenWA non enregistré',
    description,
    account_id: accountId,
    metadata: { sessionId },
  })
}

async function resolveWebhookFailures(context: any, accountId: string) {
  const now = new Date().toISOString()
  await context.supabase
    .from('ac_whatsapp_security_events')
    .update({ status: 'resolved', resolved_at: now, resolved_by: context.user.id })
    .eq('account_id', accountId)
    .eq('event_type', 'webhook.registration_failed')
    .eq('status', 'open')
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const context = await acContext(request, 'ac-whatsapp.account.manage')
  if ('error' in context) return context.error

  const { id } = await params
  if (!hasAccountCapability(context, id, 'admin')) return fail('ACCOUNT_ADMIN_ACCESS_DENIED', 403)

  const body = await request.json().catch(() => ({}))
  const action = String(body.action || '')
  const row = await context.supabase.from('ac_whatsapp_accounts').select('*').eq('id', id).maybeSingle()
  if (row.error) return fail(row.error.message, 500)
  if (!row.data) return fail('ACCOUNT_NOT_FOUND', 404)

  const sessionId = row.data.openwa_session_id
  if (!sessionId) return fail('ACCOUNT_SESSION_NOT_CONFIGURED', 409)

  try {
    let data: any
    let idempotent = false

    if (action === 'start' || action === 'resume') {
      try {
        data = await openwa.startSession(sessionId)
      } catch (cause) {
        if (!alreadyRunning(cause)) throw cause
        data = await openwa.getSession(sessionId)
        idempotent = true
      }
      if (action === 'resume') {
        await context.supabase.from('ac_whatsapp_accounts').update({ outbound_enabled: true }).eq('id', id)
      }
    } else if (action === 'stop') {
      data = await openwa.stopSession(sessionId)
    } else if (action === 'logout') {
      data = await openwa.logoutSession(sessionId)
    } else if (action === 'qr') {
      data = await openwa.getQr(sessionId)
    } else if (action === 'pairing') {
      const phone = String(body.phoneNumber || row.data.phone_number_e164 || '').replace(/\D/g, '')
      if (!phone) return fail('PAIRING_PHONE_REQUIRED', 422)
      data = await openwa.pairingCode(sessionId, phone)
    } else if (action === 'sync') {
      data = await openwa.getSession(sessionId)
    } else if (action === 'pause') {
      data = { status: 'paused' }
      await context.supabase
        .from('ac_whatsapp_accounts')
        .update({ status: 'paused', outbound_enabled: false })
        .eq('id', id)
    } else {
      return fail('INVALID_ACTION', 422)
    }

    let webhook: any = null
    if (['start', 'resume', 'sync', 'qr', 'pairing'].includes(action)) {
      try {
        webhook = await ensureWebhook(sessionId)
        if (webhook.configured) await resolveWebhookFailures(context, id)
      } catch (cause) {
        webhook = { configured: true, state: 'failed', error: cause instanceof Error ? cause.message : String(cause) }
        await recordWebhookFailure(context, id, sessionId, cause)
      }
    }

    if (action !== 'qr' && action !== 'pairing') {
      const normalizedStatus = normalizeOpenWAAccountStatus(data?.status, row.data.status)
      const connected = normalizedStatus === 'connected'
      const patch: Record<string, unknown> = {
        status: normalizedStatus,
        runtime_metadata: { ...(data || {}), angelcare: { idempotent, webhook } },
        last_error: null,
        last_activity_at: new Date().toISOString(),
      }
      if (connected) patch.connected_at = data?.connectedAt || row.data.connected_at || new Date().toISOString()

      const updated = await context.supabase.from('ac_whatsapp_accounts').update(patch).eq('id', id)
      if (updated.error) return fail(updated.error.message, 500)
    }

    await audit(context, {
      action: `account.${action}`,
      entityType: 'account',
      entityId: id,
      newState: { data, idempotent, webhook },
    })

    return ok({ ...(data || {}), angelcare: { idempotent, webhook } })
  } catch (cause) {
    const message = cause instanceof Error ? cause.message : 'OPENWA_ACTION_FAILED'
    await context.supabase.from('ac_whatsapp_accounts').update({ status: 'error', last_error: message }).eq('id', id)
    return fail(message, 502)
  }
}
