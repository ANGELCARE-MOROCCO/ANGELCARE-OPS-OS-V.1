import { TERRITORY_HEALTH_LABELS, TERRITORY_STATUS_LABELS } from './constants'
import type { TerritoryHealthStatus, TerritoryStatus } from './types'

export function formatTerritoryStatus(status: TerritoryStatus): string {
  return TERRITORY_STATUS_LABELS[status]
}

export function formatTerritoryHealth(status: TerritoryHealthStatus): string {
  return TERRITORY_HEALTH_LABELS[status]
}

export function formatDate(value: string | null | undefined): string {
  if (!value) return 'Non planifié'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'Date invalide'
  return new Intl.DateTimeFormat('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' }).format(date)
}

export function formatDateTime(value: string | null | undefined): string {
  if (!value) return 'Non renseigné'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'Date invalide'
  return new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
  }).format(date)
}

export function ownerLabel(value: string | null | undefined): string {
  if (!value) return 'À assigner'
  return `Responsable · ${value.slice(0, 8).toUpperCase()}`
}
