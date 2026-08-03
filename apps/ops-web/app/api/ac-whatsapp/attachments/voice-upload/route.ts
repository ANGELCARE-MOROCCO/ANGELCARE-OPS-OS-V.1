import { NextRequest } from 'next/server'
import { acContext, canAccessConversationRow, fail, hasAccountCapability, ok } from '@/lib/ac-whatsapp/server'

export const runtime = 'nodejs'

const MEDIA_BUCKET = 'ac-whatsapp-media'
const MAX_VOICE_BYTES = 20 * 1024 * 1024

function safeFileName(value: unknown) {
  const fallback = `voice-note-${Date.now()}.webm`
  return String(value || fallback).replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 180) || fallback
}

export async function POST(request: NextRequest) {
  const context = await acContext(request, 'ac-whatsapp.message.send')
  if ('error' in context) return context.error
  const body = await request.json().catch(() => ({}))
  const conversationId = String(body.conversationId || '')
  const sizeBytes = Number(body.sizeBytes || 0)
  const mimeType = String(body.mimeType || '').toLowerCase()
  const fileName = safeFileName(body.fileName)

  if (!conversationId) return fail('CONVERSATION_REQUIRED', 422)
  if (!Number.isFinite(sizeBytes) || sizeBytes <= 0) return fail('VOICE_SIZE_REQUIRED', 422)
  if (sizeBytes > MAX_VOICE_BYTES) return fail('VOICE_TOO_LARGE', 413)
  if (!mimeType.startsWith('audio/')) return fail('VOICE_MIME_REQUIRED', 422)

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

  const storagePath = `${conversation.data.account_id}/${conversationId}/voice-drafts/${crypto.randomUUID()}-${fileName}`
  const ticket = await context.supabase.storage.from(MEDIA_BUCKET).createSignedUploadUrl(storagePath, { upsert: false })
  if (ticket.error) return fail(ticket.error.message, 500)

  return ok({
    bucket: MEDIA_BUCKET,
    path: storagePath,
    token: ticket.data.token,
    signedUrl: ticket.data.signedUrl,
    fileName,
    mimeType,
    sizeBytes,
    expiresIn: 7200,
  })
}
