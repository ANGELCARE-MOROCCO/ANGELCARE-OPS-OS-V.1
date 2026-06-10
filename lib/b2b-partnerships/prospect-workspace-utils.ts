import type { B2BProspect } from './prospect-workspace-types'

export function formatMAD(value?: number | null) {
  return new Intl.NumberFormat('fr-MA', {
    style: 'currency',
    currency: 'MAD',
    maximumFractionDigits: 0,
  }).format(Number(value ?? 0))
}

export function formatDate(value?: string | null) {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '—'
  return new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(date)
}

export function formatDateTime(value?: string | null) {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '—'
  return new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}

export function isOverdue(value?: string | null) {
  if (!value) return false
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return false
  return date.getTime() < Date.now()
}

export function relationshipLabel(value?: string | null) {
  if (value === 'Hot') return 'Chaud'
  if (value === 'Warm') return 'Tiède'
  return 'Froid'
}

export function calculateProspectScore(prospect: B2BProspect) {
  const scores = [
    prospect.fit_score,
    prospect.urgency_score,
    prospect.decision_power_score,
    prospect.revenue_potential_score,
  ].map((value) => Number(value ?? 0))

  const active = scores.filter((score) => score > 0)
  if (!active.length) return 0
  return Math.round(active.reduce((sum, score) => sum + score, 0) / active.length)
}

export function sectorGroup(sector?: string | null) {
  if (!sector) return 'Autre'
  if (['Hotel', 'Resort', 'Family hotel', 'Boutique hotel', 'Event venue'].includes(sector)) return 'Hospitality'
  if (
    [
      'Pediatric clinic',
      'Pediatrician',
      'Child development center',
      'Orthophonist',
      'Psychomotor specialist',
      'Family wellness center',
    ].includes(sector)
  ) {
    return 'Santé enfant'
  }
  return 'Autre'
}

export function safeNumber(value: unknown) {
  const n = Number(value)
  return Number.isFinite(n) ? n : 0
}
