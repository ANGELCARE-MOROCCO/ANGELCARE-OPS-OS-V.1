export type RevenueRow = Record<string, any>

export function objectOf(value: unknown): Record<string, any> {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, any> : {}
}

export function payloadOf(row: RevenueRow | null | undefined) {
  return objectOf(row?.payload)
}

export function metadataOf(row: RevenueRow | null | undefined) {
  return objectOf(row?.metadata)
}

export function valueOf(row: RevenueRow | null | undefined, key: string): any {
  const payload = payloadOf(row)
  const metadata = metadataOf(row)
  return row?.[key] ?? payload[key] ?? metadata[key] ?? objectOf(metadata.payload)[key] ?? ''
}

export function textOf(row: RevenueRow | null | undefined, key: string, fallback = '') {
  const value = valueOf(row, key)
  if (value === null || value === undefined || value === '') return fallback
  return String(value)
}

export function numberOf(row: RevenueRow | null | undefined, key: string, fallback = 0) {
  const value = Number(valueOf(row, key))
  return Number.isFinite(value) ? value : fallback
}

export function arrayOf(row: RevenueRow | null | undefined, key: string): string[] {
  const value = valueOf(row, key)
  if (Array.isArray(value)) return value.map((item) => String(item)).filter(Boolean)
  if (typeof value === 'string') return value.split(/[|,;]/).map((item) => item.trim()).filter(Boolean)
  return []
}

export function clamp(value: number, min = 0, max = 100) {
  return Math.min(max, Math.max(min, Number.isFinite(value) ? value : min))
}

export function money(value: number) {
  return `${Math.round(value || 0).toLocaleString('fr-FR')} Dh`
}

export function percent(value: number) {
  return `${Math.round(clamp(value))}%`
}

export function dateLabel(value: unknown, fallback = 'Non datée') {
  if (!value) return fallback
  const date = new Date(String(value))
  return Number.isNaN(date.getTime()) ? String(value) : date.toLocaleDateString('fr-FR')
}

export function dateTimeLabel(value: unknown, fallback = '—') {
  if (!value) return fallback
  const date = new Date(String(value))
  return Number.isNaN(date.getTime()) ? String(value) : date.toLocaleString('fr-FR')
}

export function daysRemaining(value: unknown) {
  if (!value) return null
  const date = new Date(String(value))
  if (Number.isNaN(date.getTime())) return null
  return Math.ceil((date.getTime() - Date.now()) / 86_400_000)
}

export function titleOf(row: RevenueRow | null | undefined, fallback = 'Dossier Revenue OS') {
  return textOf(row, 'title', textOf(row, 'code', fallback))
}

export function statusOf(row: RevenueRow | null | undefined) {
  return textOf(row, 'status', 'active').toLowerCase()
}

export function ownerOf(row: RevenueRow | null | undefined) {
  return textOf(row, 'ownerLabel', textOf(row, 'owner_label', textOf(row, 'owner_id', 'Non assigné')))
}

export function deadlineOf(row: RevenueRow | null | undefined) {
  return valueOf(row, 'deadline') || valueOf(row, 'dueAt') || valueOf(row, 'due_at') || valueOf(row, 'due_date')
}

export function parentIdOf(row: RevenueRow | null | undefined, parent: 'objective' | 'strategy' | 'program' | 'mission' | 'exception') {
  const snake = `${parent}_id`
  const camel = `${parent}Id`
  return String(row?.[snake] ?? valueOf(row, camel) ?? valueOf(row, snake) ?? '')
}

export function statusTone(status: string) {
  if (['completed', 'closed', 'resolved', 'succeeded'].includes(status)) return 'emerald'
  if (['failed', 'critical', 'cancelled'].includes(status)) return 'rose'
  if (['paused', 'blocked', 'high'].includes(status)) return 'amber'
  if (['running', 'active', 'ready'].includes(status)) return 'blue'
  return 'slate'
}

export function isOpenStatus(status: string) {
  return !['completed', 'closed', 'resolved', 'cancelled', 'archived'].includes(status)
}

export function safeRatio(numerator: number, denominator: number) {
  return denominator > 0 ? clamp((numerator / denominator) * 100) : 0
}

export function matches(row: RevenueRow, query: string, keys: string[]) {
  if (!query.trim()) return true
  const haystack = keys.map((key) => textOf(row, key)).join(' ').toLowerCase()
  return haystack.includes(query.trim().toLowerCase())
}
