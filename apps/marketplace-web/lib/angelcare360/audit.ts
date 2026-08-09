import type { Angelcare360ModuleRecord } from '@/types/angelcare360/module'
import type { Angelcare360AuditEventInput, Angelcare360AuditSeverity } from '@/types/angelcare360/audit'
import { ANGELCARE360_NAMESPACE } from './constants'

export type Angelcare360AuditAction =
  | 'open_shell'
  | 'open_direction'
  | 'open_module'
  | 'search_modules'
  | 'filter_modules'
  | 'toggle_sidebar'
  | 'toggle_drawer'
  | 'view_dashboard'
  | 'create_record'
  | 'update_record'
  | 'delete_record'
  | 'export_report'

function inferSeverity(action: Angelcare360AuditAction): Angelcare360AuditSeverity {
  if (action === 'delete_record' || action === 'export_report') return 'warning'
  return 'info'
}

function inferCategory(action: Angelcare360AuditAction, moduleId?: string | null) {
  if (moduleId === 'audit-securite' || action === 'delete_record') return 'security'
  if (moduleId === 'frais-paiements' || action === 'export_report') return 'finance'
  if (moduleId === 'presences') return 'attendance'
  if (moduleId === 'admissions') return 'admissions'
  return 'settings'
}

export function buildAngelcare360AuditEvent(input: {
  action: Angelcare360AuditAction
  module?: Pick<Angelcare360ModuleRecord, 'id' | 'label'> | null
  route?: string | null
  userId?: string | null
  schoolId?: string | null
  severity?: Angelcare360AuditSeverity
  entityType?: string | null
  entityId?: string | null
  details?: Record<string, unknown>
}) : Angelcare360AuditEventInput {
  const moduleId = input.module?.id || null
  return {
    category: inferCategory(input.action, moduleId),
    module: moduleId || ANGELCARE360_NAMESPACE,
    action: input.action,
    schoolId: input.schoolId || null,
    actorUserId: input.userId || null,
    actorRole: null,
    entityType: input.entityType || null,
    entityId: input.entityId || null,
    severity: input.severity || inferSeverity(input.action),
    route: input.route || null,
    requestId:
      typeof globalThis.crypto !== 'undefined' && 'randomUUID' in globalThis.crypto
        ? globalThis.crypto.randomUUID()
        : null,
    beforeData: undefined,
    afterData: undefined,
    metadata: {
      moduleLabel: input.module?.label || null,
      details: input.details || {},
    },
  }
}

export async function recordAngelcare360AuditEvent(input: Parameters<typeof buildAngelcare360AuditEvent>[0]) {
  const payload = buildAngelcare360AuditEvent(input)

  if (typeof window === 'undefined') {
    return payload
  }

  try {
    await fetch('/api/angelcare360/audit', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
      },
      body: JSON.stringify(payload),
      credentials: 'same-origin',
    })
  } catch {
    // Audit failures must not break the interactive shell.
  }

  return payload
}

export function getAngelcare360DisabledReason(reason: string) {
  return reason || 'Action verrouillée pendant la phase 1.'
}

