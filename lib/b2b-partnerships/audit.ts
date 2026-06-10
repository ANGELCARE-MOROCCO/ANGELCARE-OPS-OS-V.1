type B2BAnyDatabaseClient = {
  from: (table: string) => any
}

export async function logB2BAuditEvent(params: {
  db: B2BAnyDatabaseClient
  actorId?: string | null
  entityType: string
  entityId?: string | null
  action: string
  beforeData?: unknown
  afterData?: unknown
  metadata?: Record<string, unknown>
}) {
  const { error } = await params.db.from('b2b_audit_events').insert({
    actor_id: params.actorId ?? null,
    entity_type: params.entityType,
    entity_id: params.entityId ?? null,
    action: params.action,
    before_data: params.beforeData ?? null,
    after_data: params.afterData ?? null,
    metadata: params.metadata ?? {},
  })

  if (error) {
    console.error('[B2B_AUDIT_FAILED]', {
      action: params.action,
      entityType: params.entityType,
      entityId: params.entityId,
      error,
    })
  }
}

export async function logB2BActivity(params: {
  db: B2BAnyDatabaseClient
  prospectId?: string | null
  actorId?: string | null
  activityType: string
  title: string
  description?: string | null
  metadata?: Record<string, unknown>
}) {
  if (!params.prospectId) return

  const { error } = await params.db.from('b2b_activities').insert({
    prospect_id: params.prospectId,
    actor_id: params.actorId ?? null,
    activity_type: params.activityType,
    title: params.title,
    description: params.description ?? null,
    metadata: params.metadata ?? {},
  })

  if (error) {
    console.error('[B2B_ACTIVITY_FAILED]', {
      activityType: params.activityType,
      prospectId: params.prospectId,
      error,
    })
  }
}
