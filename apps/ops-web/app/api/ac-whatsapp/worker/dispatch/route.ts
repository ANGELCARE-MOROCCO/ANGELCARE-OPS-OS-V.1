import { NextRequest } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { fail, ok } from '@/lib/ac-whatsapp/server'
import { openwa } from '@/lib/ac-whatsapp/openwa-client'

function externalId(sent: any) { return String(sent?.messageId?._serialized || sent?.messageId || sent?.id?._serialized || sent?.id || sent?._serialized || '') || null }

export async function POST(request: NextRequest) {
  const supplied = request.headers.get('x-ac-whatsapp-worker-secret')
  const expected = process.env.AC_WHATSAPP_WORKER_SECRET
  if (!expected || supplied !== expected) return fail('WORKER_UNAUTHORIZED', 401)
  const supabase = await createServiceClient()
  const body = await request.json().catch(() => ({}))
  const workerId = String(body.workerId || 'angelcare-worker')
  const limit = Math.max(1, Math.min(Number(body.limit || 25), 100))
  await supabase.rpc('ac_whatsapp_release_stale_outbox', { p_age_minutes: 10 })
  const claimed = await supabase.rpc('ac_whatsapp_claim_outbox', { p_worker_id: workerId, p_limit: limit })
  if (claimed.error) return fail(claimed.error.message, 500)
  const results: any[] = []

  for (const item of claimed.data || []) {
    const account = await supabase.from('ac_whatsapp_accounts').select('*').eq('id', item.account_id).maybeSingle()
    const startedAt = new Date().toISOString()
    try {
      if (!account.data?.openwa_session_id) throw new Error('ACCOUNT_SESSION_NOT_CONFIGURED')
      if (account.data.outbound_enabled === false) throw new Error('ACCOUNT_OUTBOUND_PAUSED')
      let transportMedia = item.media_payload || {}
      if (transportMedia.storagePath) {
        const signed = await supabase.storage.from('ac-whatsapp-media').createSignedUrl(String(transportMedia.storagePath), 15 * 60)
        if (signed.error) throw new Error(signed.error.message)
        transportMedia = { ...transportMedia, url: signed.data.signedUrl }
        delete transportMedia.storagePath
        delete transportMedia.base64
      }
      const sent: any = item.message_type === 'text'
        ? await openwa.sendText(account.data.openwa_session_id, item.chat_id, item.body || '')
        : await openwa.sendMedia(account.data.openwa_session_id, item.message_type, item.chat_id, transportMedia, item.body || '')
      const external = externalId(sent)
      const sentAt = new Date().toISOString()
      let message: any = null
      if (item.conversation_id) {
        const messageResult = await supabase.from('ac_whatsapp_messages').select('*').eq('client_message_id', item.client_message_id).maybeSingle()
        if (!messageResult.error) message = messageResult.data
      }
      const preview = item.message_type === 'text' ? String(item.body || '') : `${String(item.message_type || 'media').toUpperCase()}${item.body ? `: ${item.body}` : ''}`
      await Promise.all([
        supabase.from('ac_whatsapp_outbox').update({ status: 'sent', external_message_id: external, locked_at: null, locked_by: null, last_error: null }).eq('id', item.id),
        supabase.from('ac_whatsapp_outbox_attempts').insert({ outbox_id: item.id, attempt_number: item.attempt_count, request_payload: { chatId: item.chat_id, type: item.message_type, hasMedia: Boolean(item.media_payload) }, response_payload: sent, status: 'sent', started_at: startedAt, completed_at: sentAt }),
        item.campaign_recipient_id ? supabase.from('ac_whatsapp_campaign_recipients').update({ status: 'sent', external_message_id: external, sent_at: sentAt }).eq('id', item.campaign_recipient_id) : Promise.resolve(),
        item.conversation_id ? supabase.from('ac_whatsapp_messages').update({ status: 'sent', external_message_id: external, sent_at: sentAt, error_message: null }).eq('client_message_id', item.client_message_id) : Promise.resolve(),
        item.conversation_id ? supabase.from('ac_whatsapp_conversations').update({ status: 'waiting_customer', unread_count: 0, last_message_preview: preview, last_message_direction: 'outbound', last_message_at: sentAt, last_message_sender_display_name_snapshot: message?.sender_display_name_snapshot || account.data.name || 'AngelCare', last_message_sender_type: message?.sender_type || 'angelcare_user' }).eq('id', item.conversation_id) : Promise.resolve(),
      ])
      results.push({ id: item.id, status: 'sent', external })
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : String(cause)
      const terminal = item.attempt_count >= item.max_attempts
      await Promise.all([
        supabase.from('ac_whatsapp_outbox').update({ status: terminal ? 'failed' : 'queued', locked_at: null, locked_by: null, last_error: message, available_at: new Date(Date.now() + Math.min(300000, 15000 * Math.max(1, item.attempt_count))).toISOString() }).eq('id', item.id),
        supabase.from('ac_whatsapp_outbox_attempts').insert({ outbox_id: item.id, attempt_number: item.attempt_count, request_payload: { chatId: item.chat_id, type: item.message_type, hasMedia: Boolean(item.media_payload) }, status: 'failed', error_message: message, started_at: startedAt, completed_at: new Date().toISOString() }),
        terminal && item.campaign_recipient_id ? supabase.from('ac_whatsapp_campaign_recipients').update({ status: 'failed', failure_reason: message }).eq('id', item.campaign_recipient_id) : Promise.resolve(),
        terminal && item.conversation_id ? supabase.from('ac_whatsapp_messages').update({ status: 'failed', error_message: message }).eq('client_message_id', item.client_message_id) : Promise.resolve(),
      ])
      results.push({ id: item.id, status: terminal ? 'failed' : 'retry', error: message })
    }
  }
  return ok({ workerId, claimed: (claimed.data || []).length, results })
}
