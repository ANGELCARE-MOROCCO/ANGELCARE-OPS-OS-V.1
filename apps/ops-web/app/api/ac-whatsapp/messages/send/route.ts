import { NextRequest } from 'next/server'
import { acContext, actorName, actorRole, audit, canAccessConversationRow, fail, hasAccountCapability, ok } from '@/lib/ac-whatsapp/server'
import { openwa } from '@/lib/ac-whatsapp/openwa-client'

export const runtime = 'nodejs'

const MEDIA_BUCKET = 'ac-whatsapp-media'
const MEDIA_TYPES = new Set(['image', 'video', 'audio', 'voice', 'document'])
const MAX_MEDIA_BYTES = 50 * 1024 * 1024

function externalId(sent: any) {
  return String(sent?.messageId?._serialized || sent?.messageId || sent?.id?._serialized || sent?.id || sent?._serialized || '') || null
}

function sanitizeFileName(value: unknown, fallback: string) {
  const fileName = String(value || fallback).trim() || fallback
  return fileName.replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 180)
}

function decodeBase64(value: string) {
  const normalized = value.includes(',') ? value.slice(value.indexOf(',') + 1) : value
  return Buffer.from(normalized, 'base64')
}

function mediaPreview(messageType: string, caption: string) {
  if (messageType === 'voice') return 'MESSAGE VOCAL'
  if (messageType === 'audio') return `AUDIO${caption ? `: ${caption}` : ''}`
  return `${messageType.toUpperCase()}${caption ? `: ${caption}` : ''}`
}

async function persistOutboundAttachment(
  context: any,
  input: {
    messageId: string
    accountId: string
    conversationId: string
    media: Record<string, any>
    messageType: string
  },
) {
  const { media, messageId, accountId, conversationId, messageType } = input
  const fallbackExtension = messageType === 'voice' ? 'webm' : 'bin'
  const fileName = sanitizeFileName(media.filename, `${messageId}.${fallbackExtension}`)
  const metadata: Record<string, unknown> = {
    outbound: true,
    ptt: messageType === 'voice' || media.ptt === true,
  }
  let storagePath: string | null = typeof media.storagePath === 'string' && media.storagePath ? media.storagePath : null
  let storageProvider = storagePath ? 'supabase' : media.url ? 'remote' : 'inline'
  let sizeBytes = Number(media.size || media.sizeBytes || 0) || null

  if (!storagePath && typeof media.base64 === 'string' && media.base64) {
    try {
      const buffer = decodeBase64(media.base64)
      sizeBytes = buffer.length
      if (buffer.length > MAX_MEDIA_BYTES) {
        metadata.storage_error = 'MEDIA_OVER_50MB'
      } else {
        storagePath = `${accountId}/${conversationId}/${messageId}-${fileName}`
        const uploaded = await context.supabase.storage.from(MEDIA_BUCKET).upload(storagePath, buffer, {
          contentType: String(media.mimetype || 'application/octet-stream'),
          upsert: true,
        })
        if (uploaded.error) {
          metadata.storage_error = uploaded.error.message
          storagePath = null
        } else {
          storageProvider = 'supabase'
        }
      }
    } catch (cause) {
      metadata.storage_error = cause instanceof Error ? cause.message : String(cause)
    }
  }

  const attachment = await context.supabase.from('ac_whatsapp_attachments').insert({
    message_id: messageId,
    storage_provider: storageProvider,
    storage_path: storagePath,
    source_url: media.url || null,
    file_name: fileName,
    mime_type: media.mimetype || null,
    size_bytes: sizeBytes,
    metadata,
  })

  if (attachment.error) {
    await context.supabase.from('ac_whatsapp_security_events').insert({
      severity: 'medium',
      event_type: 'media.outbound_persistence_failed',
      title: 'Copie locale du média non conservée',
      description: attachment.error.message,
      account_id: accountId,
      metadata: { messageId, conversationId, messageType },
    })
  }
}

