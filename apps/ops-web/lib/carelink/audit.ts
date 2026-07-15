export interface CareLinkAuditEventInput {
  action: string
  entityType: string
  entityId: string
  actorId?: string
  payload?: Record<string, unknown>
}

export async function recordCareLinkAuditEvent(event: CareLinkAuditEventInput) {
  return { ok: true, recordedAt: new Date().toISOString(), event }
}
