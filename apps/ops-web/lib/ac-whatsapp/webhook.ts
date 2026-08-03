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

export function normalizeOpenWAEvent(eventType: string, payload: any) {
  const root = payload?.data ?? payload?.payload ?? payload
  const message = root?.message ?? root
  const idCandidate = pick(message, ['id._serialized','id','messageId','key.id'])
  const fromMe = Boolean(pick(message, ['fromMe','id.fromMe','key.fromMe']))
  const from = String(pick(message, ['from','sender','key.remoteJid','chatId']) || '')
  const to = String(pick(message, ['to','recipient']) || '')
  const chatId = String(pick(message, ['chatId','from','key.remoteJid']) || from || to)
  const body = String(pick(message, ['body','text','message.conversation','message.extendedTextMessage.text','caption']) || '')
  const rawType = String(pick(message, ['type','messageType','mimetype']) || 'text').toLowerCase()
  const ptt = Boolean(pick(message, ['ptt','media.ptt','message.audioMessage.ptt']))
  const type = ptt && (rawType === 'audio' || rawType.startsWith('audio/'))
    ? 'voice'
    : rawType.startsWith('audio/') ? 'audio' : rawType
  const timestampRaw = pick(message, ['timestamp','messageTimestamp','createdAt'])
  const timestamp = typeof timestampRaw === 'number'
    ? new Date(timestampRaw < 10_000_000_000 ? timestampRaw * 1000 : timestampRaw).toISOString()
    : timestampRaw ? new Date(timestampRaw).toISOString() : new Date().toISOString()
  return {
    eventType, root, message, externalMessageId: idCandidate ? String(idCandidate) : null,
    fromMe, from, to, chatId, body, type, timestamp,
    senderName: String(pick(message, ['notifyName','pushName','senderName','contact.name']) || ''),
    ack: pick(message, ['ack','status','messageStatus']),
    hasMedia: Boolean(pick(message, ['hasMedia','media','message.imageMessage','message.documentMessage','message.audioMessage','message.videoMessage'])),
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
