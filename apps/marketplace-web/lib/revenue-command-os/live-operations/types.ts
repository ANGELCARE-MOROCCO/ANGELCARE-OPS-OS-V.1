export type LiveEntityType = 'objective'|'strategy'|'program'|'mission'|'task'|'exception'
export type LiveOperation = 'create'|'update'|'activate'|'start'|'pause'|'resume'|'complete'|'close'|'reopen'|'cancel'|'archive'|'delete'|'assign'|'reassign'|'retry'|'publish'|'unpublish'|'execute'|'schedule'|'reschedule'
export interface LiveOperationInput {
  tenantId: string
  actorId: string
  actorLabel: string
  entityType: LiveEntityType
  operation: LiveOperation
  entityId?: string
  entityIds?: string[]
  reason?: string
  changes?: Record<string, unknown>
}
export interface LiveOperationResult { entityType: LiveEntityType; operation: LiveOperation; entityId: string; previousStatus?: string; status?: string; deleted?: boolean; row?: Record<string, unknown>; result?: unknown; executedAt: string }
