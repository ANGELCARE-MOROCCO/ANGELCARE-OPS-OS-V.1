import { MarketplaceError } from '../server/errors'
import type { OperatingCaseStatus, OperatingPriority, OperatingRisk } from './types'

export const OPERATING_CASE_STATUSES: OperatingCaseStatus[] = [
  'open','intake','validation','qualified','ready','in_progress','evidence_pending',
  'approval_pending','blocked','recovery','reconciled','closed','cancelled',
]
export const OPERATING_PRIORITIES: OperatingPriority[] = ['low','normal','high','urgent','critical']
export const OPERATING_RISKS: OperatingRisk[] = ['low','normal','high','critical']

const transitions: Record<OperatingCaseStatus, OperatingCaseStatus[]> = {
  open:['intake','validation','in_progress','blocked','cancelled'],
  intake:['validation','blocked','cancelled'],
  validation:['qualified','ready','blocked','cancelled'],
  qualified:['ready','in_progress','blocked','cancelled'],
  ready:['in_progress','blocked','cancelled'],
  in_progress:['evidence_pending','approval_pending','blocked','recovery','reconciled','cancelled'],
  evidence_pending:['in_progress','approval_pending','blocked','recovery'],
  approval_pending:['in_progress','reconciled','blocked','recovery','cancelled'],
  blocked:['in_progress','recovery','cancelled'],
  recovery:['in_progress','evidence_pending','reconciled','cancelled'],
  reconciled:['closed','recovery'],
  closed:[],
  cancelled:[],
}

export function assertOperatingCaseTransition(current: OperatingCaseStatus, next: OperatingCaseStatus) {
  if (!OPERATING_CASE_STATUSES.includes(next) || !transitions[current]?.includes(next)) {
    throw new MarketplaceError('INVALID_STATE_TRANSITION', `Transition dossier interdite : ${current} → ${next}.`)
  }
}

export function operatingPriority(value: unknown): OperatingPriority {
  const candidate = String(value || 'normal') as OperatingPriority
  return OPERATING_PRIORITIES.includes(candidate) ? candidate : 'normal'
}

export function operatingRisk(value: unknown): OperatingRisk {
  const candidate = String(value || 'normal') as OperatingRisk
  return OPERATING_RISKS.includes(candidate) ? candidate : 'normal'
}

export function assertUuid(value: unknown, label: string): string {
  const text = String(value || '').trim()
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(text)) {
    throw new MarketplaceError('VALIDATION_ERROR', `${label} invalide.`)
  }
  return text
}

export function textArray(value: unknown, max = 30): string[] {
  return Array.isArray(value)
    ? [...new Set(value.map((item) => String(item).trim()).filter(Boolean))].slice(0, max)
    : []
}
