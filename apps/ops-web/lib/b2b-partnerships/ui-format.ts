export function formatMAD(value: number | null | undefined) {
  const safeValue = Number(value ?? 0)
  return new Intl.NumberFormat('fr-MA', {
    style: 'currency',
    currency: 'MAD',
    maximumFractionDigits: 0,
  }).format(Number.isFinite(safeValue) ? safeValue : 0)
}

export function formatNumber(value: number | null | undefined) {
  const safeValue = Number(value ?? 0)
  return new Intl.NumberFormat('fr-MA').format(Number.isFinite(safeValue) ? safeValue : 0)
}

export function formatPercent(value: number | null | undefined) {
  const safeValue = Number(value ?? 0)
  return `${Number.isFinite(safeValue) ? safeValue.toFixed(1) : '0.0'}%`
}

export function formatDate(value: string | null | undefined) {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '—'
  return new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(date)
}

export function isOverdue(value: string | null | undefined) {
  if (!value) return false
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return false
  return date.getTime() < Date.now()
}