export async function POST(request: NextRequest) {
  const context = await acContext(request, 'ac-whatsapp.message.send')
  if ('error' in context) return context.error
  const body = await request.json().catch(() => ({}))
  const conversationId = String(body.conversationId || '')
  const text = String(body.text || '').trim()
  const internalNote = body.internalNote === true || String(body.messageType || '').toLowerCase() === 'internal'
  const messageType = internalNote ? 'note' : String(body.messageType || 'text').toLowerCase()
  const incomingMedia = body.media && typeof body.media === 'object' ? body.media as Record<string, any> : null
  const media: Record<string, any> | null = incomingMedia ? {
    ...incomingMedia,
    ...(messageType === 'voice' ? { ptt: true } : {}),
  } : null

  if (!conversationId) return fail('CONVERSATION_REQUIRED', 422)
  if ((messageType === 'text' || internalNote) && !text) return fail('TEXT_REQUIRED', 422)
  if (!internalNote && messageType !== 'text' && (!MEDIA_TYPES.has(messageType) || !media || (!media.url && !media.base64 && !media.storagePath))) return fail('VALID_MEDIA_REQUIRED', 422)
  if (typeof media?.base64 === 'string' && media.base64.length > 70_000_000) return fail('MEDIA_TOO_LARGE', 413)

  const conv = await context.supabase.from('ac_whatsapp_conversations').select('*,account:ac_whatsapp_accounts(*),contact:ac_whatsapp_contacts(*)').eq('id', conversationId).maybeSingle()
  if (conv.error) return fail(conv.error.message, 500)
  if (!conv.data) return fail('CONVERSATION_NOT_FOUND', 404)
  if (!canAccessConversationRow(context, conv.data)) return fail('CONVERSATION_ACCESS_DENIED', 403)
  if (media?.storagePath) {
    const requiredPrefix = `${conv.data.account_id}/${conversationId}/`
    if (!String(media.storagePath).startsWith(requiredPrefix)) return fail('INVALID_MEDIA_STORAGE_PATH', 403)
  }

  const now = new Date().toISOString()
  const senderName = actorName(context.user)
  const senderRole = actorRole(context.user)

  if (internalNote) {
    const note = await context.supabase.from('ac_whatsapp_messages').insert({
      account_id: conv.data.account_id,
      conversation_id: conversationId,
      contact_id: conv.data.contact_id,
      client_message_id: crypto.randomUUID(),
      direction: 'internal',
      message_type: 'note',
      body: text,
      status: 'received',
      sender_user_id: context.user.id,
      sender_display_name_snapshot: senderName,
      sender_role_snapshot: senderRole,
      sender_type: 'internal_user',
      message_origin: 'internal_note',
      created_at: now,
    }).select('*').single()
    if (note.error) return fail(note.error.message, 500)
    await context.supabase.from('ac_whatsapp_conversations').update({ message_count: (conv.data.message_count || 0) + 1 }).eq('id', conversationId)
    await context.supabase.from('ac_whatsapp_conversation_events').insert({ conversation_id: conversationId, event_type: 'conversation.internal_note_added', actor_user_id: context.user.id, reason: 'Note interne', metadata: { message_id: note.data.id, actor_display_name_snapshot: senderName, actor_role_snapshot: senderRole } })
    await audit(context, { action: 'message.internal_note', entityType: 'message', entityId: note.data.id, newState: { conversationId, senderName, senderRole } })
    return ok({ ...note.data, sender_identity: { display_name: senderName, role: senderRole, type: 'internal_user', origin: 'internal_note' } }, { status: 201 })
  }

  if (!hasAccountCapability(context, conv.data.account_id, 'send')) return fail('CONVERSATION_ACCESS_DENIED', 403)
  const account: any = conv.data.account
  if (!account?.openwa_session_id) return fail('ACCOUNT_SESSION_NOT_CONFIGURED', 409)
  if (account.outbound_enabled === false) return fail('ACCOUNT_OUTBOUND_PAUSED', 409)

  const clientMessageId = crypto.randomUUID()
  const caption = String(body.caption || text || media?.caption || '').trim()
  const message = await context.supabase.from('ac_whatsapp_messages').insert({
    account_id: conv.data.account_id,
    conversation_id: conversationId,
    contact_id: conv.data.contact_id,
    client_message_id: clientMessageId,
    direction: 'outbound',
    message_type: messageType,
    body: messageType === 'text' ? text : null,
    caption: messageType === 'text' || messageType === 'voice' ? null : caption || null,
    status: 'queued',
    sender_user_id: context.user.id,
    sender_display_name_snapshot: senderName,
    sender_role_snapshot: senderRole,
    sender_type: 'angelcare_user',
    message_origin: 'manual_operator',
    recipient_whatsapp_id: conv.data.remote_chat_id,
    created_at: now,
  }).select('*').single()
  if (message.error) return fail(message.error.message, 500)

  const outbox = await context.supabase.from('ac_whatsapp_outbox').insert({
    client_message_id: clientMessageId,
    account_id: conv.data.account_id,
    conversation_id: conversationId,
    contact_id: conv.data.contact_id,
    message_type: messageType,
    chat_id: conv.data.remote_chat_id,
    body: messageType === 'text' ? text : caption || null,
    media_payload: media,
    status: 'processing',
    locked_by: 'nextjs-direct',
    locked_at: now,
    attempt_count: 1,
    created_by: context.user.id,
  }).select('*').single()
  if (outbox.error) return fail(outbox.error.message, 500)

  if (media) {
    await persistOutboundAttachment(context, {
      messageId: message.data.id,
      accountId: conv.data.account_id,
      conversationId,
      media,
      messageType,
    })
  }

  try {
    let transportMedia = media || {}
    if (media?.storagePath) {
      const signed = await context.supabase.storage.from(MEDIA_BUCKET).createSignedUrl(String(media.storagePath), 15 * 60)
      if (signed.error) throw new Error(signed.error.message)
      transportMedia = { ...media, url: signed.data.signedUrl }
      delete transportMedia.storagePath
      delete transportMedia.base64
    }
    const sent: any = messageType === 'text'
      ? await openwa.sendText(account.openwa_session_id, conv.data.remote_chat_id, text)
      : await openwa.sendMedia(account.openwa_session_id, messageType, conv.data.remote_chat_id, transportMedia, caption)
    const external = externalId(sent)
    const sentAt = new Date().toISOString()
    const preview = messageType === 'text' ? text : mediaPreview(messageType, caption)
    await Promise.all([
      context.supabase.from('ac_whatsapp_messages').update({ status: 'sent', external_message_id: external, sent_at: sentAt }).eq('id', message.data.id),
      context.supabase.from('ac_whatsapp_outbox').update({ status: 'sent', external_message_id: external, locked_at: null, locked_by: null }).eq('id', outbox.data.id),
      context.supabase.from('ac_whatsapp_conversations').update({ status: 'waiting_customer', unread_count: 0, last_message_preview: preview, last_message_direction: 'outbound', last_message_at: sentAt, last_message_sender_display_name_snapshot: senderName, last_message_sender_type: 'angelcare_user', message_count: (conv.data.message_count || 0) + 1 }).eq('id', conversationId),
    ])
    await audit(context, { action: messageType === 'voice' ? 'message.voice.send' : 'message.send', entityType: 'message', entityId: message.data.id, newState: { externalMessageId: external, conversationId, messageType, senderName, senderRole } })
    return ok({ ...message.data, status: 'sent', external_message_id: external, sent_at: sentAt, sender_identity: { display_name: senderName, role: senderRole, type: 'angelcare_user', origin: 'manual_operator' } }, { status: 201 })
  } catch (cause) {
    const error = cause instanceof Error ? cause.message : 'OPENWA_SEND_FAILED'
    await Promise.all([
      context.supabase.from('ac_whatsapp_messages').update({ status: 'queued', error_message: error }).eq('id', message.data.id),
      context.supabase.from('ac_whatsapp_outbox').update({ status: 'queued', last_error: error, locked_at: null, locked_by: null, available_at: new Date(Date.now() + 15000).toISOString() }).eq('id', outbox.data.id),
    ])
    return ok({ ...message.data, status: 'queued', error_message: error, sender_identity: { display_name: senderName, role: senderRole, type: 'angelcare_user', origin: 'manual_operator' } }, { status: 202 })
  }
}
