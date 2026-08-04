import { NextRequest } from 'next/server'
import { acContext, canAccessConversationRow, fail, ok } from '@/lib/ac-whatsapp/server'
import { createMediaVaultDownloadUrl, ingestOpenWAMedia, mediaVaultStorageKey } from '@/lib/ac-whatsapp/media-vault'

export const runtime = 'nodejs'

const LEGACY_MEDIA_BUCKET = 'ac-whatsapp-media'
const MAX_MEDIA_BYTES = 50 * 1024 * 1024

function safeFileName(value: unknown, fallback: string) {
  return String(value || fallback).replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 180)
}

function extension(mimeType: unknown) {
  const mime = String(mimeType || '').toLowerCase()
  if (mime.includes('ogg')) return 'ogg'
  if (mime.includes('webm')) return 'webm'
  if (mime.includes('mpeg')) return 'mp3'
  if (mime.includes('mp4')) return 'mp4'
  if (mime.includes('jpeg')) return 'jpg'
  if (mime.includes('png')) return 'png'
  if (mime.includes('pdf')) return 'pdf'
  return 'bin'
}

function responseForWindows(storageKey: string, fileName?: string | null, mimeType?: string | null) {
  const signed = createMediaVaultDownloadUrl(storageKey, { expiresInSeconds: 300, disposition: 'inline' })
  return { url: signed.url, fileName: fileName || null, mimeType: mimeType || null, expiresIn: signed.expiresIn }
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

  const provider = String(row.data.storage_provider || '')
  if (row.data.storage_path && provider === 'windows') {
    return ok(responseForWindows(row.data.storage_path, row.data.file_name, row.data.mime_type))
  }

  if (row.data.source_url && provider === 'remote') {
    return ok({ url: row.data.source_url, fileName: row.data.file_name, mimeType: row.data.mime_type })
  }

  if (row.data.storage_path && provider === 'supabase') {
    const signed = await context.supabase.storage.from(LEGACY_MEDIA_BUCKET).createSignedUrl(row.data.storage_path, 300)
    if (signed.error) return fail(signed.error.message, 500)
    return ok({ url: signed.data.signedUrl, fileName: row.data.file_name, mimeType: row.data.mime_type, expiresIn: 300 })
  }

  const sessionId = String(conversation?.account?.openwa_session_id || '')
  const chatId = String(conversation?.remote_chat_id || '')
  const externalMessageId = String(message?.external_message_id || '')
  if (!sessionId || !chatId || !externalMessageId) return fail('ATTACHMENT_BINARY_UNAVAILABLE', 404)

  const mimeType = String(row.data.mime_type || 'application/octet-stream')
  const fileName = safeFileName(row.data.file_name, `${externalMessageId}.${extension(mimeType)}`)
  const storageKey = String(row.data.storage_path || '') || mediaVaultStorageKey({
    accountId: conversation.account_id,
    conversationId: conversation.id,
    category: 'inbound',
    objectId: message.id,
    fileName,
  })

  try {
    const receipt = await ingestOpenWAMedia({
      storageKey,
      sessionId,
      chatId,
      externalMessageId,
      fileName,
      mimeType,
      maxBytes: MAX_MEDIA_BYTES,
    })

    const updated = await context.supabase.from('ac_whatsapp_attachments').update({
      storage_provider: 'windows',
      storage_path: receipt.storageKey,
      storage_host: process.env.AC_WHATSAPP_MEDIA_VAULT_BASE_URL || null,
      file_name: receipt.fileName || fileName,
      mime_type: receipt.mimeType || mimeType,
      size_bytes: receipt.sizeBytes,
      checksum: receipt.sha256,
      verified_at: new Date().toISOString(),
      migration_status: 'ready',
      metadata: {
        ...(row.data.metadata || {}),
        omitted: false,
        hydrated_from_openwa_at: new Date().toISOString(),
        primary_storage: 'windows',
      },
    }).eq('id', id)
    if (updated.error) return fail(updated.error.message, 500)

    return ok(responseForWindows(receipt.storageKey, receipt.fileName, receipt.mimeType))
  } catch (cause) {
    await context.supabase.from('ac_whatsapp_attachments').update({
      storage_provider: 'windows_pending',
      storage_path: storageKey,
      migration_status: 'ingest_failed',
      metadata: {
        ...(row.data.metadata || {}),
        ingest_error: cause instanceof Error ? cause.message : String(cause),
        ingest_last_attempt_at: new Date().toISOString(),
      },
    }).eq('id', id)
    return fail('ATTACHMENT_REHYDRATION_FAILED', 502, cause instanceof Error ? cause.message : String(cause))
  }
}
