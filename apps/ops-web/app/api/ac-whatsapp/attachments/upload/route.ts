import { NextRequest } from 'next/server'
import { acContext, canAccessConversationRow, fail, hasAccountCapability, ok } from '@/lib/ac-whatsapp/server'
import { createMediaVaultUploadTicket, mediaVaultConfigured, mediaVaultStorageKey } from '@/lib/ac-whatsapp/media-vault'

export const runtime = 'nodejs'

const MAX_MEDIA_BYTES = 50 * 1024 * 1024
const BLOCKED_EXTENSIONS = new Set([
  'app', 'apk', 'bat', 'cmd', 'com', 'dmg', 'exe', 'jar', 'js', 'msi',
  'pkg', 'ps1', 'scr', 'sh', 'vbs',
])

type MediaMessageType = 'image' | 'video' | 'audio' | 'document'

function safeFileName(value: unknown) {
  const fallback = `attachment-${Date.now()}.bin`
  return String(value || fallback).replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 180) || fallback
}

function extensionOf(fileName: string) {
  const dot = fileName.lastIndexOf('.')
  return dot >= 0 ? fileName.slice(dot + 1).toLowerCase() : ''
}

function messageTypeFor(mimeType: string): MediaMessageType {
  if (mimeType.startsWith('image/')) return 'image'
  if (mimeType.startsWith('video/')) return 'video'
  if (mimeType.startsWith('audio/')) return 'audio'
  return 'document'
}

export async function POST(request: NextRequest) {
  const context = await acContext(request, 'ac-whatsapp.message.send')
  if ('error' in context) return context.error
  if (!mediaVaultConfigured()) return fail('MEDIA_VAULT_NOT_CONFIGURED', 503)

  const body = await request.json().catch(() => ({}))
  const conversationId = String(body.conversationId || '')
  const sizeBytes = Number(body.sizeBytes || 0)
  const mimeType = String(body.mimeType || 'application/octet-stream').toLowerCase()
  const fileName = safeFileName(body.fileName)
  const extension = extensionOf(fileName)

  if (!conversationId) return fail('CONVERSATION_REQUIRED', 422)
  if (!Number.isFinite(sizeBytes) || sizeBytes <= 0) return fail('MEDIA_SIZE_REQUIRED', 422)
  if (sizeBytes > MAX_MEDIA_BYTES) return fail('MEDIA_TOO_LARGE', 413)
  if (BLOCKED_EXTENSIONS.has(extension)) return fail('MEDIA_TYPE_BLOCKED', 422)

  const conversation = await context.supabase
    .from('ac_whatsapp_conversations')
    .select('id,account_id,contact_id,remote_chat_id,account:ac_whatsapp_accounts(id,openwa_session_id,outbound_enabled)')
    .eq('id', conversationId)
    .maybeSingle()

  if (conversation.error) return fail(conversation.error.message, 500)
  if (!conversation.data) return fail('CONVERSATION_NOT_FOUND', 404)
  if (!canAccessConversationRow(context, conversation.data)) return fail('CONVERSATION_ACCESS_DENIED', 403)
  if (!hasAccountCapability(context, conversation.data.account_id, 'send')) return fail('CONVERSATION_ACCESS_DENIED', 403)

  const account: any = conversation.data.account
  if (!account?.openwa_session_id) return fail('ACCOUNT_SESSION_NOT_CONFIGURED', 409)
  if (account.outbound_enabled === false) return fail('ACCOUNT_OUTBOUND_PAUSED', 409)

  const messageType = messageTypeFor(mimeType)
  const storageKey = mediaVaultStorageKey({
    accountId: conversation.data.account_id,
    conversationId,
    category: 'operator-uploads',
    fileName,
  })
  const ticket = createMediaVaultUploadTicket({ storageKey, fileName, mimeType, maxBytes: sizeBytes })

  return ok({
    ...ticket,
    storageProvider: 'windows',
    fileName,
    mimeType,
    sizeBytes,
    messageType,
  })
}
