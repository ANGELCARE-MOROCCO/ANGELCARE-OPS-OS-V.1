const frDateTime = new Intl.DateTimeFormat('fr-FR', {
  day: '2-digit',
  month: 'long',
  year: 'numeric',
})

const frShortDate = new Intl.DateTimeFormat('fr-FR', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
})

export function formatMad(value: number | string | null | undefined) {
  const amount = typeof value === 'number' ? value : Number(value || 0)
  return `${Number.isFinite(amount) ? amount.toLocaleString('fr-FR') : '0'} MAD`
}

export function formatClientDate(value: string | null | undefined) {
  if (!value) return '—'
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return value
  return frDateTime.format(parsed)
}

export function formatClientShortDate(value: string | null | undefined) {
  if (!value) return '—'
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return value
  return frShortDate.format(parsed)
}

export function formatClientCount(value: number | string | null | undefined, fallback = '0') {
  const amount = typeof value === 'number' ? value : Number(value || 0)
  return Number.isFinite(amount) ? amount.toLocaleString('fr-FR') : fallback
}

export function firstDefinedLabel(...values: Array<string | null | undefined>) {
  for (const value of values) {
    if (value && String(value).trim()) return String(value)
  }
  return '—'
}
