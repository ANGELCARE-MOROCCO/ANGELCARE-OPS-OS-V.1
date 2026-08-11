import { NextRequest } from 'next/server'
import {
  acContext,
  audit,
  fail,
  normalizeOpenWAAccountStatus,
  ok,
  scopeAccounts,
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

function sessionName(value: string) {
  const base = value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 32) || 'angelcare'
  return `${base}-${crypto.randomUUID().slice(0, 6)}`.slice(0, 42)
}

function alreadyRunning(cause: unknown) {
  const message = cause instanceof Error ? cause.message.toLowerCase() : String(cause || '').toLowerCase()
  return (
    (cause instanceof OpenWAError && cause.status === 400) ||
    message.includes('already started') ||
    message.includes('already starting')
  ) && (message.includes('already started') || message.includes('already starting'))
}

export async function GET(request: NextRequest) {
  const context = await acContext(request, 'ac-whatsapp.view')
  if ('error' in context) return context.error

  const result = await scopeAccounts(
    context.supabase.from('ac_whatsapp_accounts').select('*,queue:ac_whatsapp_queues(*)'),
    context,
  ).order('created_at', { ascending: false })

  if (result.error) return fail(result.error.message, 500)
  return ok(result.data || [])
}

export async function POST(request: NextRequest) {
  const context = await acContext(request, 'ac-whatsapp.account.manage')
  if ('error' in context) return context.error

  const body = await request.json().catch(() => ({}))
  if (!body.name) return fail('ACCOUNT_NAME_REQUIRED', 422)
  if (!openwa.configured()) return fail('OPENWA_NOT_CONFIGURED', 503)

  const name = sessionName(body.openwa_session_name || body.name)
  let session: any

  try {
    session = await openwa.createSession({
      name,
      config: {
        autoReconnect: true,
        autoRejectCalls: Boolean(body.auto_reject_calls),
      },
    })
  } catch (cause) {
    return fail(cause instanceof Error ? cause.message : 'OPENWA_SESSION_CREATE_FAILED', 502)
  }

  const account = await context.supabase
    .from('ac_whatsapp_accounts')
    .insert({
      code: body.code || name.toUpperCase().replaceAll('-', '_'),
      name: String(body.name),
      phone_number_e164: body.phone_number_e164 || null,
      department: body.department || 'Commercial',
      purpose: body.purpose || 'Communications ANGELCARE',
      openwa_session_id: session.id,
      openwa_session_name: session.name || name,
      engine_type: body.engine_type || 'whatsapp-web.js',
      status: normalizeOpenWAAccountStatus(session.status, 'draft'),
      default_queue_id: body.default_queue_id || null,
      outbound_enabled: body.outbound_enabled !== false,
      campaigns_enabled: body.campaigns_enabled !== false,
      cold_prospecting_enabled: body.cold_prospecting_enabled !== false,
      bulk_messaging_enabled: body.bulk_messaging_enabled !== false,
      settings: body.settings || {},
      runtime_metadata: session,
      created_by: context.user.id,
      updated_by: context.user.id,
    })
    .select('*')
    .single()

  if (account.error) {
    try {
      await openwa.deleteSession(session.id)
    } catch {
      try { await openwa.stopSession(session.id) } catch {}
    }
    return fail(account.error.message, 500)
  }

  const webhookUrl = String(process.env.AC_WHATSAPP_WEBHOOK_PUBLIC_URL || '').trim()
  const secret = String(process.env.AC_WHATSAPP_WEBHOOK_SECRET || '').trim()

  if (webhookUrl && secret) {
    try {
      await openwa.createWebhook(session.id, {
        url: webhookUrl,
        events: WEBHOOK_EVENTS,
        secret,
        retryCount: 5,
      })
    } catch (cause) {
      await context.supabase.from('ac_whatsapp_security_events').insert({
        severity: 'high',
        event_type: 'webhook.registration_failed',
        title: 'Webhook OpenWA non enregistré',
        description: cause instanceof Error ? cause.message : 'Erreur inconnue',
        account_id: account.data.id,
        metadata: { sessionId: session.id },
      })
    }
  }

  if (body.auto_start !== false) {
    try {
      let started: any
      try {
        started = await openwa.startSession(session.id)
      } catch (cause) {
        if (!alreadyRunning(cause)) throw cause
        started = await openwa.getSession(session.id)
      }

      await context.supabase
        .from('ac_whatsapp_accounts')
        .update({
          status: normalizeOpenWAAccountStatus(started.status, 'starting'),
          runtime_metadata: started,
          last_error: null,
          last_activity_at: new Date().toISOString(),
        })
        .eq('id', account.data.id)
    } catch (cause) {
      await context.supabase
        .from('ac_whatsapp_accounts')
        .update({ status: 'error', last_error: cause instanceof Error ? cause.message : 'OPENWA_START_FAILED' })
        .eq('id', account.data.id)
    }
  }

  const latest = await context.supabase.from('ac_whatsapp_accounts').select('*').eq('id', account.data.id).single()
  if (latest.error) return fail(latest.error.message, 500)

  await audit(context, {
    action: 'account.create',
    entityType: 'account',
    entityId: account.data.id,
    newState: latest.data,
  })

  return ok(latest.data, { status: 201 })
}

