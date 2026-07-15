export function formatMoney(value?: number | null) {
  const amount = Number(value ?? 0)
  return new Intl.NumberFormat('fr-MA', {
    style: 'currency',
    currency: 'MAD',
    maximumFractionDigits: 0,
  }).format(amount)
}

export function formatDate(value?: string | null) {
  if (!value) return '—'
  return new Intl.DateTimeFormat('fr-FR', { dateStyle: 'medium' }).format(new Date(value))
}

export function formatDateTime(value?: string | null) {
  if (!value) return '—'
  return new Intl.DateTimeFormat('fr-FR', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value))
}

export function toDateInput(value?: string | null) {
  if (!value) return ''
  return new Date(value).toISOString().slice(0, 10)
}

export function todayDateInput() {
  return new Date().toISOString().slice(0, 10)
}

export function addDaysDateInput(days: number) {
  const date = new Date()
  date.setDate(date.getDate() + days)
  return date.toISOString().slice(0, 10)
}

export function parseListText(value: string) {
  return value
    .split('\n')
    .map((item) => item.trim())
    .filter(Boolean)
}

export function joinList(value?: string[] | null) {
  return Array.isArray(value) ? value.join('\n') : ''
}

export function proposalStatusTone(status?: string | null) {
  if (['Accepted'].includes(status ?? '')) return 'success'
  if (['Sent', 'Viewed', 'Negotiation'].includes(status ?? '')) return 'active'
  if (['Follow-up Needed', 'Internal Review'].includes(status ?? '')) return 'warning'
  if (['Rejected', 'Expired'].includes(status ?? '')) return 'danger'
  return 'neutral'
}

export function sectorIcon(sector?: string | null) {
  if (['Hotel', 'Resort', 'Family hotel', 'Boutique hotel', 'Event venue'].includes(sector ?? '')) return '🏨'
  if (['Pediatric clinic', 'Pediatrician', 'Child development center', 'Orthophonist', 'Psychomotor specialist', 'Family wellness center'].includes(sector ?? '')) return '🩺'
  if (['School', 'Nursery'].includes(sector ?? '')) return '🎒'
  return '🏢'
}
