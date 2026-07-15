export function formatMAD(value: number) {
  return new Intl.NumberFormat('fr-MA', {
    style: 'currency',
    currency: 'MAD',
    maximumFractionDigits: 0,
  }).format(value)
}

export function formatCompactMAD(value: number) {
  if (!Number.isFinite(value)) return '0 MAD'

  if (value >= 1000000) {
    return `${(value / 1000000).toFixed(2)}M MAD`
  }

  if (value >= 1000) {
    return `${(value / 1000).toFixed(1)}K MAD`
  }

  return `${Math.round(value)} MAD`
}