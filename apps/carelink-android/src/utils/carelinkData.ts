export type AnyRecord = Record<string, any>

export function isRecord(value: unknown): value is AnyRecord {
  return Boolean(value && typeof value === 'object' && !Array.isArray(value))
}

export function unwrapPayload<T = any>(data: unknown): T {
  if (isRecord(data) && isRecord(data.data)) return data.data as T
  return data as T
}

export function safeArray<T = AnyRecord>(value: unknown): T[] {
  const payload = unwrapPayload(value)
  if (Array.isArray(payload)) return payload as T[]
  if (!isRecord(payload)) return []
  for (const key of ['items', 'rows', 'records', 'missions', 'messages', 'notifications', 'alerts', 'data', 'results', 'conversations', 'rooms', 'payments', 'history', 'schedule']) {
    const nested = payload[key]
    if (Array.isArray(nested)) return nested as T[]
  }
  return []
}

export function text(value: unknown, fallback = '') {
  if (value === null || value === undefined) return fallback
  const result = String(value).trim()
  return result || fallback
}

export function firstText(source: AnyRecord | null | undefined, keys: string[], fallback = '') {
  if (!source) return fallback
  for (const key of keys) {
    const result = text(source[key])
    if (result) return result
  }
  return fallback
}

export function numberValue(value: unknown, fallback = 0) {
  const next = Number(value)
  return Number.isFinite(next) ? next : fallback
}

export function itemId(item: AnyRecord, fallback = 'item') {
  return text(item.id ?? item.uuid ?? item.message_id ?? item.mission_id ?? item.code, fallback)
}

export function statusTone(status: unknown): 'blue' | 'emerald' | 'amber' | 'rose' | 'slate' {
  const value = text(status).toLowerCase()
  if (['complete', 'completed', 'done', 'closed', 'paid', 'validated', 'ready', 'active', 'sent', 'read'].some((token) => value.includes(token))) return 'emerald'
  if (['incident', 'critical', 'blocked', 'cancel', 'decline', 'rejected', 'failed', 'sos', 'late'].some((token) => value.includes(token))) return 'rose'
  if (['pending', 'assigned', 'draft', 'review', 'validation', 'waiting', 'scheduled'].some((token) => value.includes(token))) return 'amber'
  if (!value) return 'slate'
  return 'blue'
}

export function missionTitle(mission: AnyRecord, fallback = 'Mission CareLink') {
  return firstText(mission, ['title', 'subject', 'familyName', 'family_name', 'client_name', 'service_name', 'code'], fallback)
}

export function missionSubtitle(mission: AnyRecord) {
  return firstText(mission, ['dateLabel', 'scheduledStart', 'scheduled_start', 'start_at', 'window', 'zone', 'address'], 'Synchronisée depuis OPS')
}

export function messageTitle(item: AnyRecord, fallback = 'Message CareLink') {
  return firstText(item, ['title', 'subject', 'sender_name', 'from', 'type'], fallback)
}

export function messageBody(item: AnyRecord) {
  return firstText(item, ['body', 'message', 'content', 'description', 'snippet'], 'Aucun détail disponible.')
}

export function isUnread(item: AnyRecord) {
  if (typeof item.unread === 'boolean') return item.unread
  if (typeof item.is_read === 'boolean') return !item.is_read
  if (typeof item.read === 'boolean') return !item.read
  if (item.read_at || item.readAt) return false
  return false
}
