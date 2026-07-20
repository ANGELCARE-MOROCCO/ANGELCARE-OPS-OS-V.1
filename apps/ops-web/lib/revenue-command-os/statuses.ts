import type { RevenueOsHealthStatus, RevenueOsObjectiveStatus, RevenueOsPriority } from './types'

export const REVENUE_OS_HEALTH_LABELS: Record<RevenueOsHealthStatus, string> = {
  operational: 'Opérationnel',
  degraded: 'Dégradé',
  attention: 'Attention requise',
  offline: 'Hors ligne',
}

export const REVENUE_OS_OBJECTIVE_STATUS_LABELS: Record<RevenueOsObjectiveStatus, string> = {
  draft: 'Brouillon',
  submitted: 'Soumis',
  validated: 'Validé',
  active: 'Actif',
  paused: 'En pause',
  completed: 'Terminé',
  cancelled: 'Annulé',
}

export const REVENUE_OS_PRIORITY_LABELS: Record<RevenueOsPriority, string> = {
  critical: 'Critique',
  high: 'Haute',
  medium: 'Moyenne',
  low: 'Basse',
}

export const REVENUE_OS_STATUS_DICTIONARY = [
  { domain: 'system_health', key: 'operational', label: 'Opérationnel', severity: 0, terminal: false },
  { domain: 'system_health', key: 'degraded', label: 'Dégradé', severity: 2, terminal: false },
  { domain: 'system_health', key: 'attention', label: 'Attention requise', severity: 3, terminal: false },
  { domain: 'system_health', key: 'offline', label: 'Hors ligne', severity: 4, terminal: true },
  { domain: 'objective', key: 'draft', label: 'Brouillon', severity: 0, terminal: false },
  { domain: 'objective', key: 'submitted', label: 'Soumis', severity: 1, terminal: false },
  { domain: 'objective', key: 'validated', label: 'Validé', severity: 1, terminal: false },
  { domain: 'objective', key: 'active', label: 'Actif', severity: 1, terminal: false },
  { domain: 'objective', key: 'paused', label: 'En pause', severity: 2, terminal: false },
  { domain: 'objective', key: 'completed', label: 'Terminé', severity: 0, terminal: true },
  { domain: 'objective', key: 'cancelled', label: 'Annulé', severity: 2, terminal: true },
  { domain: 'audit_outcome', key: 'success', label: 'Succès', severity: 0, terminal: true },
  { domain: 'audit_outcome', key: 'blocked', label: 'Bloqué', severity: 3, terminal: true },
  { domain: 'audit_outcome', key: 'failure', label: 'Échec', severity: 4, terminal: true },
  { domain: 'audit_outcome', key: 'pending', label: 'En attente', severity: 1, terminal: false },
] as const
