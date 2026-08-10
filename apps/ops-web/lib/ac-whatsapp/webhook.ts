import crypto from 'crypto'

export function verifyOpenWASignature(rawBody: string, signature: string | null, secret: string) {
  if (!signature || !secret || !signature.startsWith('sha256=')) return false
  const expected = `sha256=${crypto.createHmac('sha256', secret).update(rawBody).digest('hex')}`
  const a = Buffer.from(signature); const b = Buffer.from(expected)
  return a.length === b.length && crypto.timingSafeEqual(a,b)
}

function pick(payload: any, paths: string[]) {
  for (const path of paths) {
    const value = path.split('.').reduce((acc: any, key) => acc?.[key], payload)
    if (value !== undefined && value !== null && value !== '') return value
  }
  return undefined
}

function boolish(value: unknown) {
  if (typeof value === 'boolean') return value
  const raw = String(value ?? '').trim().toLowerCase()
  return ['1', 'true', 'yes', 'on'].includes(raw)
}

function cleanType(value: unknown) {
  return String(value ?? '').trim().toLowerCase().replace(/[\s_-]+/g, '')
}

function mediaTypeFromMime(value: unknown, ptt: boolean) {
  const mime = String(value ?? '').trim().toLowerCase()
  if (mime.startsWith('image/')) return 'image'
  if (mime.startsWith('video/')) return 'video'
  if (mime.startsWith('audio/')) return ptt ? 'voice' : 'audio'
  if (mime === 'application/pdf' || mime || mime.startsWith('text/')) return mime ? 'document' : ''
  return ''
}

function canonicalMessageType(rawType: unknown, mimeType: unknown, ptt: boolean, hasMedia: boolean, hasText: boolean, eventType: string) {
  if (eventType === 'message.reaction') return 'reaction'
  if (eventType === 'message.revoked') return 'revoked'
  const raw = cleanType(rawType)
  if (ptt && (raw.includes('audio') || String(mimeType || '').toLowerCase().startsWith('audio/'))) return 'voice'
  if (['chat','text','conversation','extendedtext','extendedtextmessage'].includes(raw)) return 'text'
  if (raw.includes('image')) return 'image'
  if (raw.includes('video')) return 'video'
  if (raw.includes('audio') || raw === 'ptt') return ptt ? 'voice' : 'audio'
  if (raw.includes('document') || raw.includes('file')) return 'document'
  if (raw.includes('sticker')) return 'sticker'
  if (raw.includes('reaction')) return 'reaction'
  if (raw.includes('protocol') || raw.includes('notification') || raw.includes('ciphertext') || raw === 'system') return 'system'
  const fromMime = mediaTypeFromMime(mimeType, ptt)
  if (fromMime) return fromMime
  if (hasText) return 'text'
  if (hasMedia) return 'document'
  return 'unknown'
}

function safeTimestamp(value: unknown) {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return new Date(value < 10_000_000_000 ? value * 1000 : value).toISOString()
  }
  if (value) {
    const date = new Date(String(value))
    if (!Number.isNaN(date.getTime())) return date.toISOString()
  }
  return new Date().toISOString()
}

function previewFor(type: string, body: string, caption: string) {
  const text = body.trim() || caption.trim()
  if (text) return text
  const labels: Record<string, string> = {
    image: 'Image WhatsApp',
    video: 'Vidéo WhatsApp',
    audio: 'Audio WhatsApp',
    voice: 'Message vocal',
    document: 'Document WhatsApp',
    sticker: 'Sticker WhatsApp',
  }
  return labels[type] || ''
}

export function normalizeOpenWAEvent(eventType: string, payload: any) {
  const root = payload?.data ?? payload?.payload ?? payload
  const message = root?.message ?? root
  const idCandidate = pick(message, ['id._serialized','id','messageId','key.id'])
  const fromMe = boolish(pick(message, ['fromMe','id.fromMe','key.fromMe']))
  const from = String(pick(message, ['from','sender','key.remoteJid','chatId']) || '')
  const to = String(pick(message, ['to','recipient']) || '')
  const chatId = String(pick(message, ['chatId','from','key.remoteJid']) || from || to)
  const body = String(pick(message, ['body','text','message.conversation','message.extendedTextMessage.text']) || '')
  const caption = String(pick(message, ['caption','media.caption','message.imageMessage.caption','message.videoMessage.caption','message.documentMessage.caption']) || '')
  const mimeType = String(pick(message, ['mimetype','mimeType','media.mimetype','media.mimeType','message.imageMessage.mimetype','message.documentMessage.mimetype','message.audioMessage.mimetype','message.videoMessage.mimetype']) || '')
  const rawType = pick(message, ['type','messageType','kind','mimetype'])
  const ptt = boolish(pick(message, ['ptt','media.ptt','message.audioMessage.ptt']))
  const hasMedia = boolish(pick(message, ['hasMedia'])) || Boolean(pick(message, ['media','message.imageMessage','message.documentMessage','message.audioMessage','message.videoMessage','message.stickerMessage']))
  const type = canonicalMessageType(rawType, mimeType, ptt, hasMedia, Boolean(body.trim() || caption.trim()), eventType)
  const timestamp = safeTimestamp(pick(message, ['timestamp','messageTimestamp','createdAt']))
  const renderableEvent = ['message.received', 'message.sent', 'message.edited'].includes(eventType)
  const renderable = renderableEvent && (Boolean(body.trim() || caption.trim()) || hasMedia || ['image','video','audio','voice','document','sticker'].includes(type)) && !['reaction','revoked','system'].includes(type)

  return {
    eventType,
    root,
    message,
    externalMessageId: idCandidate ? String(idCandidate) : null,
    fromMe,
    from,
    to,
    chatId,
    body,
    caption,
    mimeType,
    type,
    kind: String(pick(message, ['kind']) || ''),
    timestamp,
    senderName: String(pick(message, ['notifyName','pushName','senderName','contact.pushName','contact.name']) || ''),
    senderPhone: String(pick(message, ['senderPhone','contact.number','contact.phone','phoneNumber']) || ''),
    ack: pick(message, ['ack','status','messageStatus']),
    hasMedia,
    renderable,
    preview: previewFor(type, body, caption),
  }
}

export function mapAckStatus(value: unknown) {
  const raw = String(value ?? '').toLowerCase()
  if (raw === '3' || raw.includes('read')) return 'read'
  if (raw === '2' || raw.includes('deliver')) return 'delivered'
  if (raw === '1' || raw.includes('server') || raw.includes('sent')) return 'sent'
  if (raw.includes('fail') || raw === '-1') return 'failed'
  return 'accepted'
}
