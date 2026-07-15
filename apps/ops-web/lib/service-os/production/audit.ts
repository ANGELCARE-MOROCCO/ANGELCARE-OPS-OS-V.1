import { upsertServiceOSRecord } from './repository'
export async function writeServiceOSAudit(entityType: string, entityId: string, action: string, actor = 'system', payload: Record<string, unknown> = {}) {
  return upsertServiceOSRecord('serviceos_audit_events', { id:`audit_${Date.now()}_${Math.random().toString(36).slice(2)}`, entityType, entityId, action, actor, payload, createdAt:new Date().toISOString() })
}