export async function PATCH(request: NextRequest) {
  const context = await acContext(request, 'ac-whatsapp.account.manage')
  if ('error' in context) return context.error
  const body = await request.json().catch(() => ({}))
  const id = String(body.id || '')
  if (!id) return fail('ACCOUNT_ID_REQUIRED', 422)
  const current = await context.supabase.from('ac_whatsapp_accounts').select('*').eq('id', id).maybeSingle()
  if (current.error) return fail(current.error.message, 500)
  if (!current.data) return fail('ACCOUNT_NOT_FOUND', 404)
  const previous = current.data
  const patch: Record<string, unknown> = { updated_by: context.user.id, updated_at: new Date().toISOString() }
  for (const key of ['name','phone_number_e164','department','purpose','default_queue_id','outbound_enabled','campaigns_enabled','cold_prospecting_enabled','bulk_messaging_enabled']) {
    if (key in body) patch[key] = body[key] === '' ? null : body[key]
  }
  if (body.action === 'restore') {
    patch.status = 'disconnected'
    patch.settings = { ...(previous.settings || {}), retired: false, retired_at: null, retired_by: null, retired_reason: null }
  }
  const updated = await context.supabase.from('ac_whatsapp_accounts').update(patch).eq('id', id).select('*').single()
  if (updated.error) return fail(updated.error.message, 500)
  await audit(context, { action: `account.${body.action || 'update'}`, entityType: 'account', entityId: id, previousState: previous, newState: updated.data, reason: body.reason || null })
  return ok(updated.data)
}

export async function DELETE(request: NextRequest) {
  const context = await acContext(request, 'ac-whatsapp.account.manage')
  if ('error' in context) return context.error
  const body = await request.json().catch(() => ({}))
  const id = String(body.id || '')
  const reason = String(body.reason || '').trim()
  if (!id) return fail('ACCOUNT_ID_REQUIRED', 422)
  if (!reason) return fail('RETIRE_REASON_REQUIRED', 422)
  const current = await context.supabase.from('ac_whatsapp_accounts').select('*').eq('id', id).maybeSingle()
  if (current.error) return fail(current.error.message, 500)
  if (!current.data) return fail('ACCOUNT_NOT_FOUND', 404)
  const [conversations, outbox] = await Promise.all([
    context.supabase.from('ac_whatsapp_conversations').select('id', { count: 'exact', head: true }).eq('account_id', id).not('status', 'in', '(resolved,closed,archived)'),
    context.supabase.from('ac_whatsapp_outbox').select('id', { count: 'exact', head: true }).eq('account_id', id).in('status', ['scheduled','queued','processing']),
  ])
  const blocker = conversations.error || outbox.error
  if (blocker) return fail(blocker.message, 500)
  if ((conversations.count || 0) > 0 || (outbox.count || 0) > 0) return fail('ACCOUNT_RETIRE_BLOCKED', 409, { openConversations: conversations.count || 0, inFlightOutbox: outbox.count || 0 })
  if (current.data.openwa_session_id) { try { await openwa.stopSession(current.data.openwa_session_id) } catch {} }
  const now = new Date().toISOString()
  const updated = await context.supabase.from('ac_whatsapp_accounts').update({
    status: 'suspended', outbound_enabled: false, campaigns_enabled: false, cold_prospecting_enabled: false, bulk_messaging_enabled: false,
    settings: { ...(current.data.settings || {}), retired: true, retired_at: now, retired_by: context.user.id, retired_reason: reason },
    updated_by: context.user.id, updated_at: now,
  }).eq('id', id).select('*').single()
  if (updated.error) return fail(updated.error.message, 500)
  await audit(context, { action: 'account.retire', entityType: 'account', entityId: id, previousState: current.data, newState: updated.data, reason })
  return ok(updated.data)
}
