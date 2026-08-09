export type OperationalEntityType = 'objective' | 'strategy' | 'program' | 'mission' | 'task' | 'exception'

export type OperationalDepthAction =
  | 'read'
  | 'update_fields'
  | 'duplicate'
  | 'create_child'
  | 'add_note'
  | 'update_note'
  | 'delete_note'
  | 'link_entity'
  | 'unlink_entity'
  | 'record_outcome'
  | 'create_saved_view'
  | 'delete_saved_view'

export type OperationalNoteKind =
  | 'comment'
  | 'evidence'
  | 'milestone'
  | 'kpi'
  | 'account'
  | 'result'
  | 'checklist'
  | 'recovery'
  | 'decision'

export type OperationalDepthInput = {
  tenantId: string
  actorId: string
  actorLabel: string
  action: OperationalDepthAction
  entityType?: OperationalEntityType
  entityId?: string
  payload?: Record<string, unknown>
}
