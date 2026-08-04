import { NextRequest } from 'next/server'
import { acContext, actorName, actorRole, audit, canAccessConversationRow, fail, hasAccountCapability, ok } from '@/lib/ac-whatsapp/server'
import { openwa } from '@/lib/ac-whatsapp/openwa-client'
import { createMediaVaultDownloadUrl } from '@/lib/ac-whatsapp/media-vault'

export const runtime = 'nodejs'

const LEGACY_MEDIA_BUCKET = 'ac-whatsapp-media'
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
  const storageKey = String(media.storageKey || media.storagePath || '') || null
  const storageProvider = String(media.storageProvider || (storageKey ? 'supabase' : media.url ? 'remote' : 'inline'))
  const sizeBytes = Number(media.size || media.sizeBytes || 0) || null
  const checksum = String(media.sha256 || media.checksum || '') || null
  const metadata: Record<string, unknown> = {
    outbound: true,
    ptt: messageType === 'voice' || media.ptt === true,
    primary_storage: storageProvider === 'windows',
  }

  const attachment = await context.supabase.from('ac_whatsapp_attachments').insert({
    message_id: messageId,
    storage_provider: storageProvider,
    storage_path: storageKey,
    storage_host: storageProvider === 'windows' ? process.env.AC_WHATSAPP_MEDIA_VAULT_BASE_URL || null : null,
    source_url: storageProvider === 'remote' ? media.url || null : null,
    file_name: fileName,
    mime_type: media.mimetype || null,
    size_bytes: sizeBytes,
    checksum,
    verified_at: storageProvider === 'windows' ? new Date().toISOString() : null,
    migration_status: storageProvider === 'windows' ? 'ready' : 'legacy',
    metadata,
  })

  if (attachment.error) {
    await context.supabase.from('ac_whatsapp_security_events').insert({
      severity: 'medium',
      event_type: 'media.outbound_persistence_failed',
      title: 'Métadonnées du média non conservées',
      description: attachment.error.message,
      account_id: accountId,
      metadata: { messageId, conversationId, messageType, storageProvider },
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
  if (!internalNote && messageType !== 'text' && (!MEDIA_TYPES.has(messageType) || !media || (!media.url && !media.base64 && !media.storagePath && !media.storageKey))) return fail('VALID_MEDIA_REQUIRED', 422)
  if (typeof media?.base64 === 'string' && media.base64.length > 70_000_000) return fail('MEDIA_TOO_LARGE', 413)

  const conv = await context.supabase.from('ac_whatsapp_conversations').select('*,account:ac_whatsapp_accounts(*),contact:ac_whatsapp_contacts(*)').eq('id', conversationId).maybeSingle()
  if (conv.error) return fail(conv.error.message, 500)
  if (!conv.data) return fail('CONVERSATION_NOT_FOUND', 404)
  if (!canAccessConversationRow(context, conv.data)) return fail('CONVERSATION_ACCESS_DENIED', 403)
  const mediaStorageKey = String(media?.storageKey || media?.storagePath || '')
  if (mediaStorageKey) {
    const requiredPrefix = `${conv.data.account_id}/${conversationId}/`
    if (!mediaStorageKey.startsWith(requiredPrefix)) return fail('INVALID_MEDIA_STORAGE_PATH', 403)
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
    let transportMedia: Record<string, any> = media ? { ...media } : {}
    const provider = String(media?.storageProvider || (mediaStorageKey ? 'supabase' : ''))
    if (mediaStorageKey && provider === 'windows') {
      const signed = createMediaVaultDownloadUrl(mediaStorageKey, { expiresInSeconds: 15 * 60, disposition: 'inline' })
      transportMedia = { ...transportMedia, url: signed.url }
      delete transportMedia.storageKey
      delete transportMedia.storagePath
      delete transportMedia.storageProvider
      delete transportMedia.base64
    } else if (mediaStorageKey) {
      const signed = await context.supabase.storage.from(LEGACY_MEDIA_BUCKET).createSignedUrl(mediaStorageKey, 15 * 60)
      if (signed.error) throw new Error(signed.error.message)
      transportMedia = { ...transportMedia, url: signed.data.signedUrl }
      delete transportMedia.storageKey
      delete transportMedia.storagePath
      delete transportMedia.storageProvider
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
