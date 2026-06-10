export function formatDateTime(value?: string | null) {
  if (!value) return '—'
  return new Intl.DateTimeFormat('fr-FR', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value))
}

export function formatDate(value?: string | null) {
  if (!value) return '—'
  return new Intl.DateTimeFormat('fr-FR', { dateStyle: 'medium' }).format(new Date(value))
}

export function isOverdue(value?: string | null) {
  if (!value) return false
  return new Date(value).getTime() < Date.now()
}

export function startOfTodayInput() {
  const now = new Date()
  now.setMinutes(now.getMinutes() - now.getTimezoneOffset())
  return now.toISOString().slice(0, 16)
}

export function toDateTimeLocal(value?: string | null) {
  if (!value) return ''
  const date = new Date(value)
  date.setMinutes(date.getMinutes() - date.getTimezoneOffset())
  return date.toISOString().slice(0, 16)
}

export function fromDateTimeLocal(value?: string | null) {
  if (!value) return null
  return new Date(value).toISOString()
}

export function sectorIcon(sector?: string | null) {
  if (['Hotel', 'Resort', 'Family hotel', 'Boutique hotel', 'Event venue'].includes(sector ?? '')) return '🏨'
  if (['Pediatric clinic', 'Pediatrician', 'Child development center', 'Orthophonist', 'Psychomotor specialist', 'Family wellness center'].includes(sector ?? '')) return '🩺'
  if (['School', 'Nursery'].includes(sector ?? '')) return '🎒'
  return '🏢'
}

export function safeCount<T>(items?: T[] | null) {
  return Array.isArray(items) ? items.length : 0
}

export function channelAccent(channel?: string | null) {
  if (channel === 'Email') return 'email'
  if (channel === 'Phone') return 'phone'
  if (channel === 'WhatsApp') return 'whatsapp'
  if (channel === 'LinkedIn') return 'linkedin'
  return 'neutral'
}
