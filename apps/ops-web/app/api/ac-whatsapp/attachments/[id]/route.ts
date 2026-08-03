import { NextRequest } from 'next/server'
import { acContext, canAccessConversationRow, fail, ok } from '@/lib/ac-whatsapp/server'
import { openwa } from '@/lib/ac-whatsapp/openwa-client'

export const runtime = 'nodejs'

const MEDIA_BUCKET = 'ac-whatsapp-media'
const MAX_MEDIA_BYTES = 50 * 1024 * 1024

function safeFileName(value: unknown, fallback: string) {
  return String(value || fallback).replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 180)
}

function extension(mimeType: unknown) {
  const mime = String(mimeType || '').toLowerCase()
  if (mime.includes('ogg')) return 'ogg'
  if (mime.includes('webm')) return 'webm'
  if (mime.includes('mpeg')) return 'mp3'
  if (mime.includes('mp4')) return 'm4a'
  if (mime.includes('wav')) return 'wav'
  return 'bin'
}

function externalMessageId(item: Record<string, any>) {
  return String(item.id || item.messageId || item.waMessageId || item.key?.id || '')
}

function decodeBase64(value: string) {
  const normalized = value.includes(',') ? value.slice(value.indexOf(',') + 1) : value
  return Buffer.from(normalized, 'base64')
}

async function signedUrl(context: any, storagePath: string, fileName?: string | null, mimeType?: string | null) {
  const signed = await context.supabase.storage.from(MEDIA_BUCKET).createSignedUrl(storagePath, 300)
  if (signed.error) return { error: signed.error.message } as const
  return { data: { url: signed.data.signedUrl, fileName: fileName || null, mimeType: mimeType || null, expiresIn: 300 } } as const
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const context = await acContext(request, 'ac-whatsapp.inbox.view')
  if ('error' in context) return context.error
  const { id } = await params

  const row = await context.supabase
    .from('ac_whatsapp_attachments')
    .select('*,message:ac_whatsapp_messages(id,conversation_id,external_message_id,message_type,conversation:ac_whatsapp_conversations(*,account:ac_whatsapp_accounts(id,openwa_session_id)))')
    .eq('id', id)
    .maybeSingle()

  if (row.error) return fail(row.error.message, 500)
  if (!row.data) return fail('ATTACHMENT_NOT_FOUND', 404)

  const message = (row.data as any).message
  const conversation = message?.conversation
  if (!canAccessConversationRow(context, conversation)) return fail('ATTACHMENT_ACCESS_DENIED', 403)

  if (row.data.source_url) return ok({ url: row.data.source_url, fileName: row.data.file_name, mimeType: row.data.mime_type })
  if (row.data.storage_path) {
    const signed = await signedUrl(context, row.data.storage_path, row.data.file_name, row.data.mime_type)
    if ('error' in signed) return fail(signed.error, 500)
    return ok(signed.data)
  }

  const sessionId = String(conversation?.account?.openwa_session_id || '')
  const chatId = String(conversation?.remote_chat_id || '')
  const messageId = String(message?.external_message_id || '')
  if (!sessionId || !chatId || !messageId) return fail('ATTACHMENT_BINARY_UNAVAILABLE', 404)

  try {
    const history = await openwa.getChatHistory(sessionId, chatId, 100, true)
    const source = history.find((item) => externalMessageId(item as Record<string, any>) === messageId) as Record<string, any> | undefined
    const media = source?.media as Record<string, any> | undefined
    if (!media?.data || typeof media.data !== 'string') return fail('ATTACHMENT_BINARY_UNAVAILABLE', 404, { mediaOmitted: Boolean(media?.omitted) })

    const buffer = decodeBase64(media.data)
    if (!buffer.length) return fail('ATTACHMENT_BINARY_UNAVAILABLE', 404)
    if (buffer.length > MAX_MEDIA_BYTES) return fail('ATTACHMENT_TOO_LARGE', 413)

    const mimeType = String(media.mimetype || row.data.mime_type || 'application/octet-stream')
    const fileName = safeFileName(media.filename || row.data.file_name, `${messageId}.${extension(mimeType)}`)
    const storagePath = `${conversation.account_id}/${conversation.id}/${message.id}-${fileName}`
    const upload = await context.supabase.storage.from(MEDIA_BUCKET).upload(storagePath, buffer, {
      contentType: mimeType,
      upsert: true,
    })
    if (upload.error) return fail(upload.error.message, 500)

    const updated = await context.supabase.from('ac_whatsapp_attachments').update({
      storage_provider: 'supabase',
      storage_path: storagePath,
      file_name: fileName,
      mime_type: mimeType,
      size_bytes: buffer.length,
      metadata: {
        ...(row.data.metadata || {}),
        omitted: false,
        hydrated_from_openwa_at: new Date().toISOString(),
      },
    }).eq('id', id)
    if (updated.error) return fail(updated.error.message, 500)

    const signed = await signedUrl(context, storagePath, fileName, mimeType)
    if ('error' in signed) return fail(signed.error, 500)
    return ok(signed.data)
  } catch (cause) {
    return fail('ATTACHMENT_REHYDRATION_FAILED', 502, cause instanceof Error ? cause.message : String(cause))
  }
}
