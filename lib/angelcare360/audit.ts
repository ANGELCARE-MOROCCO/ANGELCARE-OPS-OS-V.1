import type { Angelcare360ModuleRecord } from '@/types/angelcare360/module'
import { ANGELCARE360_NAMESPACE } from './constants'

export type Angelcare360AuditAction =
  | 'open_shell'
  | 'open_direction'
  | 'open_module'
  | 'search_modules'
  | 'filter_modules'
  | 'toggle_sidebar'
  | 'toggle_drawer'

export interface Angelcare360AuditEvent {
  event: string
  action: Angelcare360AuditAction
  timestamp: string
  moduleId?: string | null
  route?: string | null
  userId?: string | null
  details?: Record<string, unknown>
}

export function buildAngelcare360AuditEvent(input: {
  action: Angelcare360AuditAction
  module?: Pick<Angelcare360ModuleRecord, 'id' | 'label'> | null
  route?: string | null
  userId?: string | null
  details?: Record<string, unknown>
}): Angelcare360AuditEvent {
  return {
    event: `${ANGELCARE360_NAMESPACE}.${input.action}`,
    action: input.action,
    timestamp: new Date().toISOString(),
    moduleId: input.module?.id || null,
    route: input.route || null,
    userId: input.userId || null,
    details: {
      moduleLabel: input.module?.label || null,
      ...(input.details || {}),
    },
  }
}

export async function recordAngelcare360AuditEvent(input: Parameters<typeof buildAngelcare360AuditEvent>[0]) {
  return buildAngelcare360AuditEvent(input)
}

export function getAngelcare360DisabledReason(reason: string) {
  return reason || 'Action verrouillée pendant la phase 1.'
}

