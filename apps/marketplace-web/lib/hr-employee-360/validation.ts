import type {
  Employee360DomainKey,
  Employee360MutationRequest,
  EmployeeLifecycleState,
  JsonObject,
} from './types'

export const EMPLOYEE_LIFECYCLE_STATES: EmployeeLifecycleState[] = [
  'draft',
  'preboarding',
  'probation',
  'active',
  'on_leave',
  'suspended',
  'transferred',
  'promoted',
  'notice_period',
  'terminated',
  'archived',
  'rehired',
]

export const EMPLOYEE_360_DOMAINS: Employee360DomainKey[] = [
  'attendance',
  'leave',
  'payroll',
  'planning',
  'documents',
  'contracts',
  'onboarding',
  'training',
  'performance',
  'communications',
  'tasks',
  'approvals',
  'incidents',
]

const TRANSITIONS: Record<EmployeeLifecycleState, EmployeeLifecycleState[]> = {
  draft: ['preboarding', 'active', 'archived'],
  preboarding: ['probation', 'active', 'archived'],
  probation: ['active', 'suspended', 'notice_period', 'terminated', 'archived'],
  active: ['on_leave', 'suspended', 'transferred', 'promoted', 'notice_period', 'terminated', 'archived'],
  on_leave: ['active', 'suspended', 'notice_period', 'terminated', 'archived'],
  suspended: ['active', 'notice_period', 'terminated', 'archived'],
  transferred: ['active', 'promoted', 'notice_period', 'terminated', 'archived'],
  promoted: ['active', 'transferred', 'notice_period', 'terminated', 'archived'],
  notice_period: ['active', 'terminated', 'archived'],
  terminated: ['rehired', 'archived'],
  archived: ['rehired'],
  rehired: ['probation', 'active', 'archived'],
}

export function assertLifecycleTransition(
  fromState: EmployeeLifecycleState,
  toState: EmployeeLifecycleState,
): void {
  if (!TRANSITIONS[fromState]?.includes(toState)) {
    throw Object.assign(
      new Error(`Transition de cycle de vie interdite: ${fromState} → ${toState}.`),
      { status: 409, code: 'INVALID_LIFECYCLE_TRANSITION' },
    )
  }
}

export function cleanText(value: unknown, maximum = 5000): string | null {
  if (value === null || value === undefined) return null
  const normalized = String(value).trim()
  if (!normalized) return null
  return normalized.slice(0, maximum)
}

export function cleanNumber(value: unknown): number | null {
  if (value === null || value === undefined || value === '') return null
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : null
}

export function cleanBoolean(value: unknown, fallback = false): boolean {
  if (typeof value === 'boolean') return value
  const normalized = String(value || '').trim().toLowerCase()
  if (['true', '1', 'yes', 'oui'].includes(normalized)) return true
  if (['false', '0', 'no', 'non'].includes(normalized)) return false
  return fallback
}

export function cleanDate(value: unknown): string | null {
  const normalized = cleanText(value, 64)
  if (!normalized) return null
  const timestamp = new Date(normalized).getTime()
  if (!Number.isFinite(timestamp)) {
    throw Object.assign(new Error(`Date invalide: ${normalized}`), { status: 400, code: 'INVALID_DATE' })
  }
  return normalized
}

export function validateMutationRequest(value: unknown): Employee360MutationRequest {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw Object.assign(new Error('Corps de requête Employee 360 invalide.'), { status: 400, code: 'INVALID_BODY' })
  }

  const row = value as Record<string, unknown>
  const action = cleanText(row.action, 80)
  const expectedVersion = cleanNumber(row.expectedVersion)
  const allowedActions = [
    'profile.update',
    'employee.archive',
    'employee.restore',
    'lifecycle.transition',
    'domain.create',
    'domain.update',
    'domain.archive',
    'domain.restore',
    'domain.validate',
    'note.create',
  ]

  if (!action || !allowedActions.includes(action)) {
    throw Object.assign(new Error('Action Employee 360 non reconnue.'), { status: 400, code: 'INVALID_ACTION' })
  }
  if (expectedVersion === null || expectedVersion < 1) {
    throw Object.assign(new Error('Version Employee 360 attendue manquante.'), { status: 400, code: 'EXPECTED_VERSION_REQUIRED' })
  }

  const domain = cleanText(row.domain, 80)
  if (domain && !EMPLOYEE_360_DOMAINS.includes(domain as Employee360DomainKey)) {
    throw Object.assign(new Error('Domaine Employee 360 non reconnu.'), { status: 400, code: 'INVALID_DOMAIN' })
  }

  const targetState = cleanText(row.targetState, 80)
  if (targetState && !EMPLOYEE_LIFECYCLE_STATES.includes(targetState as EmployeeLifecycleState)) {
    throw Object.assign(new Error('État de cycle de vie non reconnu.'), { status: 400, code: 'INVALID_LIFECYCLE_STATE' })
  }

  const payload: JsonObject = {}
  if (row.payload && typeof row.payload === 'object' && !Array.isArray(row.payload)) {
    Object.entries(row.payload as Record<string, unknown>).forEach(([key, item]) => {
      if (
        item === null ||
        typeof item === 'string' ||
        typeof item === 'number' ||
        typeof item === 'boolean' ||
        Array.isArray(item) ||
        (typeof item === 'object' && item !== null)
      ) {
        payload[key] = item as JsonObject[string]
      }
    })
  }

  return {
    action: action as Employee360MutationRequest['action'],
    expectedVersion,
    domain: domain as Employee360DomainKey | undefined,
    recordId: cleanText(row.recordId, 100) || undefined,
    expectedRecordVersion: cleanNumber(row.expectedRecordVersion) || undefined,
    reason: cleanText(row.reason, 5000) || undefined,
    targetState: targetState as EmployeeLifecycleState | undefined,
    payload,
    idempotencyKey: cleanText(row.idempotencyKey, 160) || undefined,
  }
}
